const { createPool } = require("@vercel/postgres");
const {
  createHash,
  pbkdf2,
  randomBytes,
  timingSafeEqual
} = require("node:crypto");

const SESSION_COOKIE = "ll_session";
const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;
const SESSION_LIFETIME_SECONDS = SESSION_LIFETIME_MS / 1000;
const PASSWORD_ITERATIONS = 310000;
const PASSWORD_LENGTH = 32;
const MAX_COVER_LENGTH = 1400000;
const CATEGORIES = new Set([
  "Picture Books",
  "Adventure",
  "Animals",
  "Fairy Tales",
  "Learning",
  "Other"
]);

let pool;
let schemaPromise;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function result(status, body, cookie) {
  return { status, body, cookie };
}

function ok(body, status = 200, cookie) {
  return result(status, body, cookie);
}

function problem(status, error) {
  return result(status, { error });
}

function sendJson(res, status, body, cookie) {
  if (cookie) res.setHeader("Set-Cookie", cookie);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function sendResult(res, value) {
  sendJson(res, value.status, value.body, value.cookie);
}

function setSecurityHeaders(res) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

function databasePool() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new HttpError(
      503,
      "The library database is not connected yet. Add POSTGRES_URL to this Vercel project, then redeploy."
    );
  }
  if (!pool) pool = createPool({ connectionString, max: 1 });
  return pool;
}

