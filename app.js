const STORAGE_KEY = "little-library-books-v1";
const READER_TOUR_SEEN_KEY = "little-library-reader-tour-seen-v1";
const ACCESSIBILITY_PREFERENCES_KEY = "little-library-accessibility-v1";
const passwordEyeIcon = '<svg class="password-toggle-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g class="password-eye-closed"><path class="password-eye-line" d="M3 7.5c2.1 4.8 5.2 8.2 9 8.2s6.9-3.4 9-8.2"/><path class="password-eye-lashes" d="m5.2 11.5-1.6 2.2M9.2 14.8l-.9 3.1m6.5-3.1.9 3.1m3.1-6.4 1.6 2.2"/></g><g class="password-eye-open"><path class="password-eye-line" d="M2.1 12C4.3 7.7 7.6 5 12 5s7.7 2.7 9.9 7C19.7 16.3 16.4 19 12 19S4.3 16.3 2.1 12Z"/><circle class="password-eye-pupil" cx="12" cy="12" r="3.1"/></g></svg>';
const adminRoleIcon = '<svg class="admin-role-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="9" cy="7" r="3" fill="currentColor"/><path d="M3.5 20v-1.2c0-3.1 2.5-5.6 5.5-5.6s5.5 2.5 5.5 5.6V20z" fill="currentColor"/><path d="m18.3 11.2.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z" fill="currentColor" stroke="white" stroke-width=".7"/></svg>';

function loadAccessibilityPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(ACCESSIBILITY_PREFERENCES_KEY) || "{}");
    return { largerText: saved.largerText === true, highContrast: saved.highContrast === true };
  } catch {
    return { largerText: false, highContrast: false };
  }
}

let accessibilityPreferences = loadAccessibilityPreferences();

function dateOffsetFromToday(offset) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const seedBooks = [
  { id: "seed-1", title: "The Very Hungry Caterpillar", author: "Eric Carle", category: "Animals", emoji: "🐛", color: "#dff2d5", available: true },
  { id: "seed-2", title: "Where the Wild Things Are", author: "Maurice Sendak", category: "Adventure", emoji: "🦁", color: "#ffdfb8", available: false, borrowedBy: "Mia Santos", dueDate: dateOffsetFromToday(-2) },
  { id: "seed-3", title: "The Gruffalo", author: "Julia Donaldson", category: "Animals", emoji: "🦊", color: "#ffe8c6", available: true },
  { id: "seed-4", title: "Room on the Broom", author: "Julia Donaldson", category: "Fairy Tales", emoji: "🧙‍♀️", color: "#e5ddff", available: true },
  { id: "seed-5", title: "The Rainbow Fish", author: "Marcus Pfister", category: "Picture Books", emoji: "🐠", color: "#d8efff", available: true },
  { id: "seed-6", title: "We're Going on a Bear Hunt", author: "Michael Rosen", category: "Adventure", emoji: "🐻", color: "#f7dfd5", available: false, borrowedBy: "Noah Lee", dueDate: dateOffsetFromToday(3) },
  { id: "seed-7", title: "Goodnight Moon", author: "Margaret Wise Brown", category: "Picture Books", emoji: "🌙", color: "#e5e8ff", available: true },
  { id: "seed-8", title: "The Tiny Seed", author: "Eric Carle", category: "Learning", emoji: "🌱", color: "#ddf1df", available: true }
];

const categoryColors = { "Picture Books": "#f4a5a1", Adventure: "#e9bb57", Animals: "#73c4a1", "Fairy Tales": "#ad9be9", Learning: "#72afe0", Other: "#d1a0bd" };
const categoryEmojis = { "Picture Books": "📚", Adventure: "🧭", Animals: "🐾", "Fairy Tales": "🪄", Learning: "🌟", Other: "🎨" };
let books = [];
let currentRole = null;
let currentFilter = "all";
let currentDueView = "books";
let selectedBookId = null;
let selectedRemoveBookId = null;
let selectedEditBookId = null;
let historyScopeBookId = null;
let coverPreviewObjectUrl = null;
let toastTimeout;
let selectedLoginRole = "reader";
let readerTourStep = 0;
let recoveryConfigured = false;

const grid = document.getElementById("booksGrid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");

function resetPasswordVisibility() {
  document.querySelectorAll("[data-password-group]").forEach((input) => {
    input.type = "password";
  });
  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    setPasswordToggleState(button, false);
  });
  updatePasswordStrength("admin");
  updatePasswordStrength("reader");
  updatePasswordStrength("recovery");
  updatePasswordStrength("adminChange");
  updatePasswordStrength("readerChange");
  updatePasswordMatch("admin");
  updatePasswordMatch("reader");
  updatePasswordMatch("recovery");
  updatePasswordMatch("adminChange");
  updatePasswordMatch("readerChange");
  updateAccountSetupChecklist();
}

function setPasswordToggleState(button, isVisible) {
  button.innerHTML = passwordEyeIcon;
  button.dataset.visible = String(isVisible);
  button.setAttribute("aria-label", `${isVisible ? "Hide" : "Show"} ${button.dataset.passwordLabel}`);
  button.setAttribute("aria-pressed", String(isVisible));
}

function applyAccessibilityPreferences() {
  document.documentElement.classList.toggle("large-text-mode", accessibilityPreferences.largerText);
  document.documentElement.classList.toggle("high-contrast-mode", accessibilityPreferences.highContrast);
  document.getElementById("largerTextToggle").checked = accessibilityPreferences.largerText;
  document.getElementById("highContrastToggle").checked = accessibilityPreferences.highContrast;
}

function saveAccessibilityPreferences() {
  accessibilityPreferences = {
    largerText: document.getElementById("largerTextToggle").checked,
    highContrast: document.getElementById("highContrastToggle").checked
  };
  applyAccessibilityPreferences();
  const status = document.getElementById("accessibilitySettingsStatus");
  try {
    localStorage.setItem(ACCESSIBILITY_PREFERENCES_KEY, JSON.stringify(accessibilityPreferences));
    status.textContent = "Saved on this device. You can change these settings anytime.";
  } catch {
    status.textContent = "Your choices work now, but this browser could not save them.";
  }
}

function openAccessibilitySettings() {
  applyAccessibilityPreferences();
  document.getElementById("accessibilitySettingsStatus").textContent = "Changes apply right away and are saved on this device.";
  openModal(document.getElementById("accessibilitySettingsModal"));
  document.getElementById("largerTextToggle").focus();
}

function updatePasswordStrength(role) {
  const password = document.getElementById(`${role}Password`).value;
  const length = password.length;
  let level = 0;
  let message = "Enter a password to check its strength.";
  if (length > 0 && length < 6) {
    level = 1;
    message = "Almost there — use at least 6 characters.";
  } else if (length < 8 && length >= 6) {
    level = 2;
    message = "Good start! A longer password is stronger.";
  } else if (length < 12 && length >= 8) {
    level = 3;
    message = "Nice and strong!";
  } else if (length >= 12) {
    level = 4;
    message = "Super strong!";
  }

  const meter = document.getElementById(`${role}PasswordStrengthMeter`);
  meter.parentElement.dataset.strength = level;
  meter.setAttribute("aria-valuenow", String(level));
  meter.setAttribute("aria-valuetext", message);
  document.getElementById(`${role}PasswordStrengthText`).textContent = message;
}

