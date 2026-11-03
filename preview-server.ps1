$ErrorActionPreference = "Stop"

$script:AllowedOrigin = "http://127.0.0.1:8765"
$script:SessionLifetime = [TimeSpan]::FromHours(8)
$script:PasswordIterations = 310000
$script:Sessions = @{}
$script:LoginAttempts = @{}
$script:DataRoot = Join-Path $env:LOCALAPPDATA "LittleLibrary"
$script:DataPath = Join-Path $script:DataRoot "library-data.json"

if (-not (Test-Path -LiteralPath $script:DataRoot -PathType Container)) {
    New-Item -ItemType Directory -Path $script:DataRoot -Force | Out-Null
}

if (Test-Path -LiteralPath $script:DataPath -PathType Leaf) {
    try {
        $script:Data = [System.IO.File]::ReadAllText($script:DataPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json -ErrorAction Stop
        if ($script:Data.schemaVersion -ne 1 -or -not $script:Data.PSObject.Properties["credentials"] -or -not $script:Data.PSObject.Properties["books"]) {
            throw "Unsupported library data file."
        }
        $script:Data.books = @($script:Data.books)
        foreach ($book in $script:Data.books) {
            if ($null -eq $book.PSObject.Properties["history"]) {
                Add-Member -InputObject $book -MemberType NoteProperty -Name "history" -Value ([object[]]@()) -Force
            }
            if ($null -eq $book.PSObject.Properties["borrowedAt"]) {
                Add-Member -InputObject $book -MemberType NoteProperty -Name "borrowedAt" -Value "" -Force
            }
        }
    } catch {
        throw "The local library data file could not be read safely. The file was left untouched."
    }
} else {
    $script:Data = $null
}

function Set-SecurityHeaders($Response) {
    $Response.Headers["X-Content-Type-Options"] = "nosniff"
    $Response.Headers["Referrer-Policy"] = "no-referrer"
    $Response.Headers["X-Frame-Options"] = "DENY"
    $Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    $Response.Headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
    $Response.Headers["Cache-Control"] = "no-store"
}

function Send-Json($Context, [int]$Status, $Value) {
    $json = ConvertTo-Json -InputObject $Value -Depth 40 -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $Context.Response.StatusCode = $Status
    $Context.Response.ContentType = "application/json; charset=utf-8"
    $Context.Response.ContentLength64 = $bytes.Length
    $Context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Send-Problem($Context, [int]$Status, [string]$Message) {
    Send-Json $Context $Status @{ error = $Message }
}

function Read-JsonBody($Request, [long]$MaximumBytes = 20000000) {
    if ($Request.ContentLength64 -gt $MaximumBytes) {
        throw "Bad request: The request is too large."
    }
    if ($Request.ContentType -notlike "application/json*") {
        throw "Bad request: Send JSON data."
    }

    $memory = New-Object System.IO.MemoryStream
    $buffer = New-Object byte[] 8192
    try {
        while (($read = $Request.InputStream.Read($buffer, 0, $buffer.Length)) -gt 0) {
            if (($memory.Length + $read) -gt $MaximumBytes) {
                throw "Bad request: The request is too large."
            }
            $memory.Write($buffer, 0, $read)
        }
        if ($memory.Length -eq 0) { throw "Bad request: Request data is missing." }
        $json = [System.Text.Encoding]::UTF8.GetString($memory.ToArray())
        try { return ($json | ConvertFrom-Json -ErrorAction Stop) }
        catch { throw "Bad request: Request data is not valid JSON." }
    } finally {
        $memory.Dispose()
    }
}

function Get-Value($Object, [string]$Name, $Default = $null) {
    if ($null -eq $Object) { return $Default }
    if ($Object -is [System.Collections.IDictionary]) {
        if ($Object.Contains($Name)) { return $Object[$Name] }
        return $Default
    }
    $property = $Object.PSObject.Properties[$Name]
    if ($null -eq $property) { return $Default }
    return $property.Value
}

function New-RandomBytes([int]$Count) {
    $bytes = New-Object byte[] $Count
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($bytes) } finally { $generator.Dispose() }
    return ,$bytes
}

function Get-PasswordHash([string]$Password, [byte[]]$Salt) {
    $derive = [System.Security.Cryptography.Rfc2898DeriveBytes]::new(
        $Password,
        $Salt,
        $script:PasswordIterations,
        [System.Security.Cryptography.HashAlgorithmName]::SHA256
    )
    try { return ,$derive.GetBytes(32) } finally { $derive.Dispose() }
}

function New-PasswordRecord([string]$Password) {
    $salt = New-RandomBytes 16
    $hash = Get-PasswordHash $Password $salt
    return @{
        salt = [Convert]::ToBase64String($salt)
        hash = [Convert]::ToBase64String($hash)
        iterations = $script:PasswordIterations
    }
}

function Test-Password([string]$Password, $Record) {
    try {
        $salt = [Convert]::FromBase64String([string]$Record.salt)
        $expected = [Convert]::FromBase64String([string]$Record.hash)
        $actual = Get-PasswordHash $Password $salt
        if ($actual.Length -ne $expected.Length) { return $false }
        $difference = 0
        for ($index = 0; $index -lt $actual.Length; $index++) {
            $difference = $difference -bor ($actual[$index] -bxor $expected[$index])
        }
        return ($difference -eq 0)
    } catch { return $false }
}

function New-RecoveryCode {
    $rawCode = ([BitConverter]::ToString((New-RandomBytes 16))).Replace("-", "")
    $displayCode = [regex]::Replace($rawCode, "(.{4})(?=.)", '$1-')
    return @{ value = $rawCode; display = $displayCode }
}

function Set-DataValue($Object, [string]$Name, $Value) {
    if ($Object -is [System.Collections.IDictionary]) {
        $Object[$Name] = $Value
        return
    }
    Add-Member -InputObject $Object -MemberType NoteProperty -Name $Name -Value $Value -Force
}

function Revoke-RoleSessions([string]$Role) {
    $tokens = @($script:Sessions.Keys | Where-Object { $script:Sessions[$_].role -eq $Role })
    foreach ($token in $tokens) { $script:Sessions.Remove($token) }
}

function Revoke-RoleSessionsExcept([string]$Role, [string]$KeepToken) {
    $tokens = @($script:Sessions.Keys | Where-Object { $_ -ne $KeepToken -and $script:Sessions[$_].role -eq $Role })
    foreach ($token in $tokens) { $script:Sessions.Remove($token) }
}

function Save-Data {
    $temporaryPath = "$($script:DataPath).tmp"
    $json = ConvertTo-Json -InputObject $script:Data -Depth 40
    [System.IO.File]::WriteAllText($temporaryPath, $json, [System.Text.UTF8Encoding]::new($false))
    if (Test-Path -LiteralPath $script:DataPath -PathType Leaf) {
        [System.IO.File]::Replace($temporaryPath, $script:DataPath, $null)
    } else {
        [System.IO.File]::Move($temporaryPath, $script:DataPath)
    }
}

function Get-RequestCookie($Request, [string]$Name) {
    foreach ($part in ([string]$Request.Headers["Cookie"]).Split(';')) {
        $pair = $part.Trim().Split('=', 2)
        if ($pair.Length -eq 2 -and $pair[0] -eq $Name) { return $pair[1] }
    }
    return $null
}

function Set-SessionCookie($Response, [string]$Token, [int]$MaxAge) {
    if ($MaxAge -gt 0) {
        $Response.AppendHeader("Set-Cookie", "ll_session=$Token; Path=/; HttpOnly; SameSite=Strict; Max-Age=$MaxAge")
    } else {
        $Response.AppendHeader("Set-Cookie", "ll_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0")
    }
}

function New-Session($Context, [string]$Role) {
    $token = [Convert]::ToBase64String((New-RandomBytes 32)).TrimEnd('=').Replace('+', '-').Replace('/', '_')
    $script:Sessions[$token] = @{ role = $Role; expires = [DateTime]::UtcNow.Add($script:SessionLifetime) }
    Set-SessionCookie $Context.Response $token ([int]$script:SessionLifetime.TotalSeconds)
    return $script:Sessions[$token]
}

function Get-Session($Request) {
    $token = Get-RequestCookie $Request "ll_session"
    if ([string]::IsNullOrWhiteSpace($token)) { return $null }
    if (-not $script:Sessions.ContainsKey($token)) { return $null }
    $session = $script:Sessions[$token]
    if ([DateTime]::UtcNow -ge $session.expires) {
        $script:Sessions.Remove($token)
        return $null
    }
    return $session
}

function Test-SameOrigin($Request) {
    return ([string]$Request.Headers["Origin"] -eq $script:AllowedOrigin)
}

function Require-Session($Context, [string]$Role = "") {
    $session = Get-Session $Context.Request
    if ($null -eq $session) {
        Send-Problem $Context 401 "Please sign in again."
        return $null
    }
    if ($Role -and $session.role -ne $Role) {
        Send-Problem $Context 403 "This action is not allowed for your account."
        return $null
    }
    return $session
}

function Validate-Password([string]$Password, [string]$RoleName) {
    if ([string]::IsNullOrWhiteSpace($Password) -or $Password.Length -lt 6 -or $Password.Length -gt 256) {
        throw "Bad request: The $RoleName password must be between 6 and 256 characters."
    }
}

function Test-ValidDate([string]$Value) {
    if ([string]::IsNullOrWhiteSpace($Value)) { return $true }
    $parsed = [DateTime]::MinValue
    return [DateTime]::TryParseExact($Value, "yyyy-MM-dd", [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None, [ref]$parsed)
}

function Validate-CoverImage([string]$Cover) {
    if ([string]::IsNullOrEmpty($Cover)) { return "" }
    $prefix = "data:image/jpeg;base64,"
    if ($Cover.Length -gt 1400000 -or $Cover -notmatch '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$') {
        throw "Bad request: The cover picture must be a small JPEG image."
    }
    try { $null = [Convert]::FromBase64String($Cover.Substring($prefix.Length)) }
    catch { throw "Bad request: The cover picture data is not valid." }
    return $Cover
}

function Convert-ToBook($Source, [bool]$KeepId = $false) {
    $title = ([string](Get-Value $Source "title" "")).Trim()
    if ([string]::IsNullOrWhiteSpace($title) -or $title.Length -gt 80) {
        throw "Bad request: Each book needs a title of 1 to 80 characters."
    }
    $author = ([string](Get-Value $Source "author" "")).Trim()
    if ($author.Length -gt 60) { throw "Bad request: An author name is too long." }
    $category = [string](Get-Value $Source "category" "Other")
    $validCategories = @("Picture Books", "Adventure", "Animals", "Fairy Tales", "Learning", "Other")
    if ($category -notin $validCategories) { $category = "Other" }

    $available = [bool](Get-Value $Source "available" $true)
    $borrowedBy = ([string](Get-Value $Source "borrowedBy" "")).Trim()
    if ($borrowedBy.Length -gt 60) { throw "Bad request: A student name is too long." }
    $dueDate = [string](Get-Value $Source "dueDate" "")
    if (-not (Test-ValidDate $dueDate)) { throw "Bad request: A due date must use year-month-day format." }
    if ($available) { $borrowedBy = ""; $dueDate = "" }

    $cover = [string](Get-Value $Source "coverImage" "")
    if ($cover) { $cover = Validate-CoverImage $cover }
    $color = [string](Get-Value $Source "color" "#e6e0ff")
    if ($color -notmatch '^#[0-9a-fA-F]{6}$') { $color = "#e6e0ff" }
    $emoji = [string](Get-Value $Source "emoji" "")
    if ($emoji.Length -gt 12) { $emoji = "" }
    $id = [string](Get-Value $Source "id" "")
    if (-not $KeepId -or $id -notmatch '^[A-Za-z0-9_-]{1,80}$') { $id = "book-$([Guid]::NewGuid().ToString('N'))" }

    $book = @{
        id = $id; title = $title; author = $author; category = $category
        emoji = $emoji; color = $color; coverImage = $cover
        available = $available; borrowedBy = $borrowedBy; dueDate = $dueDate
        borrowedAt = [string](Get-Value $Source "borrowedAt" ""); history = @()
    }
    return $book
}

function Get-LoginKey($Request, [string]$Role) {
    return "$($Request.RemoteEndPoint.Address):$Role"
}

function Handle-Api($Context) {
    $request = $Context.Request
    $response = $Context.Response
    $path = $request.Url.AbsolutePath
    $method = $request.HttpMethod.ToUpperInvariant()

    if ($method -eq "GET" -and $path -eq "/api/session") {
        if ($null -eq $script:Data) {
            Send-Json $Context 200 @{ setupRequired = $true; authenticated = $false }
            return
        }
        $session = Get-Session $request
        if ($null -eq $session) {
            Send-Json $Context 200 @{ setupRequired = $false; authenticated = $false }
        } else {
            $recoveryRecord = Get-Value $script:Data "recovery" $null
            Send-Json $Context 200 @{ setupRequired = $false; authenticated = $true; role = $session.role; books = @($script:Data.books); recoveryConfigured = ($null -ne $recoveryRecord) }
        }
        return
    }

    if ($method -eq "POST" -and $path -in @("/api/setup", "/api/login", "/api/logout", "/api/recover", "/api/recovery-key", "/api/admin/reader-password", "/api/admin/account-password")) {
        if (-not (Test-SameOrigin $request)) { Send-Problem $Context 403 "This request must come from the library page."; return }
    }

    if ($method -eq "POST" -and $path -eq "/api/setup") {
        if ($null -ne $script:Data) { Send-Problem $Context 409 "The library has already been set up."; return }
        try {
            $body = Read-JsonBody $request
            $adminPassword = [string](Get-Value $body "adminPassword" "")
            $readerPassword = [string](Get-Value $body "readerPassword" "")
            Validate-Password $adminPassword "Admin"
            Validate-Password $readerPassword "Reader"
            $sourceBooks = @(Get-Value $body "books" @())
            if ($sourceBooks.Count -gt 500) { throw "Bad request: The initial shelf has too many books." }
            $books = @()
            $knownIds = @{}
            foreach ($sourceBook in $sourceBooks) {
                $book = Convert-ToBook $sourceBook $true
                if (-not $knownIds.ContainsKey($book.id)) {
                    $knownIds[$book.id] = $true
                    $books += $book
                }
            }
            $recoveryCode = New-RecoveryCode
            $script:Data = @{
                schemaVersion = 1
                credentials = @{ admin = (New-PasswordRecord $adminPassword); reader = (New-PasswordRecord $readerPassword) }
                recovery = (New-PasswordRecord $recoveryCode.value)
                books = $books
            }
            Save-Data
            $session = New-Session $Context "admin"
            Send-Json $Context 201 @{ authenticated = $true; role = "admin"; books = @($script:Data.books); recoveryConfigured = $true; recoveryCode = $recoveryCode.display }
        } catch {
            if ($_.Exception.Message.StartsWith("Bad request:")) { Send-Problem $Context 400 ($_.Exception.Message.Substring(13).Trim()) }
            else { Send-Problem $Context 500 "Could not save the library setup." }
        }
        return
    }

    if ($method -eq "POST" -and $path -eq "/api/login") {
        if ($null -eq $script:Data) { Send-Problem $Context 409 "Set up the library before signing in."; return }
        try { $body = Read-JsonBody $request }
        catch { Send-Problem $Context 400 "Enter your role and password to sign in."; return }
        $role = [string](Get-Value $body "role" "")
        $password = [string](Get-Value $body "password" "")
        if ($role -notin @("admin", "reader")) { Send-Problem $Context 400 "Choose Admin or Reader."; return }
        $key = Get-LoginKey $request $role
        $now = [DateTime]::UtcNow
        if ($script:LoginAttempts.ContainsKey($key)) {
            $attempt = $script:LoginAttempts[$key]
            if ($attempt.lockedUntil -and $now -lt $attempt.lockedUntil) { Send-Problem $Context 429 "Too many tries. Please wait 30 seconds and try again."; return }
            if ($attempt.started -lt $now.AddMinutes(-10)) { $script:LoginAttempts.Remove($key) }
        }
        if (-not (Test-Password $password $script:Data.credentials.$role)) {
            if (-not $script:LoginAttempts.ContainsKey($key)) { $script:LoginAttempts[$key] = @{ count = 0; started = $now; lockedUntil = $null } }
            $attempt = $script:LoginAttempts[$key]
            $attempt.count++
            if ($attempt.count -ge 8) { $attempt.lockedUntil = $now.AddSeconds(30) }
            Send-Problem $Context 401 "That password did not match. Please try again."
            return
        }
        $script:LoginAttempts.Remove($key)
        $recoveryRecord = Get-Value $script:Data "recovery" $null
        $recoveryConfigured = $null -ne $recoveryRecord
        $responseBody = @{ authenticated = $true; role = $role; books = @($script:Data.books); recoveryConfigured = $recoveryConfigured }
        if ($role -eq "admin" -and -not $recoveryConfigured) {
            $recoveryCode = New-RecoveryCode
            Set-DataValue $script:Data "recovery" (New-PasswordRecord $recoveryCode.value)
            Save-Data
            $responseBody.recoveryConfigured = $true
            $responseBody.recoveryCode = $recoveryCode.display
        }
        $session = New-Session $Context $role
        Send-Json $Context 200 $responseBody
        return
    }

    if ($method -eq "POST" -and $path -eq "/api/recovery-key") {
        $session = Require-Session $Context "admin"
        if ($null -eq $session) { return }
        $recoveryCode = New-RecoveryCode
        Set-DataValue $script:Data "recovery" (New-PasswordRecord $recoveryCode.value)
        Save-Data
        Send-Json $Context 200 @{ recoveryConfigured = $true; recoveryCode = $recoveryCode.display }
        return
    }

    if ($method -eq "POST" -and $path -eq "/api/admin/reader-password") {
        $session = Require-Session $Context "admin"
        if ($null -eq $session) { return }
        try {
            $body = Read-JsonBody $request
            $newPassword = [string](Get-Value $body "newPassword" "")
            $confirmation = [string](Get-Value $body "confirmation" "")
            Validate-Password $newPassword "Reader"
            if ($newPassword -ne $confirmation) { throw "Bad request: The Reader passwords do not match." }
        } catch {
            $message = $_.Exception.Message -replace '^Bad request:\s*', ''
            if ([string]::IsNullOrWhiteSpace($message)) { $message = "Enter and confirm the new Reader password." }
            Send-Problem $Context 400 $message
            return
        }

        $previousPassword = Get-Value $script:Data.credentials "reader" $null
        Set-DataValue $script:Data.credentials "reader" (New-PasswordRecord $newPassword)
        try { Save-Data }
        catch {
            Set-DataValue $script:Data.credentials "reader" $previousPassword
            Send-Problem $Context 500 "Could not update the Reader password. Please try again."
            return
        }

        $readerLoginKey = Get-LoginKey $request "reader"
        if ($script:LoginAttempts.ContainsKey($readerLoginKey)) { $script:LoginAttempts.Remove($readerLoginKey) }
        Revoke-RoleSessions "reader"
        Send-Json $Context 200 @{ reset = $true; role = "reader"; readerSessionsRevoked = $true }
        return
    }

    if ($method -eq "POST" -and $path -eq "/api/admin/account-password") {
        $session = Require-Session $Context "admin"
        if ($null -eq $session) { return }
        try {
            $body = Read-JsonBody $request
            $currentPassword = [string](Get-Value $body "currentPassword" "")
            $newPassword = [string](Get-Value $body "newPassword" "")
            $confirmation = [string](Get-Value $body "confirmation" "")
            Validate-Password $newPassword "Admin"
            if ($newPassword -ne $confirmation) { throw "Bad request: The Admin passwords do not match." }
        } catch {
            $message = $_.Exception.Message -replace '^Bad request:\s*', ''
            if ([string]::IsNullOrWhiteSpace($message)) { $message = "Enter the current password and confirm a new Admin password." }
            Send-Problem $Context 400 $message
            return
        }

        $adminLoginKey = Get-LoginKey $request "admin"
        $now = [DateTime]::UtcNow
        if ($script:LoginAttempts.ContainsKey($adminLoginKey)) {
            $attempt = $script:LoginAttempts[$adminLoginKey]
            if ($attempt.lockedUntil -and $now -lt $attempt.lockedUntil) { Send-Problem $Context 429 "Too many tries. Please wait 30 seconds and try again."; return }
            if ($attempt.started -lt $now.AddMinutes(-10)) { $script:LoginAttempts.Remove($adminLoginKey) }
        }
        if (-not (Test-Password $currentPassword $script:Data.credentials.admin)) {
            if (-not $script:LoginAttempts.ContainsKey($adminLoginKey)) { $script:LoginAttempts[$adminLoginKey] = @{ count = 0; started = $now; lockedUntil = $null } }
            $attempt = $script:LoginAttempts[$adminLoginKey]
            $attempt.count++
            if ($attempt.count -ge 8) { $attempt.lockedUntil = $now.AddSeconds(30) }
            Send-Problem $Context 401 "The current Admin password did not match. Please try again."
            return
        }

        $script:LoginAttempts.Remove($adminLoginKey)
        $previousPassword = Get-Value $script:Data.credentials "admin" $null
        Set-DataValue $script:Data.credentials "admin" (New-PasswordRecord $newPassword)
        try { Save-Data }
        catch {
            Set-DataValue $script:Data.credentials "admin" $previousPassword
            Send-Problem $Context 500 "Could not update the Admin password. Please try again."
            return
        }

        $currentToken = Get-RequestCookie $request "ll_session"
        Revoke-RoleSessionsExcept "admin" $currentToken
        Send-Json $Context 200 @{ reset = $true; role = "admin"; currentSessionKept = $true }
        return
    }

    if ($method -eq "POST" -and $path -eq "/api/recover") {
        if ($null -eq $script:Data) { Send-Problem $Context 409 "Set up the library before recovering an account."; return }
        $recoveryRecord = Get-Value $script:Data "recovery" $null
        if ($null -eq $recoveryRecord) {
            Send-Problem $Context 409 "A recovery key has not been set up. Ask an Admin to sign in and create one first."
            return
        }
        try { $body = Read-JsonBody $request }
        catch { Send-Problem $Context 400 "Enter the recovery key and a new password."; return }
        $role = [string](Get-Value $body "role" "")
        if ($role -notin @("admin", "reader")) { Send-Problem $Context 400 "Choose Admin or Reader."; return }
        $newPassword = [string](Get-Value $body "newPassword" "")
        try { Validate-Password $newPassword $role }
        catch { Send-Problem $Context 400 ($_.Exception.Message -replace '^Bad request:\s*', ''); return }

        $key = Get-LoginKey $request "recovery"
        $now = [DateTime]::UtcNow
        if ($script:LoginAttempts.ContainsKey($key)) {
            $attempt = $script:LoginAttempts[$key]
            if ($attempt.lockedUntil -and $now -lt $attempt.lockedUntil) { Send-Problem $Context 429 "Too many tries. Please wait 30 seconds and try again."; return }
            if ($attempt.started -lt $now.AddMinutes(-10)) { $script:LoginAttempts.Remove($key) }
        }

        $recoveryCode = ([string](Get-Value $body "recoveryCode" "")) -replace '[\s-]', ''
        $recoveryCode = $recoveryCode.ToUpperInvariant()
        $validCode = $recoveryCode -match '^[0-9A-F]{32}$' -and (Test-Password $recoveryCode $recoveryRecord)
        if (-not $validCode) {
            if (-not $script:LoginAttempts.ContainsKey($key)) { $script:LoginAttempts[$key] = @{ count = 0; started = $now; lockedUntil = $null } }
            $attempt = $script:LoginAttempts[$key]
            $attempt.count++
            if ($attempt.count -ge 8) { $attempt.lockedUntil = $now.AddSeconds(30) }
            Send-Problem $Context 401 "That recovery key did not match. Check it and try again."
            return
        }

        $script:LoginAttempts.Remove($key)
        Set-DataValue $script:Data.credentials $role (New-PasswordRecord $newPassword)
        Save-Data
        $roleLoginKey = Get-LoginKey $request $role
        if ($script:LoginAttempts.ContainsKey($roleLoginKey)) { $script:LoginAttempts.Remove($roleLoginKey) }
        Revoke-RoleSessions $role
        Set-SessionCookie $response "" 0
        Send-Json $Context 200 @{ reset = $true; role = $role }
        return
    }

    if ($method -eq "POST" -and $path -eq "/api/logout") {
        $token = Get-RequestCookie $request "ll_session"
        if ($token) { $script:Sessions.Remove($token) }
        Set-SessionCookie $response "" 0
        Send-Json $Context 200 @{ signedOut = $true }
        return
    }

    if ($method -eq "GET" -and $path -eq "/api/books") {
        $session = Require-Session $Context
        if ($null -eq $session) { return }
        Send-Json $Context 200 @{ books = @($script:Data.books) }
        return
    }

    if ($method -eq "POST" -and $path -eq "/api/books") {
        $session = Require-Session $Context "admin"
        if ($null -eq $session) { return }
        try {
            $body = Read-JsonBody $request
            $book = Convert-ToBook $body $false
            $book.available = $true
            $book.borrowedBy = ""
            $book.dueDate = ""
            $book.borrowedAt = ""
            $book.history = @()
            $script:Data.books = @($book) + @($script:Data.books)
            Save-Data
            Send-Json $Context 201 @{ book = $book }
        } catch {
            if ($_.Exception.Message.StartsWith("Bad request:")) { Send-Problem $Context 400 ($_.Exception.Message.Substring(13).Trim()) }
            else { Send-Problem $Context 500 "Could not add that book." }
        }
        return
    }

    if ($method -eq "PUT" -and $path -match '^/api/books/([A-Za-z0-9_-]{1,80})$') {
        $session = Require-Session $Context "admin"
        if ($null -eq $session) { return }
        $id = $Matches[1]
        $book = @($script:Data.books | Where-Object { $_.id -eq $id } | Select-Object -First 1)
        if ($book.Count -eq 0) { Send-Problem $Context 404 "That book is no longer on the shelf."; return }
        $book = $book[0]
        try {
            $body = Read-JsonBody $request
            $title = ([string](Get-Value $body "title" "")).Trim()
            $author = ([string](Get-Value $body "author" "")).Trim()
            $category = [string](Get-Value $body "category" "")
            $validCategories = @("Picture Books", "Adventure", "Animals", "Fairy Tales", "Learning", "Other")
            if ([string]::IsNullOrWhiteSpace($title) -or $title.Length -gt 80) { throw "Bad request: A title must be between 1 and 80 characters." }
            if ($author.Length -gt 60) { throw "Bad request: An author name can have up to 60 characters." }
            if ($category -notin $validCategories) { throw "Bad request: Choose one of the listed book categories." }
            $coverProperty = $body.PSObject.Properties["coverImage"]
            if ($null -ne $coverProperty) {
                $cover = [string]$coverProperty.Value
                $book.coverImage = Validate-CoverImage $cover
            }
            $book.title = $title
            $book.author = $author
            $book.category = $category
            Save-Data
            Send-Json $Context 200 @{ book = $book }
        } catch {
            if ($_.Exception.Message.StartsWith("Bad request:")) { Send-Problem $Context 400 ($_.Exception.Message.Substring(13).Trim()) }
            else { Send-Problem $Context 500 "Could not save those book changes." }
        }
        return
    }

    if ($method -eq "DELETE" -and $path -match '^/api/books/([A-Za-z0-9_-]{1,80})$') {
        $session = Require-Session $Context "admin"
        if ($null -eq $session) { return }
        $id = $Matches[1]
        $book = @($script:Data.books | Where-Object { $_.id -eq $id } | Select-Object -First 1)
        if ($book.Count -eq 0) { Send-Problem $Context 404 "That book is no longer on the shelf."; return }
        $script:Data.books = @($script:Data.books | Where-Object { $_.id -ne $id })
        Save-Data
        Send-Json $Context 200 @{ removed = $id }
        return
    }

    if ($method -eq "POST" -and $path -match '^/api/books/([A-Za-z0-9_-]{1,80})/(borrow|return)$') {
        $action = $Matches[2]
        $requiredRole = "reader"
        $session = Require-Session $Context $requiredRole
        if ($null -eq $session) { return }
        $id = $Matches[1]
        $book = @($script:Data.books | Where-Object { $_.id -eq $id } | Select-Object -First 1)
        if ($book.Count -eq 0) { Send-Problem $Context 404 "That book is no longer on the shelf."; return }
        $book = $book[0]
        if ($action -eq "borrow") {
            try { $body = Read-JsonBody $request }
            catch { Send-Problem $Context 400 "Add the student name and due date."; return }
            $student = ([string](Get-Value $body "student" "")).Trim()
            $dueDate = [string](Get-Value $body "dueDate" "")
            if ([string]::IsNullOrWhiteSpace($student) -or $student.Length -gt 60) { Send-Problem $Context 400 "Add a student name of up to 60 characters."; return }
            if (-not (Test-ValidDate $dueDate)) { Send-Problem $Context 400 "Choose a valid due date."; return }
            if (-not $book.available) { Send-Problem $Context 409 "That book has already been borrowed."; return }
            $book.available = $false
            $book.borrowedBy = $student
            $book.dueDate = $dueDate
            $book.borrowedAt = [DateTime]::UtcNow.ToString("o")
        } else {
            if ($book.available) { Send-Problem $Context 409 "That book is already on the shelf."; return }
            $history = @($book.history)
            $history = @(@{
                student = [string]$book.borrowedBy
                borrowedAt = [string]$book.borrowedAt
                dueDate = [string]$book.dueDate
                returnedAt = [DateTime]::UtcNow.ToString("o")
            }) + $history
            if ($history.Count -gt 200) { $history = @($history | Select-Object -First 200) }
            $book.history = $history
            $book.available = $true
            $book.borrowedBy = ""
            $book.dueDate = ""
            $book.borrowedAt = ""
        }
        Save-Data
        Send-Json $Context 200 @{ book = $book }
        return
    }

    Send-Problem $Context 404 "That library page was not found."
}

function Handle-Request($Context) {
    $request = $Context.Request
    $response = $Context.Response
    Set-SecurityHeaders $response
    $path = $request.Url.AbsolutePath

    if ($path.StartsWith("/api/")) {
        if ($request.HttpMethod -in @("POST", "DELETE", "PUT", "PATCH") -and -not (Test-SameOrigin $request)) {
            Send-Problem $Context 403 "This request must come from the library page."
            return
        }
        Handle-Api $Context
        return
    }

    if ($request.HttpMethod -ne "GET" -and $request.HttpMethod -ne "HEAD") {
        $response.StatusCode = 405
        return
    }
    $asset = switch ($path) {
        "/" { "index.html"; break }
        "/index.html" { "index.html"; break }
        "/app.js" { "app.js"; break }
        "/styles.css" { "styles.css"; break }
        default { $null }
    }
    if (-not $asset) { $response.StatusCode = 404; return }
    $filePath = Join-Path $PSScriptRoot $asset
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $response.ContentType = switch ([System.IO.Path]::GetExtension($asset)) {
        ".html" { "text/html; charset=utf-8"; break }
        ".js" { "text/javascript; charset=utf-8"; break }
        ".css" { "text/css; charset=utf-8"; break }
    }
    $response.StatusCode = 200
    $response.ContentLength64 = $bytes.Length
    if ($request.HttpMethod -ne "HEAD") { $response.OutputStream.Write($bytes, 0, $bytes.Length) }
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("$($script:AllowedOrigin)/")
$listener.Start()
Write-Output "Little Library local server listening at $($script:AllowedOrigin)"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    try {
        Handle-Request $context
    } catch {
        try { Send-Problem $context 500 "The library could not complete that request." } catch { }
    } finally {
        try { $context.Response.Close() } catch { }
    }
}