async function ensureSchema(db) {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS little_library_state (
          singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton IS TRUE),
          data JSONB
        )
      `);
      await db.query(`
        INSERT INTO little_library_state (singleton, data)
        VALUES (TRUE, NULL)
        ON CONFLICT (singleton) DO NOTHING
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS little_library_sessions (
          token_hash TEXT PRIMARY KEY,
          role TEXT NOT NULL CHECK (role IN ('admin', 'reader')),
          expires_at TIMESTAMPTZ NOT NULL
        )
      `);
      await db.query(`
        CREATE INDEX IF NOT EXISTS little_library_sessions_expiry
        ON little_library_sessions (expires_at)
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS little_library_login_attempts (
          attempt_key TEXT PRIMARY KEY,
          fail_count INTEGER NOT NULL,
          started_at TIMESTAMPTZ NOT NULL,
          locked_until TIMESTAMPTZ
        )
      `);
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

function storedData(value) {
  if (typeof value !== "string") return value || null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function readLibrary(db) {
  const { rows } = await db.query(
    "SELECT data FROM little_library_state WHERE singleton = TRUE"
  );
  return storedData(rows[0]?.data);
}

async function withStateTransaction(db, work) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT data FROM little_library_state WHERE singleton = TRUE FOR UPDATE"
    );
    const state = { client, data: storedData(rows[0]?.data), dirty: false };
    const value = await work(state);
    if (state.dirty) {
      await client.query(
        "UPDATE little_library_state SET data = $1::jsonb WHERE singleton = TRUE",
        [JSON.stringify(state.data)]
      );
    }
    await client.query("COMMIT");
    return value;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original database error.
    }
    throw error;
  } finally {
    client.release();
  }
}

function readBody(req) {
  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  if (!contentType.startsWith("application/json")) {
    throw new HttpError(400, "Send JSON data.");
  }
  let body = req.body;
  if (Buffer.isBuffer(body)) body = body.toString("utf8");
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      throw new HttpError(400, "Request data is not valid JSON.");
    }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Request data is missing.");
  }
  return body;
}

function requiredPassword(value, role) {
  if (typeof value !== "string" || !value.trim() || value.length < 6 || value.length > 256) {
    throw new HttpError(400, `The ${role} password must be between 6 and 256 characters.`);
  }
}

function derivePassword(password, salt, iterations = PASSWORD_ITERATIONS) {
  return new Promise((resolve, reject) => {
    pbkdf2(password, salt, iterations, PASSWORD_LENGTH, "sha256", (error, hash) => {
      if (error) reject(error);
      else resolve(hash);
    });
  });
}

async function passwordRecord(password) {
  const salt = randomBytes(16);
  const hash = await derivePassword(password, salt);
  return {
    salt: salt.toString("base64"),
    hash: hash.toString("base64"),
    iterations: PASSWORD_ITERATIONS
  };
}

async function verifyPassword(password, record) {
  try {
    const salt = Buffer.from(record.salt, "base64");
    const expected = Buffer.from(record.hash, "base64");
    const iterations = Number(record.iterations) || PASSWORD_ITERATIONS;
    if (!salt.length || expected.length !== PASSWORD_LENGTH || iterations < 100000 || iterations > 1000000) {
      return false;
    }
    const actual = await derivePassword(password, salt, iterations);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function newRecoveryCode() {
  const raw = randomBytes(16).toString("hex").toUpperCase();
  return { value: raw, display: raw.match(/.{1,4}/g).join("-") };
}

function isValidDate(value) {
  if (!value) return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateCover(value) {
  const cover = String(value || "");
  if (!cover) return "";
  const prefix = "data:image/jpeg;base64,";
  if (cover.length > MAX_COVER_LENGTH || !cover.startsWith(prefix)) {
    throw new HttpError(400, "The cover picture must be a small JPEG image.");
  }
  const encoded = cover.slice(prefix.length);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new HttpError(400, "The cover picture data is not valid.");
  }
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.toString("base64") !== encoded) {
    throw new HttpError(400, "The cover picture data is not valid.");
  }
  return cover;
}

function convertToBook(source, keepId = false) {
  const title = String(source?.title ?? "").trim();
  if (!title || title.length > 80) {
    throw new HttpError(400, "Each book needs a title of 1 to 80 characters.");
  }
  const author = String(source?.author ?? "").trim();
  if (author.length > 60) throw new HttpError(400, "An author name is too long.");
  const category = CATEGORIES.has(source?.category) ? source.category : "Other";
  const available = source?.available === undefined ? true : Boolean(source.available);
  let borrowedBy = String(source?.borrowedBy ?? "").trim();
  let dueDate = String(source?.dueDate ?? "");
  if (borrowedBy.length > 60) throw new HttpError(400, "A student name is too long.");
  if (!isValidDate(dueDate)) throw new HttpError(400, "A due date must use year-month-day format.");
  if (available) {
    borrowedBy = "";
    dueDate = "";
  }
  const color = /^#[0-9a-fA-F]{6}$/.test(String(source?.color ?? "")) ? source.color : "#e6e0ff";
  const emoji = Array.from(String(source?.emoji ?? "")).length <= 12 ? String(source?.emoji ?? "") : "";
  const requestedId = String(source?.id ?? "");
  const id = keepId && /^[A-Za-z0-9_-]{1,80}$/.test(requestedId)
    ? requestedId
    : `book-${randomBytes(16).toString("hex")}`;
  return {
    id,
    title,
    author,
    category,
    emoji,
    color,
    coverImage: validateCover(source?.coverImage),
    available,
    borrowedBy,
    dueDate,
    borrowedAt: available ? "" : String(source?.borrowedAt ?? ""),
    history: []
  };
}

function requestOrigin(req) {
  const first = (value) => String(Array.isArray(value) ? value[0] : value ?? "").split(",")[0].trim();
  const host = first(req.headers.host) || first(req.headers["x-forwarded-host"]);
  const forwardedProtocol = first(req.headers["x-forwarded-proto"]);
  const protocol = forwardedProtocol || (req.socket?.encrypted || process.env.VERCEL === "1" ? "https" : "http");
  return host ? `${protocol}://${host}` : "";
}

function isSameOrigin(req) {
  return Boolean(req.headers.origin && req.headers.origin === requestOrigin(req));
}

function secureRequest(req) {
  const proto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  return proto === "https" || Boolean(req.socket?.encrypted) || process.env.VERCEL === "1";
}

function cookieToken(req) {
  const cookieHeader = String(req.headers.cookie || "");
  for (const cookie of cookieHeader.split(";")) {
    const separator = cookie.indexOf("=");
    if (separator < 0) continue;
    if (cookie.slice(0, separator).trim() === SESSION_COOKIE) {
      return cookie.slice(separator + 1).trim();
    }
  }
  return "";
}