function updatePasswordMatch(role) {
  const labels = { admin: "Admin", reader: "Reader", recovery: "Recovery", adminChange: "Admin", readerChange: "Reader" };
  const label = labels[role] || "Recovery";
  const password = document.getElementById(`${role}Password`).value;
  const confirmations = { adminChange: "confirmAdminChangePassword", readerChange: "confirmReaderChangePassword" };
  const confirmationId = confirmations[role] || `confirm${label}Password`;
  const confirmation = document.getElementById(confirmationId).value;
  let state = "waiting";
  let message = "Repeat the password to check it matches.";
  if (password && !confirmation) {
    message = "Type it again to check for a match.";
  } else if (!password && confirmation) {
    message = `Enter the ${label} password first.`;
  } else if (password && confirmation && password === confirmation) {
    state = "match";
    message = "The passwords match!";
  } else if (password && confirmation) {
    state = "mismatch";
    message = "The passwords do not match yet.";
  }

  const indicator = document.getElementById(`${role}PasswordMatch`);
  indicator.dataset.state = state;
  indicator.textContent = message;
}

function updateAccountSetupChecklist() {
  const roles = [
    { name: "admin", label: "Admin" },
    { name: "reader", label: "Reader" }
  ];
  let completed = 0;
  let nextStepLabel = "";

  roles.forEach(({ name, label }, index) => {
    const password = document.getElementById(`${name}Password`).value;
    const confirmation = document.getElementById(`confirm${label}Password`).value;
    const ready = password.length >= 6 && password.trim().length > 0 && password === confirmation;
    const started = Boolean(password || confirmation);
    const step = document.querySelector(`[data-setup-step="${name}"]`);
    const stepNumber = step.querySelector(".setup-step-number");
    const stepState = document.getElementById(`${name}SetupStepState`);

    step.dataset.complete = String(ready);
    stepNumber.textContent = ready ? "✓" : String(index + 1);
    stepState.textContent = ready ? "Done" : started ? "In progress" : "To do";
    if (ready) completed += 1;
    else if (!nextStepLabel) nextStepLabel = label;
  });

  const progressText = document.getElementById("setupChecklistProgressText");
  const progress = document.getElementById("setupChecklistProgress");
  const progressBar = document.getElementById("setupChecklistProgressBar");
  const message = document.getElementById("setupChecklistMessage");
  const setupFields = document.getElementById("setupFields");
  progressText.textContent = `${completed} of 2 steps complete`;
  progress.setAttribute("aria-valuenow", String(completed));
  progressBar.style.width = `${completed * 50}%`;
  message.textContent = completed === 2
    ? "Both accounts are ready! You can start your library."
    : `Complete the ${nextStepLabel} account step to continue.`;
  document.getElementById("authSubmitButton").disabled = !setupFields.hidden && completed < 2;
}

function loadLegacyBooks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : seedBooks;
  } catch {
    return seedBooks;
  }
}

async function api(path, options = {}) {
  const request = {
    method: options.method || "GET",
    credentials: "same-origin",
    headers: options.body === undefined ? {} : { "Content-Type": "application/json" }
  };
  if (options.body !== undefined) request.body = JSON.stringify(options.body);
  let response;
  try {
    response = await fetch(path, request);
  } catch {
    throw new Error("The local library server could not be reached.");
  }
  let result = {};
  try { result = await response.json(); } catch { /* The server may return an empty response. */ }
  if (!response.ok) {
    if (response.status === 401 && result.error === "Please sign in again.") lockApp();
    throw new Error(result.error || "That library action could not be completed.");
  }
  return result;
}

function setAuthMode(mode) {
  const isSetup = mode === "setup";
  const authModal = document.getElementById("authModal");
  const loginFields = document.getElementById("loginFields");
  const setupFields = document.getElementById("setupFields");
  loginFields.hidden = isSetup;
  setupFields.hidden = !isSetup;
  loginFields.querySelectorAll("input").forEach((input) => { input.disabled = isSetup; });
  setupFields.querySelectorAll("input").forEach((input) => { input.disabled = !isSetup; });
  document.getElementById("authKicker").textContent = isSetup ? "A NEW LIBRARY ADVENTURE" : "WELCOME BACK";
  document.getElementById("authTitle").textContent = isSetup ? "Set up your library" : "Sign in to your library";
  document.getElementById("authDescription").textContent = isSetup
    ? "Choose passwords for the Admin and shared Reader accounts."
    : "Choose your role and enter its password.";
  document.getElementById("authSubmitButton").textContent = isSetup ? "Create passwords and start" : `Sign in as ${selectedLoginRole === "admin" ? "Admin" : "Reader"}`;
  document.getElementById("authError").textContent = "";
  document.getElementById("authForm").reset();
  resetPasswordVisibility();
  updateLoginRole(selectedLoginRole);
  if (!authModal.open) openModal(authModal);
}

function updateLoginRole(role) {
  selectedLoginRole = role === "admin" ? "admin" : "reader";
  document.querySelectorAll("[data-auth-role]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.authRole === selectedLoginRole));
  });
  const button = document.getElementById("authSubmitButton");
  if (!document.getElementById("setupFields").hidden) return;
  button.textContent = `Sign in as ${selectedLoginRole === "admin" ? "Admin" : "Reader"}`;
  document.getElementById("forgotPasswordButton").textContent = `Forgot ${selectedLoginRole === "admin" ? "Admin" : "Reader"} password?`;
}

function showLibrary(session) {
  currentRole = session.role;
  recoveryConfigured = Boolean(session.recoveryConfigured || session.recoveryCode);
  books = Array.isArray(session.books) ? session.books : [];
  document.getElementById("authForm").reset();
  resetPasswordVisibility();
  document.body.classList.remove("auth-locked");
  closeModal(document.getElementById("authModal"));
  render();
  if (currentRole === "admin" && session.recoveryCode) showRecoveryKey(session.recoveryCode);
  if (currentRole === "reader" && !hasSeenReaderTour()) openReaderTour();
}

function showPasswordRecovery() {
  const roleLabel = selectedLoginRole === "admin" ? "Admin" : "Reader";
  document.getElementById("recoveryResetTitle").textContent = `Reset ${roleLabel} password`;
  document.getElementById("recoveryResetDescription").textContent = `Enter the library recovery key, then choose a new ${roleLabel} password.`;
  document.getElementById("recoveryResetError").textContent = "";
  document.getElementById("recoveryResetForm").reset();
  resetPasswordVisibility();
  openModal(document.getElementById("recoveryResetModal"));
  document.getElementById("recoveryCodeInput").focus();
}

function openRecoveryKeyManager() {
  if (currentRole !== "admin") return;
  document.getElementById("recoveryKeyPrompt").hidden = false;
  document.getElementById("recoveryKeyReveal").hidden = true;
  document.getElementById("recoveryKeyError").textContent = "";
  document.getElementById("recoveryKeyTitle").textContent = recoveryConfigured ? "Replace the recovery key?" : "Set up account recovery";
  document.getElementById("recoveryKeyPromptText").textContent = recoveryConfigured
    ? "A new key will replace the old one. Save the new key somewhere private so you can reset either password."
    : "Create a private key that can reset either library password. Save it somewhere safe. It will only be shown once.";
  document.getElementById("recoveryKeyConfirm").textContent = recoveryConfigured ? "Replace recovery key" : "Create recovery key";
  openModal(document.getElementById("recoveryKeyModal"));
  document.getElementById("recoveryKeyConfirm").focus();
}

function openAccountPasswords() {
  if (currentRole !== "admin") return;
  document.getElementById("adminPasswordChangeForm").reset();
  document.getElementById("readerPasswordChangeForm").reset();
  document.getElementById("adminPasswordChangeError").textContent = "";
  document.getElementById("readerPasswordChangeError").textContent = "";
  document.getElementById("adminPasswordChangeStatus").textContent = "";
  document.getElementById("readerPasswordChangeStatus").textContent = "";
  resetPasswordVisibility();
  openModal(document.getElementById("accountPasswordsModal"));
  document.getElementById("currentAdminPassword").focus();
}