function sessionCookie(req, token, maxAge) {
  const secure = secureRequest(req) ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function createSession(client, role, req) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hash(token);
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
  await client.query("DELETE FROM little_library_sessions WHERE expires_at <= NOW()");
  await client.query(
    "INSERT INTO little_library_sessions (token_hash, role, expires_at) VALUES ($1, $2, $3)",
    [tokenHash, role, expiresAt]
  );
  return sessionCookie(req, token, SESSION_LIFETIME_SECONDS);
}

async function findSession(db, req) {
  const token = cookieToken(req);
  if (!token) return null;
  const tokenHash = hash(token);
  const { rows } = await db.query(
    "SELECT role FROM little_library_sessions WHERE token_hash = $1 AND expires_at > NOW()",
    [tokenHash]
  );
  return rows[0] ? { role: rows[0].role, tokenHash } : null;
}

async function requireSession(db, req, requiredRole = "") {
  const session = await findSession(db, req);
  if (!session) return { error: problem(401, "Please sign in again.") };
  if (requiredRole && session.role !== requiredRole) {
    return { error: problem(403, "This action is not allowed for your account.") };
  }
  return { session };
}

function rateLimitKey(req, purpose) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const address = forwarded || req.socket?.remoteAddress || "unknown";
  return hash(`${purpose}:${address}`);
}

async function isRateLimited(client, attemptKey) {
  const { rows } = await client.query(
    "SELECT fail_count, started_at, locked_until FROM little_library_login_attempts WHERE attempt_key = $1",
    [attemptKey]
  );
  const attempt = rows[0];
  if (!attempt) return false;
  if (attempt.locked_until && new Date(attempt.locked_until).getTime() > Date.now()) return true;
  if (new Date(attempt.started_at).getTime() < Date.now() - 10 * 60 * 1000) {
    await client.query("DELETE FROM little_library_login_attempts WHERE attempt_key = $1", [attemptKey]);
  }
  return false;
}

async function recordFailedAttempt(client, attemptKey) {
  await client.query(`
    INSERT INTO little_library_login_attempts (attempt_key, fail_count, started_at, locked_until)
    VALUES ($1, 1, NOW(), NULL)
    ON CONFLICT (attempt_key) DO UPDATE SET
      fail_count = CASE
        WHEN little_library_login_attempts.started_at < NOW() - INTERVAL '10 minutes' THEN 1
        ELSE little_library_login_attempts.fail_count + 1
      END,
      started_at = CASE
        WHEN little_library_login_attempts.started_at < NOW() - INTERVAL '10 minutes' THEN NOW()
        ELSE little_library_login_attempts.started_at
      END,
      locked_until = CASE
        WHEN little_library_login_attempts.started_at < NOW() - INTERVAL '10 minutes' THEN NULL
        WHEN little_library_login_attempts.fail_count + 1 >= 8 THEN NOW() + INTERVAL '30 seconds'
        ELSE little_library_login_attempts.locked_until
      END
  `, [attemptKey]);
}

async function clearFailedAttempts(client, attemptKey) {
  await client.query("DELETE FROM little_library_login_attempts WHERE attempt_key = $1", [attemptKey]);
}

async function revokeRoleSessions(client, role, exceptTokenHash = "") {
  if (exceptTokenHash) {
    await client.query(
      "DELETE FROM little_library_sessions WHERE role = $1 AND token_hash <> $2",
      [role, exceptTokenHash]
    );
  } else {
    await client.query("DELETE FROM little_library_sessions WHERE role = $1", [role]);
  }
}

function normalizeStoredHistory(book) {
  if (!Array.isArray(book.history)) book.history = [];
  if (typeof book.borrowedAt !== "string") book.borrowedAt = "";
}

function bookIdFromPath(path) {
  const match = path.match(/^\/books\/([A-Za-z0-9_-]{1,80})$/);
  return match?.[1] || "";
}