function showRecoveryKey(code) {
  document.getElementById("recoveryKeyPrompt").hidden = true;
  document.getElementById("recoveryKeyReveal").hidden = false;
  document.getElementById("recoveryKeyTitle").textContent = "Save this recovery key";
  document.getElementById("recoveryKeyValue").value = code;
  document.getElementById("recoveryCopyStatus").textContent = "";
  const dialog = document.getElementById("recoveryKeyModal");
  if (!dialog.open) openModal(dialog);
  document.getElementById("recoveryKeyValue").focus();
  document.getElementById("recoveryKeyValue").select();
}

function hasSeenReaderTour() {
  try { return localStorage.getItem(READER_TOUR_SEEN_KEY) === "true"; }
  catch { return false; }
}

function updateReaderTourStep(step, focusHeading = true) {
  const slides = [...document.querySelectorAll("[data-reader-tour-step]")];
  readerTourStep = Math.max(0, Math.min(step, slides.length - 1));
  slides.forEach((slide, index) => { slide.hidden = index !== readerTourStep; });

  const stepNumber = readerTourStep + 1;
  document.getElementById("readerTourStepLabel").textContent = `Step ${stepNumber} of ${slides.length}`;
  document.getElementById("readerTourProgress").setAttribute("aria-valuenow", String(stepNumber));
  document.getElementById("readerTourProgressBar").style.width = `${stepNumber / slides.length * 100}%`;
  document.getElementById("readerTourBack").hidden = readerTourStep === 0;
  document.getElementById("readerTourSkip").hidden = readerTourStep === slides.length - 1;
  document.getElementById("readerTourNext").hidden = readerTourStep === slides.length - 1;
  document.getElementById("readerTourFinish").hidden = readerTourStep !== slides.length - 1;

  if (focusHeading) slides[readerTourStep].querySelector("h3").focus();
}

function openReaderTour() {
  if (currentRole !== "reader") return;
  try { localStorage.setItem(READER_TOUR_SEEN_KEY, "true"); } catch { /* The tour remains available from its library button. */ }
  updateReaderTourStep(0, false);
  openModal(document.getElementById("readerTourModal"));
  document.getElementById("readerTourTitle").focus();
}

function lockApp() {
  currentRole = null;
  books = [];
  document.body.classList.add("auth-locked");
  setAuthMode("login");
}

async function initializeApp() {
  try {
    const session = await api("/api/session");
    if (session.setupRequired) {
      setAuthMode("setup");
    } else if (session.authenticated) {
      showLibrary(session);
    } else {
      setAuthMode("login");
    }
  } catch (error) {
    setAuthMode("login");
    document.getElementById("authError").textContent = error.message;
  }
}

function formatDueDate(dateString) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function formatHistoryDate(dateString) {
  if (!dateString) return "Date not recorded";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Date not recorded";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function historyDateKey(dateString) {
  const date = new Date(dateString || "");
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLoanHistoryRecords() {
  return books.flatMap((book) => {
    const completed = Array.isArray(book.history) ? book.history : [];
    const active = !book.available
      ? [{ student: book.borrowedBy, borrowedAt: book.borrowedAt, dueDate: book.dueDate, returnedAt: "" }]
      : [];
    return [
      ...active.map((record) => ({ book, record, isCurrent: true })),
      ...completed.map((record) => ({ book, record, isCurrent: false }))
    ];
  }).sort((a, b) => {
    const aTime = Date.parse(a.record.borrowedAt || a.record.returnedAt || "") || 0;
    const bTime = Date.parse(b.record.borrowedAt || b.record.returnedAt || "") || 0;
    return bTime - aTime;
  });
}

function getLoanHistoryStatus(record, isCurrent) {
  if (!isCurrent) return "returned";
  const days = record.dueDate ? daysFromToday(record.dueDate) : null;
  return days !== null && days < 0 ? "overdue" : "borrowed";
}

function renderHistoryList() {
  const studentFilter = document.getElementById("historyStudentFilter").value.trim().toLocaleLowerCase();
  const bookFilter = document.getElementById("historyBookFilter").value.trim().toLocaleLowerCase();
  const fromDate = document.getElementById("historyFromDate").value;
  const toDate = document.getElementById("historyToDate").value;
  const statusFilter = document.getElementById("historyStatusFilter").value;
  const invalidRange = fromDate && toDate && fromDate > toDate;
  const matchingRecords = invalidRange ? [] : getLoanHistoryRecords().filter(({ book, record }) => {
    if (historyScopeBookId && book.id !== historyScopeBookId) return false;
    const student = String(record.student || "").trim().toLocaleLowerCase();
    if (studentFilter && !student.includes(studentFilter)) return false;
    const title = String(book.title || "").trim().toLocaleLowerCase();
    if (bookFilter && !title.includes(bookFilter)) return false;
    const borrowedDate = historyDateKey(record.borrowedAt);
    if (fromDate && (!borrowedDate || borrowedDate < fromDate)) return false;
    if (toDate && (!borrowedDate || borrowedDate > toDate)) return false;
    return true;
  });
  const statusCounts = { returned: 0, borrowed: 0, overdue: 0 };
  matchingRecords.forEach(({ record, isCurrent }) => {
    statusCounts[getLoanHistoryStatus(record, isCurrent)] += 1;
  });
  document.getElementById("historyReturnedCount").textContent = statusCounts.returned;
  document.getElementById("historyBorrowedCount").textContent = statusCounts.borrowed;
  document.getElementById("historyOverdueCount").textContent = statusCounts.overdue;
  document.querySelectorAll("[data-history-status]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.historyStatus === statusFilter));
  });
  const records = statusFilter
    ? matchingRecords.filter(({ record, isCurrent }) => getLoanHistoryStatus(record, isCurrent) === statusFilter)
    : matchingRecords;

  const resultCount = document.getElementById("historyResultCount");
  const historyList = document.getElementById("historyList");
  if (invalidRange) {
    resultCount.textContent = "Choose a start date on or before the end date.";
    historyList.innerHTML = `<li class="history-empty">The date range needs a quick check.</li>`;
    return;
  }

  const hasFilters = Boolean(studentFilter || bookFilter || fromDate || toDate || statusFilter);
  resultCount.textContent = `${records.length} ${records.length === 1 ? "loan" : "loans"} found`;
  if (!records.length) {
    const emptyText = hasFilters
      ? "No loans match these filters. Try another book title, student, or date range."
      : historyScopeBookId
        ? "No borrowing records for this book yet."
        : "No borrowing records in this library yet.";
    historyList.innerHTML = `<li class="history-empty">${emptyText}</li>`;
    return;
  }

  historyList.innerHTML = records.map(({ book, record, isCurrent }) => {
    const loanStatus = getLoanHistoryStatus(record, isCurrent);
    const overdue = loanStatus === "overdue";
    const status = loanStatus === "returned" ? "Returned" : overdue ? "Overdue" : "Reading now";
    const statusClass = loanStatus === "returned" ? "is-returned" : overdue ? "is-overdue" : "";
    const entryClass = isCurrent ? ` is-current${overdue ? " is-overdue" : ""}` : "";
    const dueText = record.dueDate ? `Due back ${formatDueDate(record.dueDate)}` : "Due date not recorded";
    const returnedText = isCurrent ? "" : ` · Returned ${formatHistoryDate(record.returnedAt)}`;
    return `<li class="history-entry${entryClass}">
      <span class="history-entry-icon" aria-hidden="true">${escapeHtml(book.emoji || "📖")}</span>
      <span class="history-entry-copy"><strong>${escapeHtml(record.student || "Student name not recorded")} · ${escapeHtml(book.title)}</strong><span>Borrowed ${formatHistoryDate(record.borrowedAt)} · ${dueText}${returnedText}</span></span>
      <span class="history-status ${statusClass}">${status}</span>
    </li>`;
  }).join("");
}