async function handleApi(req, db, path, method) {
  if (method === "GET" && path === "/session") {
    const data = await readLibrary(db);
    if (!data) return ok({ setupRequired: true, authenticated: false });
    const session = await findSession(db, req);
    if (!session) return ok({ setupRequired: false, authenticated: false });
    return ok({
      setupRequired: false,
      authenticated: true,
      role: session.role,
      books: Array.isArray(data.books) ? data.books : [],
      recoveryConfigured: Boolean(data.recovery)
    });
  }

  if (method === "GET" && path === "/books") {
    const session = await requireSession(db, req);
    if (session.error) return session.error;
    const data = await readLibrary(db);
    return ok({ books: Array.isArray(data?.books) ? data.books : [] });
  }

  if (method === "POST" && path === "/setup") {
    const body = readBody(req);
    return withStateTransaction(db, async (state) => {
      if (state.data) return problem(409, "The library has already been set up.");
      const adminPassword = body.adminPassword;
      const readerPassword = body.readerPassword;
      requiredPassword(adminPassword, "Admin");
      requiredPassword(readerPassword, "Reader");
      const sourceBooks = Array.isArray(body.books) ? body.books : [];
      if (sourceBooks.length > 500) {
        throw new HttpError(400, "The initial shelf has too many books.");
      }
      const books = [];
      const knownIds = new Set();
      for (const sourceBook of sourceBooks) {
        const book = convertToBook(sourceBook, true);
        if (!knownIds.has(book.id)) {
          knownIds.add(book.id);
          books.push(book);
        }
      }
      const recoveryCode = newRecoveryCode();
      state.data = {
        schemaVersion: 1,
        credentials: {
          admin: await passwordRecord(adminPassword),
          reader: await passwordRecord(readerPassword)
        },
        recovery: await passwordRecord(recoveryCode.value),
        books
      };
      state.dirty = true;
      const cookie = await createSession(state.client, "admin", req);
      return ok({
        authenticated: true,
        role: "admin",
        books,
        recoveryConfigured: true,
        recoveryCode: recoveryCode.display
      }, 201, cookie);
    });
  }

  if (method === "POST" && path === "/login") {
    const body = readBody(req);
    const role = String(body.role || "");
    const password = typeof body.password === "string" ? body.password : "";
    if (!["admin", "reader"].includes(role)) return problem(400, "Choose Admin or Reader.");
    return withStateTransaction(db, async (state) => {
      if (!state.data) return problem(409, "Set up the library before signing in.");
      const attemptKey = rateLimitKey(req, `login:${role}`);
      if (await isRateLimited(state.client, attemptKey)) {
        return problem(429, "Too many tries. Please wait 30 seconds and try again.");
      }
      if (!await verifyPassword(password, state.data.credentials?.[role])) {
        await recordFailedAttempt(state.client, attemptKey);
        return problem(401, "That password did not match. Please try again.");
      }
      await clearFailedAttempts(state.client, attemptKey);
      let recoveryCode = null;
      if (role === "admin" && !state.data.recovery) {
        recoveryCode = newRecoveryCode();
        state.data.recovery = await passwordRecord(recoveryCode.value);
        state.dirty = true;
      }
      const cookie = await createSession(state.client, role, req);
      const response = {
        authenticated: true,
        role,
        books: Array.isArray(state.data.books) ? state.data.books : [],
        recoveryConfigured: Boolean(state.data.recovery)
      };
      if (recoveryCode) response.recoveryCode = recoveryCode.display;
      return ok(response, 200, cookie);
    });
  }

  if (method === "POST" && path === "/logout") {
    const token = cookieToken(req);
    if (token) await db.query("DELETE FROM little_library_sessions WHERE token_hash = $1", [hash(token)]);
    return ok({ signedOut: true }, 200, sessionCookie(req, "", 0));
  }

  if (method === "POST" && path === "/recovery-key") {
    return withStateTransaction(db, async (state) => {
      const auth = await requireSession(state.client, req, "admin");
      if (auth.error) return auth.error;
      const recoveryCode = newRecoveryCode();
      state.data.recovery = await passwordRecord(recoveryCode.value);
      state.dirty = true;
      return ok({ recoveryConfigured: true, recoveryCode: recoveryCode.display });
    });
  }

  if (method === "POST" && path === "/admin/reader-password") {
    const body = readBody(req);
    return withStateTransaction(db, async (state) => {
      const auth = await requireSession(state.client, req, "admin");
      if (auth.error) return auth.error;
      requiredPassword(body.newPassword, "Reader");
      if (body.newPassword !== body.confirmation) {
        throw new HttpError(400, "The Reader passwords do not match.");
      }
      state.data.credentials.reader = await passwordRecord(body.newPassword);
      state.dirty = true;
      await revokeRoleSessions(state.client, "reader");
      return ok({ reset: true, role: "reader", readerSessionsRevoked: true });
    });
  }

  if (method === "POST" && path === "/admin/account-password") {
    const body = readBody(req);
    return withStateTransaction(db, async (state) => {
      const auth = await requireSession(state.client, req, "admin");
      if (auth.error) return auth.error;
      requiredPassword(body.newPassword, "Admin");
      if (body.newPassword !== body.confirmation) {
        throw new HttpError(400, "The Admin passwords do not match.");
      }
      const attemptKey = rateLimitKey(req, "admin-password-check");
      if (await isRateLimited(state.client, attemptKey)) {
        return problem(429, "Too many tries. Please wait 30 seconds and try again.");
      }
      if (!await verifyPassword(String(body.currentPassword || ""), state.data.credentials.admin)) {
        await recordFailedAttempt(state.client, attemptKey);
        return problem(401, "The current Admin password did not match. Please try again.");
      }
      await clearFailedAttempts(state.client, attemptKey);
      state.data.credentials.admin = await passwordRecord(body.newPassword);
      state.dirty = true;
      await revokeRoleSessions(state.client, "admin", auth.session.tokenHash);
      return ok({ reset: true, role: "admin", currentSessionKept: true });
    });
  }

  if (method === "POST" && path === "/recover") {
    const body = readBody(req);
    return withStateTransaction(db, async (state) => {
      if (!state.data) return problem(409, "Set up the library before recovering an account.");
      if (!state.data.recovery) {
        return problem(409, "A recovery key has not been set up. Ask an Admin to sign in and create one first.");
      }
      const role = String(body.role || "");
      if (!["admin", "reader"].includes(role)) return problem(400, "Choose Admin or Reader.");
      requiredPassword(body.newPassword, role === "admin" ? "Admin" : "Reader");
      const attemptKey = rateLimitKey(req, "recovery");
      if (await isRateLimited(state.client, attemptKey)) {
        return problem(429, "Too many tries. Please wait 30 seconds and try again.");
      }
      const recoveryCode = String(body.recoveryCode || "").replace(/[\s-]/g, "").toUpperCase();
      const validCode = /^[0-9A-F]{32}$/.test(recoveryCode)
        && await verifyPassword(recoveryCode, state.data.recovery);
      if (!validCode) {
        await recordFailedAttempt(state.client, attemptKey);
        return problem(401, "That recovery key did not match. Check it and try again.");
      }
      await clearFailedAttempts(state.client, attemptKey);
      state.data.credentials[role] = await passwordRecord(body.newPassword);
      state.dirty = true;
      await revokeRoleSessions(state.client, role);
      return ok({ reset: true, role }, 200, sessionCookie(req, "", 0));
    });
  }

  const bookId = bookIdFromPath(path);
  if (method === "POST" && path === "/books") {
    const body = readBody(req);
    return withStateTransaction(db, async (state) => {
      const auth = await requireSession(state.client, req, "admin");
      if (auth.error) return auth.error;
      const book = convertToBook(body);
      book.available = true;
      book.borrowedBy = "";
      book.dueDate = "";
      book.borrowedAt = "";
      book.history = [];
      state.data.books = [book, ...(state.data.books || [])];
      state.dirty = true;
      return ok({ book }, 201);
    });
  }

  if (bookId && method === "PUT") {
    const body = readBody(req);
    return withStateTransaction(db, async (state) => {
      const auth = await requireSession(state.client, req, "admin");
      if (auth.error) return auth.error;
      const book = (state.data.books || []).find((entry) => entry.id === bookId);
      if (!book) return problem(404, "That book is no longer on the shelf.");
      const title = String(body.title ?? "").trim();
      const author = String(body.author ?? "").trim();
      const category = String(body.category ?? "");
      if (!title || title.length > 80) {
        throw new HttpError(400, "A title must be between 1 and 80 characters.");
      }
      if (author.length > 60) throw new HttpError(400, "An author name can have up to 60 characters.");
      if (!CATEGORIES.has(category)) throw new HttpError(400, "Choose one of the listed book categories.");
      if (Object.prototype.hasOwnProperty.call(body, "coverImage")) {
        book.coverImage = validateCover(body.coverImage);
      }
      book.title = title;
      book.author = author;
      book.category = category;
      state.dirty = true;
      return ok({ book });
    });
  }

  if (bookId && method === "DELETE") {
    return withStateTransaction(db, async (state) => {
      const auth = await requireSession(state.client, req, "admin");
      if (auth.error) return auth.error;
      if (!(state.data.books || []).some((entry) => entry.id === bookId)) {
        return problem(404, "That book is no longer on the shelf.");
      }
      state.data.books = state.data.books.filter((entry) => entry.id !== bookId);
      state.dirty = true;
      return ok({ removed: bookId });
    });
  }

  const loanMatch = path.match(/^\/books\/([A-Za-z0-9_-]{1,80})\/(borrow|return)$/);
  if (loanMatch && method === "POST") {
    const action = loanMatch[2];
    const body = action === "borrow" ? readBody(req) : {};
    return withStateTransaction(db, async (state) => {
      const auth = await requireSession(state.client, req, "reader");
      if (auth.error) return auth.error;
      const book = (state.data.books || []).find((entry) => entry.id === loanMatch[1]);
      if (!book) return problem(404, "That book is no longer on the shelf.");
      normalizeStoredHistory(book);
      if (action === "borrow") {
        const student = String(body.student ?? "").trim();
        const dueDate = String(body.dueDate ?? "");
        if (!student || student.length > 60) {
          return problem(400, "Add a student name of up to 60 characters.");
        }
        if (!isValidDate(dueDate)) return problem(400, "Choose a valid due date.");
        if (!book.available) return problem(409, "That book has already been borrowed.");
        book.available = false;
        book.borrowedBy = student;
        book.dueDate = dueDate;
        book.borrowedAt = new Date().toISOString();
      } else {
        if (book.available) return problem(409, "That book is already on the shelf.");
        book.history = [{
          student: String(book.borrowedBy || ""),
          borrowedAt: String(book.borrowedAt || ""),
          dueDate: String(book.dueDate || ""),
          returnedAt: new Date().toISOString()
        }, ...book.history].slice(0, 200);
        book.available = true;
        book.borrowedBy = "";
        book.dueDate = "";
        book.borrowedAt = "";
      }
      state.dirty = true;
      return ok({ book });
    });
  }

  return problem(404, "That library page was not found.");
}