function openHistoryModal(bookId = null) {
  const book = bookId ? books.find((item) => item.id === bookId) : null;
  if (bookId && !book) return;
  historyScopeBookId = book ? book.id : null;
  document.getElementById("historyModalTitle").textContent = book ? "Book borrowing history" : "Library borrowing history";
  document.getElementById("historyBookTitle").textContent = book ? `📖  ${book.title}` : "All books in our library";
  document.getElementById("historyStudentFilter").value = "";
  document.getElementById("historyBookFilter").value = "";
  document.getElementById("historyFromDate").value = "";
  document.getElementById("historyToDate").value = "";
  document.getElementById("historyStatusFilter").value = "";
  renderHistoryList();
  openModal(document.getElementById("historyModal"));
  document.getElementById("historyStudentFilter").focus();
}

function getVisibleBooks() {
  const search = searchInput.value.trim().toLowerCase();
  return books.filter((book) => {
    const statusFilter = ["all", "available", "borrowed", "overdue"].includes(currentFilter);
    const matchesFilter = currentFilter === "all"
      || currentFilter === "available" && book.available
      || currentFilter === "borrowed" && !book.available
      || currentFilter === "overdue" && isOverdue(book)
      || !statusFilter && book.category === currentFilter;
    const matchesSearch = !search || `${book.title} ${book.author || ""} ${book.category}`.toLowerCase().includes(search);
    return matchesFilter && matchesSearch;
  });
}

function render() {
  const available = books.filter((book) => book.available).length;
  const borrowed = books.length - available;
  const overdue = books.filter(isOverdue).length;
  document.getElementById("allCount").textContent = books.length;
  document.getElementById("availableCount").textContent = available;
  document.getElementById("borrowedCount").textContent = borrowed;
  document.getElementById("overdueNavCount").textContent = overdue;
  document.getElementById("totalStat").textContent = books.length;
  document.getElementById("availableStat").textContent = available;
  document.getElementById("borrowedStat").textContent = borrowed;
  renderRoleControls();
  renderInsights();
  renderDueDates();

  const visible = getVisibleBooks();
  document.getElementById("visibleCount").textContent = visible.length;
  grid.innerHTML = visible.map(bookCard).join("");
  emptyState.hidden = visible.length > 0;
  grid.hidden = visible.length === 0;
  renderCategories();
  renderFilterName();
}

function renderInsights() {
  const completedReturns = books.flatMap((book) =>
    (Array.isArray(book.history) ? book.history : []).map((record) => ({ ...record }))
  );
  const returnStats = { onTime: 0, late: 0 };
  let excludedReturns = 0;

  completedReturns.forEach((record) => {
    const dueMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(record.dueDate || "");
    const returnedAt = new Date(record.returnedAt || "");
    if (!dueMatch || Number.isNaN(returnedAt.getTime())) {
      excludedReturns += 1;
      return;
    }

    const dueYear = Number(dueMatch[1]);
    const dueMonth = Number(dueMatch[2]) - 1;
    const dueDay = Number(dueMatch[3]);
    const dueDate = new Date(dueYear, dueMonth, dueDay);
    if (dueDate.getFullYear() !== dueYear || dueDate.getMonth() !== dueMonth || dueDate.getDate() !== dueDay) {
      excludedReturns += 1;
      return;
    }

    const dueDayNumber = Date.UTC(dueYear, dueMonth, dueDay);
    const returnedDayNumber = Date.UTC(returnedAt.getFullYear(), returnedAt.getMonth(), returnedAt.getDate());
    if (returnedDayNumber <= dueDayNumber) returnStats.onTime += 1;
    else returnStats.late += 1;
  });

  const popularBooks = books.map((book) => ({
    book,
    count: (Array.isArray(book.history) ? book.history.length : 0) + (book.available ? 0 : 1)
  })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count || a.book.title.localeCompare(b.book.title));
  const totalLoans = popularBooks.reduce((sum, item) => sum + item.count, 0);
  const maxLoans = popularBooks.length ? popularBooks[0].count : 0;
  document.getElementById("totalLoanCount").textContent = `${totalLoans} ${totalLoans === 1 ? "loan" : "loans"}`;
  document.getElementById("mostBorrowedBooks").innerHTML = popularBooks.length
    ? popularBooks.slice(0, 5).map(({ book, count }, index) => {
      const barWidth = Math.round(count / maxLoans * 100);
      return `<li class="popular-book-row">
        <span class="popular-rank" aria-hidden="true">${index + 1}</span>
        <span class="popular-book-icon" aria-hidden="true">${escapeHtml(book.emoji || "📖")}</span>
        <span class="popular-book-copy"><strong title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</strong><span>${escapeHtml(book.author || "Author not added")}</span><span class="popular-meter" aria-hidden="true"><span style="width:${barWidth}%"></span></span></span>
        <span class="popular-count"><strong>${count}</strong><small>${count === 1 ? "loan" : "loans"}</small></span>
      </li>`;
    }).join("")
    : `<li class="popular-empty">Borrow a book to start our reader favorites list.</li>`;

  const totalReturns = returnStats.onTime + returnStats.late;
  const onTimePercent = totalReturns ? Math.round(returnStats.onTime / totalReturns * 100) : 0;
  document.getElementById("onTimeReturnCount").textContent = returnStats.onTime;
  document.getElementById("lateReturnCount").textContent = returnStats.late;
  document.getElementById("onTimeReturnSegment").style.width = `${onTimePercent}%`;
  document.getElementById("lateReturnSegment").style.width = `${totalReturns ? 100 - onTimePercent : 0}%`;
  document.getElementById("returnPatternBar").setAttribute("aria-label", totalReturns
    ? `${onTimePercent}% of ${totalReturns} completed returns were on time; ${100 - onTimePercent}% were late.`
    : "No completed returns with due dates yet");

  const note = totalReturns
    ? `Based on ${totalReturns} completed ${totalReturns === 1 ? "return" : "returns"}${excludedReturns ? `; ${excludedReturns} ${excludedReturns === 1 ? "record is" : "records are"} missing a usable due date` : " with due dates"}.`
    : excludedReturns
      ? `${excludedReturns} completed ${excludedReturns === 1 ? "return needs" : "returns need"} a due date before its timing can be shown.`
      : "Completed returns with due dates will show here.";
  document.getElementById("returnPatternNote").textContent = note;
}

function daysFromToday(dateString) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString || "");
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dueTime = Date.UTC(year, month - 1, day);
  const today = new Date();
  const todayTime = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((dueTime - todayTime) / 86400000);
}

function isOverdue(book) {
  if (book.available || !book.dueDate) return false;
  const days = daysFromToday(book.dueDate);
  return days !== null && days < 0;
}

function dueLabel(days) {
  if (days < 0) {
    const lateDays = Math.abs(days);
    return `${lateDays} ${lateDays === 1 ? "day" : "days"} overdue`;
  }
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function renderDueList(listId, items, emptyText) {
  const list = document.getElementById(listId);
  if (!items.length) {
    list.innerHTML = `<li class="due-empty">${emptyText}</li>`;
    return;
  }
  list.innerHTML = items.map(({ book, days }) => `
    <li class="due-book-row">
      <span class="due-book-icon" aria-hidden="true">${escapeHtml(book.emoji || "📖")}</span>
      <span class="due-book-copy"><strong>${escapeHtml(book.title)}</strong><span>With ${escapeHtml(book.borrowedBy || "a student")}</span></span>
      <span class="due-date-pill">${dueLabel(days)}</span>
    </li>`).join("");
}

function renderDueDates() {
  const datedBorrowedBooks = books
    .filter((book) => !book.available && book.dueDate)
    .map((book) => ({ book, days: daysFromToday(book.dueDate) }))
    .filter((item) => item.days !== null);
  const overdue = datedBorrowedBooks.filter((item) => item.days < 0).sort((a, b) => a.days - b.days);
  const dueSoon = datedBorrowedBooks.filter((item) => item.days >= 0 && item.days <= 7).sort((a, b) => a.days - b.days);
  document.getElementById("overdueCount").textContent = overdue.length;
  document.getElementById("dueSoonCount").textContent = dueSoon.length;
  renderDueList("overdueList", overdue, "No overdue books. Hooray!");
  renderDueList("dueSoonList", dueSoon, "No books due in the next 7 days.");
  renderStudentReminders(overdue);
}

function renderStudentReminders(overdue) {
  const groupsByStudent = new Map();
  overdue.forEach((item) => {
    const name = String(item.book.borrowedBy || "").trim();
    const key = name ? name.toLocaleLowerCase() : "__student_name_missing__";
    if (!groupsByStudent.has(key)) {
      groupsByStudent.set(key, { name: name || "Student name not recorded", books: [] });
    }
    groupsByStudent.get(key).books.push(item);
  });

  const groups = [...groupsByStudent.values()];
  groups.forEach((group) => group.books.sort((a, b) => a.days - b.days));
  groups.sort((a, b) => {
    const latenessDifference = a.books[0].days - b.books[0].days;
    return latenessDifference || a.name.localeCompare(b.name);
  });

  document.getElementById("studentReminderCount").textContent = groups.length;
  document.getElementById("studentReminderGroups").innerHTML = groups.length
    ? groups.map((group) => {
      const countLabel = `${group.books.length} ${group.books.length === 1 ? "book" : "books"} overdue`;
      const overdueBooks = group.books.map(({ book, days }) => `
        <li class="student-reminder-book">
          <span class="student-reminder-book-icon" aria-hidden="true">${escapeHtml(book.emoji || "📖")}</span>
          <strong title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</strong>
          <span class="student-reminder-late">${dueLabel(days)}</span>
        </li>`).join("");
      return `<article class="student-reminder-card">
        <div class="student-reminder-heading">
          <span class="student-reminder-avatar" aria-hidden="true">🧑‍🎓</span>
          <div class="student-reminder-copy"><strong title="${escapeHtml(group.name)}">${escapeHtml(group.name)}</strong><span>${countLabel}</span></div>
          <span class="student-reminder-badge">${group.books.length}</span>
        </div>
        <ul class="student-reminder-books">${overdueBooks}</ul>
      </article>`;
    }).join("")
    : `<div class="student-reminder-empty">No student reminders right now. Hooray!</div>`;
  setDueView(currentDueView);
}

function setDueView(view) {
  currentDueView = view === "students" ? "students" : "books";
  const isStudentView = currentDueView === "students";
  document.getElementById("dueBooksTab").classList.toggle("active", !isStudentView);
  document.getElementById("studentRemindersTab").classList.toggle("active", isStudentView);
  document.getElementById("dueBooksTab").setAttribute("aria-pressed", String(!isStudentView));
  document.getElementById("studentRemindersTab").setAttribute("aria-pressed", String(isStudentView));
  document.getElementById("dueBooksView").hidden = isStudentView;
  document.getElementById("studentRemindersView").hidden = !isStudentView;
  document.getElementById("dueWindowLabel").textContent = isStudentView ? "Past due" : "Next 7 days";
}

function renderRoleControls() {
  const isAdmin = currentRole === "admin";
  document.getElementById("currentRoleName").textContent = isAdmin ? "Admin" : "Reader";
  document.getElementById("roleIcon").innerHTML = isAdmin ? adminRoleIcon : "📖";
  document.querySelector(".role-switch-destination").textContent = "Sign out";
  document.getElementById("logoutButton").setAttribute("aria-label", `Sign out from ${isAdmin ? "Admin" : "Reader"} account`);
  document.getElementById("openAddBook").hidden = !isAdmin;
  document.getElementById("readerTourButton").hidden = isAdmin;
  const recoveryButton = document.getElementById("manageRecoveryButton");
  recoveryButton.hidden = !isAdmin;
  recoveryButton.textContent = recoveryConfigured ? "🔐 Replace recovery key" : "🔐 Set up recovery key";
  document.getElementById("manageAccountPasswordsButton").hidden = !isAdmin;
}

function bookCard(book) {
  const borrowed = !book.available;
  const history = Array.isArray(book.history) ? book.history : [];
  const due = formatDueDate(book.dueDate);
  const overdueDays = borrowed && book.dueDate ? daysFromToday(book.dueDate) : null;
  const isLate = overdueDays !== null && overdueDays < 0;
  const cover = book.coverImage
    ? `<img class="cover-image" src="${book.coverImage}" alt="Cover of ${escapeHtml(book.title)}" />`
    : `<span class="cover-ribbon">A GOOD STORY</span><span class="cover-emoji" aria-hidden="true">${book.emoji || "📖"}</span>`;
  const borrowInfo = borrowed
    ? `<div class="borrow-details">Reading with <strong>${escapeHtml(book.borrowedBy || "A friend")}</strong>${isLate ? ` · ${dueLabel(overdueDays)}` : due ? ` · Back by ${escapeHtml(due)}` : ""}</div>`
    : "";
  let action;
  if (currentRole === "admin") {
    action = `<div class="admin-book-actions"><button class="book-action edit-action" type="button" data-edit="${escapeHtml(book.id)}" aria-label="Edit ${escapeHtml(book.title)}">✏️ Edit</button><button class="book-action remove-action" type="button" data-remove="${escapeHtml(book.id)}" aria-label="Remove ${escapeHtml(book.title)}">🗑 Remove</button></div>`;
  } else if (borrowed) {
    action = `<button class="book-action return-action" type="button" data-return="${escapeHtml(book.id)}">↩ Mark as returned</button>`;
  } else {
    action = `<button class="book-action" type="button" data-borrow="${escapeHtml(book.id)}">📖 Borrow this book</button>`;
  }
  const historyButton = `<button class="history-button" type="button" data-history="${escapeHtml(book.id)}" aria-label="View borrowing history for ${escapeHtml(book.title)}">🕘 Borrowing history <span>${history.length}</span></button>`;
  return `<article class="book-card${isLate ? " is-overdue" : ""}">
    <div class="cover-wrap" style="--cover:${safeColor(book.color)}">${cover}<span class="status-pill ${borrowed ? "is-borrowed" : ""}${isLate ? " is-overdue" : ""}"><span class="status-dot"></span>${isLate ? dueLabel(overdueDays) : borrowed ? "Out exploring" : "Ready to read"}</span></div>
    <div class="book-info"><div class="book-category">${escapeHtml(book.category || "Other")}</div><h3 class="book-title">${escapeHtml(book.title)}</h3><p class="book-author">${escapeHtml(book.author || "Author not added")}</p>${borrowInfo}<div class="book-actions">${action}${historyButton}</div></div>
  </article>`;
}

function renderCategories() {
  const counts = new Map();
  books.forEach((book) => counts.set(book.category || "Other", (counts.get(book.category || "Other") || 0) + 1));
  document.getElementById("categoryNav").innerHTML = [...counts.entries()].map(([category, count]) => {
    const selected = currentFilter === category ? " selected" : "";
    return `<button class="category-link${selected}" type="button" data-filter="${escapeHtml(category)}"><span class="category-dot" aria-hidden="true">${categoryEmojis[category] || "📖"}</span>${escapeHtml(category)}<span class="nav-count">${count}</span></button>`;
  }).join("");
}

function renderFilterName() {
  const labels = { all: "All stories", available: "Ready to read", borrowed: "Borrowed out", overdue: "Overdue" };
  const name = labels[currentFilter] || currentFilter;
  document.getElementById("breadcrumbCurrent").textContent = name;
  document.getElementById("booksHeading").textContent = currentFilter === "all"
    ? currentRole === "admin" ? "Manage your shelf" : "Choose a story"
    : name;
  document.getElementById("booksSubheading").textContent = currentFilter === "overdue"
    ? "These books are past their return date."
    : currentRole === "admin"
      ? "Add new books or remove books from the shelf."
      : currentFilter === "borrowed"
        ? "These books are currently with a student."
        : currentFilter === "available"
          ? "Pick a book to borrow and enjoy!"
          : "Find your next favorite adventure!";
  document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.filter === currentFilter));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function safeColor(color) {
  return /^#[0-9a-f]{3,8}$/i.test(color || "") ? color : "#e6e0ff";
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}