module.exports = async function handler(req, res) {
  setSecurityHeaders(res);
  const host = req.headers.host || "localhost";
  let pathname;
  try {
    pathname = new URL(req.url || "/", `http://${host}`).pathname;
  } catch {
    return sendJson(res, 400, { error: "The request path is not valid." });
  }
  if (!pathname.startsWith("/api/")) {
    return sendJson(res, 404, { error: "That library page was not found." });
  }
  const method = String(req.method || "GET").toUpperCase();
  if (!["GET", "POST", "PUT", "DELETE"].includes(method)) {
    return sendJson(res, 405, { error: "This request method is not allowed." });
  }
  if (method !== "GET" && !isSameOrigin(req)) {
    return sendJson(res, 403, { error: "This request must come from the library page." });
  }
  const segments = pathname.split("/").filter(Boolean).slice(1);
  let path;
  try {
    path = `/${segments.map((segment) => decodeURIComponent(segment)).join("/")}`;
  } catch {
    return sendJson(res, 400, { error: "The request path is not valid." });
  }
  try {
    const db = databasePool();
    await ensureSchema(db);
    const outcome = await handleApi(req, db, path, method);
    return sendResult(res, outcome);
  } catch (error) {
    if (error instanceof HttpError) return sendJson(res, error.status, { error: error.message });
    const message = error?.message === "POSTGRES_URL_MISSING"
      ? "The library database is not connected yet. Add POSTGRES_URL to this Vercel project, then redeploy."
      : "The library server could not reach its database. Check POSTGRES_URL in Vercel settings.";
    return sendJson(res, 503, { error: message });
  }
};

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb"
    }
  }
};