function openModal(dialog) {
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function clearCoverPreview() {
  if (coverPreviewObjectUrl) {
    URL.revokeObjectURL(coverPreviewObjectUrl);
    coverPreviewObjectUrl = null;
  }
  const preview = document.getElementById("coverPreview");
  preview.removeAttribute("src");
  preview.alt = "";
  preview.hidden = true;
  document.getElementById("coverPreviewWrap").hidden = true;
  document.getElementById("coverUploadIcon").hidden = false;
}

function showCoverPreview(source, description) {
  const preview = document.getElementById("coverPreview");
  preview.src = source;
  preview.alt = description;
  preview.hidden = false;
  document.getElementById("coverPreviewWrap").hidden = false;
  document.getElementById("coverUploadIcon").hidden = true;
}

function resetCoverUpload() {
  clearCoverPreview();
  document.getElementById("uploadText").innerHTML = "<strong>Choose a cover picture</strong><small>JPG or PNG, up to 8 MB</small>";
}

function closeModal(dialog) {
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function makeId() {
  return `book-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function resizeCover(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that picture."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("That picture could not be opened."));
      image.onload = () => {
        const maxSide = 700;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

document.addEventListener("click", async (event) => {
  const openLibraryHistoryButton = event.target.closest("#openLibraryHistory");
  if (openLibraryHistoryButton) {
    openHistoryModal();
    return;
  }
  const dueViewButton = event.target.closest("[data-due-view]");
  if (dueViewButton) {
    setDueView(dueViewButton.dataset.dueView);
    return;
  }
  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    if (currentRole !== "admin") return;
    const book = books.find((item) => item.id === editButton.dataset.edit);
    if (!book) return;
    selectedEditBookId = book.id;
    document.getElementById("bookForm").reset();
    clearCoverPreview();
    document.getElementById("bookFormError").textContent = "";
    document.getElementById("bookModalKicker").textContent = "UPDATE THIS STORY";
    document.getElementById("bookModalTitle").textContent = "Edit book details";
    document.getElementById("bookModalDescription").textContent = "Update the details or choose a new cover picture.";
    document.getElementById("bookFormSubmitText").textContent = "Save book changes";
    document.getElementById("bookTitle").value = book.title;
    document.getElementById("bookAuthor").value = book.author || "";
    document.getElementById("bookCategory").value = book.category || "Other";
    document.getElementById("uploadText").innerHTML = book.coverImage
      ? "<strong>Current cover is shown</strong><small>Choose a new picture to replace it</small>"
      : "<strong>Choose a cover picture</strong><small>JPG or PNG, up to 8 MB</small>";
    if (book.coverImage) showCoverPreview(book.coverImage, `Current cover for ${book.title}`);
    openModal(document.getElementById("bookModal"));
    document.getElementById("bookTitle").focus();
    return;
  }
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    if (currentRole !== "admin") return;
    selectedRemoveBookId = removeButton.dataset.remove;
    const book = books.find((item) => item.id === selectedRemoveBookId);
    if (!book) return;
    document.getElementById("removeBookName").textContent = `📖  ${book.title}`;
    openModal(document.getElementById("removeModal"));
    return;
  }
  const historyButton = event.target.closest("[data-history]");
  if (historyButton) {
    openHistoryModal(historyButton.dataset.history);
    return;
  }
  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    currentFilter = filterButton.dataset.filter;
    render();
    return;
  }
  const borrowButton = event.target.closest("[data-borrow]");
  if (borrowButton) {
    if (currentRole !== "reader") return;
    selectedBookId = borrowButton.dataset.borrow;
    const book = books.find((item) => item.id === selectedBookId);
    document.getElementById("selectedBookName").textContent = `📖  ${book.title}`;
    document.getElementById("borrowFormError").textContent = "";
    document.getElementById("borrowForm").reset();
    openModal(document.getElementById("borrowModal"));
    document.getElementById("studentName").focus();
    return;
  }
  const returnButton = event.target.closest("[data-return]");
  if (returnButton) {
    if (currentRole !== "reader") return;
    const book = books.find((item) => item.id === returnButton.dataset.return);
    if (!book) return;
    try {
      const result = await api(`/api/books/${encodeURIComponent(book.id)}/return`, { method: "POST" });
      Object.assign(book, result.book);
      render();
      showToast(`${book.title} is back on the shelf!`);
    } catch (error) {
      showToast(error.message);
    }
    return;
  }
  const closeButton = event.target.closest("[data-close]");
  if (closeButton) closeModal(document.getElementById(closeButton.dataset.close));
});

document.getElementById("logoutButton").addEventListener("click", async () => {
  try { await api("/api/logout", { method: "POST", body: {} }); } catch { /* Clear this page even if the local server stopped. */ }
  lockApp();
  document.getElementById("authError").textContent = "You have signed out. Choose a role to sign back in.";
});

document.getElementById("forgotPasswordButton").addEventListener("click", showPasswordRecovery);
document.getElementById("manageRecoveryButton").addEventListener("click", openRecoveryKeyManager);
document.getElementById("manageAccountPasswordsButton").addEventListener("click", openAccountPasswords);
document.getElementById("recoveryKeyConfirm").addEventListener("click", async () => {
  if (currentRole !== "admin") return;
  const button = document.getElementById("recoveryKeyConfirm");
  const error = document.getElementById("recoveryKeyError");
  button.disabled = true;
  error.textContent = "";
  try {
    const result = await api("/api/recovery-key", { method: "POST", body: {} });
    recoveryConfigured = true;
    renderRoleControls();
    showRecoveryKey(result.recoveryCode);
  } catch (reason) {
    error.textContent = reason.message;
  } finally {
    button.disabled = false;
  }
});
document.getElementById("copyRecoveryKey").addEventListener("click", async () => {
  const input = document.getElementById("recoveryKeyValue");
  const status = document.getElementById("recoveryCopyStatus");
  input.select();
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(input.value);
    } else if (!document.execCommand("copy")) {
      throw new Error("Copy failed.");
    }
    status.textContent = "Recovery key copied. Keep it somewhere private.";
  } catch {
    status.textContent = "The key is selected. Copy it and keep it somewhere private.";
  }
});
document.getElementById("recoveryKeyModal").addEventListener("close", () => {
  document.getElementById("recoveryKeyValue").value = "";
  document.getElementById("recoveryCopyStatus").textContent = "";
  if (currentRole === "admin") document.getElementById("manageRecoveryButton").focus();
});
document.getElementById("recoveryResetModal").addEventListener("close", () => {
  document.getElementById("recoveryResetForm").reset();
  document.getElementById("recoveryResetError").textContent = "";
  resetPasswordVisibility();
});
document.getElementById("recoveryResetForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const recoveryCode = document.getElementById("recoveryCodeInput").value.trim();
  const newPassword = document.getElementById("recoveryPassword").value;
  const confirmation = document.getElementById("confirmRecoveryPassword").value;
  const error = document.getElementById("recoveryResetError");
  const button = document.getElementById("recoveryResetSubmit");
  const roleLabel = selectedLoginRole === "admin" ? "Admin" : "Reader";
  error.textContent = "";
  if (newPassword.length < 6) {
    error.textContent = "Use at least 6 characters for the new password.";
    return;
  }
  if (newPassword !== confirmation) {
    error.textContent = "The new passwords do not match yet.";
    return;
  }
  button.disabled = true;
  button.textContent = "Updating password...";
  try {
    await api("/api/recover", { method: "POST", body: { role: selectedLoginRole, recoveryCode, newPassword } });
    closeModal(document.getElementById("recoveryResetModal"));
    document.getElementById("loginPassword").value = "";
    document.getElementById("authError").textContent = `${roleLabel} password updated. Sign in with your new password.`;
    document.getElementById("loginPassword").focus();
  } catch (reason) {
    error.textContent = reason.message;
  } finally {
    button.disabled = false;
    button.textContent = "Reset password";
  }
});

document.getElementById("accountPasswordsModal").addEventListener("close", () => {
  document.getElementById("adminPasswordChangeForm").reset();
  document.getElementById("readerPasswordChangeForm").reset();
  document.getElementById("adminPasswordChangeError").textContent = "";
  document.getElementById("readerPasswordChangeError").textContent = "";
  document.getElementById("adminPasswordChangeStatus").textContent = "";
  document.getElementById("readerPasswordChangeStatus").textContent = "";
  resetPasswordVisibility();
  if (currentRole === "admin") document.getElementById("manageAccountPasswordsButton").focus();
});
document.getElementById("adminChangePassword").addEventListener("input", () => {
  updatePasswordStrength("adminChange");
  updatePasswordMatch("adminChange");
});
document.getElementById("confirmAdminChangePassword").addEventListener("input", () => updatePasswordMatch("adminChange"));
document.getElementById("readerChangePassword").addEventListener("input", () => {
  updatePasswordStrength("readerChange");
  updatePasswordMatch("readerChange");
});
document.getElementById("confirmReaderChangePassword").addEventListener("input", () => updatePasswordMatch("readerChange"));
document.getElementById("adminPasswordChangeForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (currentRole !== "admin") return;
  const currentPassword = document.getElementById("currentAdminPassword").value;
  const newPassword = document.getElementById("adminChangePassword").value;
  const confirmation = document.getElementById("confirmAdminChangePassword").value;
  const error = document.getElementById("adminPasswordChangeError");
  const status = document.getElementById("adminPasswordChangeStatus");
  const button = document.getElementById("adminPasswordChangeSubmit");
  error.textContent = "";
  status.textContent = "";
  if (newPassword.length < 6) {
    error.textContent = "Use at least 6 characters for the new Admin password.";
    return;
  }
  if (newPassword !== confirmation) {
    error.textContent = "The Admin passwords do not match yet.";
    return;
  }
  button.disabled = true;
  button.textContent = "Updating password...";
  try {
    await api("/api/admin/account-password", { method: "POST", body: { currentPassword, newPassword, confirmation } });
    document.getElementById("adminPasswordChangeForm").reset();
    resetPasswordVisibility();
    status.textContent = "Admin password updated. This session is still signed in.";
  } catch (reason) {
    error.textContent = reason.message;
  } finally {
    button.disabled = false;
    button.textContent = "Change Admin password";
  }
});
document.getElementById("readerPasswordChangeForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (currentRole !== "admin") return;
  const newPassword = document.getElementById("readerChangePassword").value;
  const confirmation = document.getElementById("confirmReaderChangePassword").value;
  const error = document.getElementById("readerPasswordChangeError");
  const status = document.getElementById("readerPasswordChangeStatus");
  const button = document.getElementById("readerPasswordChangeSubmit");
  error.textContent = "";
  status.textContent = "";
  if (newPassword.length < 6) {
    error.textContent = "Use at least 6 characters for the new Reader password.";
    return;
  }
  if (newPassword !== confirmation) {
    error.textContent = "The Reader passwords do not match yet.";
    return;
  }
  button.disabled = true;
  button.textContent = "Updating password...";
  try {
    await api("/api/admin/reader-password", { method: "POST", body: { newPassword, confirmation } });
    document.getElementById("readerPasswordChangeForm").reset();
    resetPasswordVisibility();
    status.textContent = "Reader password updated. Readers will need to sign in again.";
  } catch (reason) {
    error.textContent = reason.message;
  } finally {
    button.disabled = false;
    button.textContent = "Change Reader password";
  }
});

document.getElementById("accessibilitySettingsButton").addEventListener("click", openAccessibilitySettings);
document.getElementById("authAccessibilitySettingsButton").addEventListener("click", openAccessibilitySettings);
document.getElementById("largerTextToggle").addEventListener("change", saveAccessibilityPreferences);
document.getElementById("highContrastToggle").addEventListener("change", saveAccessibilityPreferences);
document.getElementById("accessibilitySettingsModal").addEventListener("close", () => {
  const returnButton = currentRole
    ? document.getElementById("accessibilitySettingsButton")
    : document.getElementById("authAccessibilitySettingsButton");
  returnButton.focus();
});

document.getElementById("readerTourButton").addEventListener("click", openReaderTour);
document.getElementById("readerTourSkip").addEventListener("click", () => closeModal(document.getElementById("readerTourModal")));
document.getElementById("readerTourBack").addEventListener("click", () => updateReaderTourStep(readerTourStep - 1));
document.getElementById("readerTourNext").addEventListener("click", () => updateReaderTourStep(readerTourStep + 1));
document.getElementById("readerTourFinish").addEventListener("click", () => closeModal(document.getElementById("readerTourModal")));
document.getElementById("readerTourModal").addEventListener("close", () => {
  if (currentRole === "reader") document.getElementById("readerTourButton").focus();
});

document.querySelectorAll("[data-auth-role]").forEach((button) => {
  button.addEventListener("click", () => updateLoginRole(button.dataset.authRole));
});

document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  setPasswordToggleState(button, false);
  button.addEventListener("click", () => {
    const group = button.dataset.passwordToggle;
    const inputs = Array.from(document.querySelectorAll("[data-password-group]"))
      .filter((input) => input.dataset.passwordGroup === group);
    const isVisible = inputs.some((input) => input.type === "password");
    inputs.forEach((input) => {
      input.type = isVisible ? "text" : "password";
    });
    document.querySelectorAll("[data-password-toggle]").forEach((toggle) => {
      if (toggle.dataset.passwordToggle !== group) return;
      setPasswordToggleState(toggle, isVisible);
    });
  });
});
document.getElementById("adminPassword").addEventListener("input", () => {
  updatePasswordStrength("admin");
  updatePasswordMatch("admin");
  updateAccountSetupChecklist();
});
document.getElementById("confirmAdminPassword").addEventListener("input", () => {
  updatePasswordMatch("admin");
  updateAccountSetupChecklist();
});
document.getElementById("readerPassword").addEventListener("input", () => {
  updatePasswordStrength("reader");
  updatePasswordMatch("reader");
  updateAccountSetupChecklist();
});
document.getElementById("confirmReaderPassword").addEventListener("input", () => {
  updatePasswordMatch("reader");
  updateAccountSetupChecklist();
});
document.getElementById("recoveryPassword").addEventListener("input", () => {
  updatePasswordStrength("recovery");
  updatePasswordMatch("recovery");
});
document.getElementById("confirmRecoveryPassword").addEventListener("input", () => updatePasswordMatch("recovery"));

document.getElementById("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.getElementById("authError");
  const isSetup = !document.getElementById("setupFields").hidden;
  error.textContent = "";
  try {
    let session;
    if (isSetup) {
      const adminPassword = document.getElementById("adminPassword").value;
      const readerPassword = document.getElementById("readerPassword").value;
      if (adminPassword.length < 6 || readerPassword.length < 6) {
        throw new Error("Use at least 6 characters for each password.");
      }
      if (adminPassword !== document.getElementById("confirmAdminPassword").value) {
        throw new Error("The Admin passwords do not match.");
      }
      if (readerPassword !== document.getElementById("confirmReaderPassword").value) {
        throw new Error("The Reader passwords do not match.");
      }
      session = await api("/api/setup", {
        method: "POST",
        body: { adminPassword, readerPassword, books: loadLegacyBooks() }
      });
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* The server now holds the library copy. */ }
    } else {
      session = await api("/api/login", {
        method: "POST",
        body: { role: selectedLoginRole, password: document.getElementById("loginPassword").value }
      });
      document.getElementById("loginPassword").value = "";
    }
    showLibrary(session);
  } catch (reason) {
    error.textContent = reason.message;
  }
});

document.getElementById("confirmRemove").addEventListener("click", async () => {
  if (currentRole !== "admin") return;
  const book = books.find((item) => item.id === selectedRemoveBookId);
  if (!book) return;
  try {
    await api(`/api/books/${encodeURIComponent(book.id)}`, { method: "DELETE" });
    books = books.filter((item) => item.id !== selectedRemoveBookId);
    selectedRemoveBookId = null;
    closeModal(document.getElementById("removeModal"));
    render();
    showToast(`${book.title} was removed from the shelf.`);
  } catch (error) {
    showToast(error.message);
  }
});

document.getElementById("openAddBook").addEventListener("click", () => {
  if (currentRole !== "admin") return;
  selectedEditBookId = null;
  document.getElementById("bookForm").reset();
  resetCoverUpload();
  document.getElementById("bookFormError").textContent = "";
  document.getElementById("bookModalKicker").textContent = "A NEW ADVENTURE IS JOINING";
  document.getElementById("bookModalTitle").textContent = "Add a new story";
  document.getElementById("bookModalDescription").textContent = "Add the details and give this book a happy home.";
  document.getElementById("bookFormSubmitText").textContent = "Add to my bookshelf";
  document.getElementById("uploadText").innerHTML = "<strong>Choose a cover picture</strong><small>JPG or PNG, up to 8 MB</small>";
  openModal(document.getElementById("bookModal"));
  document.getElementById("bookTitle").focus();
});

document.getElementById("bookForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (currentRole !== "admin") return;
  const form = event.currentTarget;
  const file = document.getElementById("coverUpload").files[0];
  const error = document.getElementById("bookFormError");
  error.textContent = "";
  if (file && file.size > 8 * 1024 * 1024) {
    error.textContent = "That picture is too big. Please choose one under 8 MB.";
    return;
  }
  let coverImage = "";
  if (file) {
    try {
      coverImage = await resizeCover(file);
    } catch (reason) {
      error.textContent = reason.message;
      return;
    }
  }
  const formData = new FormData(form);
  const bookDetails = {
    title: String(formData.get("title")).trim(),
    author: String(formData.get("author")).trim(),
    category: String(formData.get("category"))
  };
  if (selectedEditBookId) {
    if (coverImage) bookDetails.coverImage = coverImage;
    try {
      const result = await api(`/api/books/${encodeURIComponent(selectedEditBookId)}`, { method: "PUT", body: bookDetails });
      const index = books.findIndex((book) => book.id === selectedEditBookId);
      if (index !== -1) books[index] = result.book;
    } catch (reason) {
      error.textContent = reason.message;
      return;
    }
    selectedEditBookId = null;
    form.reset();
    resetCoverUpload();
    closeModal(document.getElementById("bookModal"));
    render();
    showToast("Book details updated!");
    return;
  }
  const newBook = {
    id: makeId(),
    ...bookDetails,
    emoji: "📖",
    color: ["#e5ddff", "#d8efff", "#ffe8c6", "#dff2d5", "#f7dfd5"][Math.floor(Math.random() * 5)],
    coverImage,
    available: true
  };
  try {
    const result = await api("/api/books", { method: "POST", body: newBook });
    books.unshift(result.book);
  } catch (reason) {
    error.textContent = reason.message;
    return;
  }
  form.reset();
  resetCoverUpload();
  closeModal(document.getElementById("bookModal"));
  currentFilter = "all";
  searchInput.value = "";
  render();
  showToast("A new story found its way to your shelf!");
});

document.getElementById("coverUpload").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    clearCoverPreview();
    coverPreviewObjectUrl = URL.createObjectURL(file);
    showCoverPreview(coverPreviewObjectUrl, `Preview of ${file.name}`);
    document.getElementById("uploadText").innerHTML = `<strong>${escapeHtml(file.name)}</strong><small>Picture preview ready</small>`;
    return;
  }

  const book = books.find((item) => item.id === selectedEditBookId);
  clearCoverPreview();
  if (book && book.coverImage) {
    showCoverPreview(book.coverImage, `Current cover for ${book.title}`);
    document.getElementById("uploadText").innerHTML = "<strong>Current cover is shown</strong><small>Choose a new picture to replace it</small>";
  } else {
    document.getElementById("uploadText").innerHTML = "<strong>Choose a cover picture</strong><small>JPG or PNG, up to 8 MB</small>";
  }
});

document.getElementById("borrowForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (currentRole !== "reader") return;
  const student = document.getElementById("studentName").value.trim();
  const dueDate = document.getElementById("dueDate").value;
  const error = document.getElementById("borrowFormError");
  if (!student) {
    error.textContent = "Please add the student's name.";
    return;
  }
  const book = books.find((item) => item.id === selectedBookId);
  if (!book) return;
  try {
    const result = await api(`/api/books/${encodeURIComponent(book.id)}/borrow`, {
      method: "POST",
      body: { student, dueDate }
    });
    Object.assign(book, result.book);
  } catch (reason) {
    error.textContent = reason.message;
    return;
  }
  closeModal(document.getElementById("borrowModal"));
  render();
  showToast(`${book.title} has been lent to ${student}.`);
});

searchInput.addEventListener("input", render);
document.getElementById("historyStudentFilter").addEventListener("input", renderHistoryList);
document.getElementById("historyBookFilter").addEventListener("input", renderHistoryList);
document.getElementById("historyFromDate").addEventListener("input", renderHistoryList);
document.getElementById("historyToDate").addEventListener("input", renderHistoryList);
document.getElementById("historyStatusFilter").addEventListener("change", renderHistoryList);
document.querySelectorAll("[data-history-status]").forEach((button) => {
  button.addEventListener("click", () => {
    const statusFilter = document.getElementById("historyStatusFilter");
    statusFilter.value = statusFilter.value === button.dataset.historyStatus ? "" : button.dataset.historyStatus;
    renderHistoryList();
  });
});
document.getElementById("clearHistoryFilters").addEventListener("click", () => {
  document.getElementById("historyStudentFilter").value = "";
  document.getElementById("historyBookFilter").value = "";
  document.getElementById("historyFromDate").value = "";
  document.getElementById("historyToDate").value = "";
  document.getElementById("historyStatusFilter").value = "";
  renderHistoryList();
});
document.getElementById("clearFilters").addEventListener("click", () => {
  currentFilter = "all";
  searchInput.value = "";
  render();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !document.querySelector(".modal[open]") && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});

document.querySelectorAll(".modal").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog && dialog.id !== "authModal") closeModal(dialog);
  });
});
document.getElementById("bookModal").addEventListener("close", clearCoverPreview);

document.getElementById("todayLabel").textContent = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "long", day: "numeric" }).format(new Date());
applyAccessibilityPreferences();
initializeApp();
