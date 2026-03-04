// ─── Auth Store & Data Layer ──────────────────────────────────────────────────
// Client-side user/session management + scenario persistence.
// All data stored in localStorage. When a backend is added, replace
// these functions with real API calls.

import { calculate, type ExpenseData, type CalcOutput } from "./calc";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  createdAt: string; // ISO
  stripeCustomerId: string | null;
  isDevAdmin: boolean;
  emailWeeklyDigestEnabled: boolean;
  digestDayOfWeek: number; // 0-6, default 1 = Monday
  timezone: string;
}

export interface SavedScenario {
  id: string;
  userId: string;
  name: string;
  inputsJson: {
    expenses: ExpenseData;
    taxRate: number;
    currentGrossIncome?: number;
  };
  resultsJson: {
    hourlyRequired: number;
    grossMonthlyRequired: number;
    annualGrossRequired: number;
    monthlyExpensesTotal: number;
    healthScore: number;
    healthLabel: string;
    fragilityScore: number;
    fragilityLabel: string;
  };
  shareSlug: string | null;
  isPublic: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Session {
  userId: string;
  email: string;
  token: string;
  expiresAt: string; // ISO
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  USERS: "incomecalc-users",
  SESSION: "incomecalc-session",
  SCENARIOS: "incomecalc-saved-scenarios",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function genSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 8; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

function genToken(): string {
  return genId() + genId() + genId();
}

// ─── User CRUD ────────────────────────────────────────────────────────────────

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(KEYS.USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

function findUserByEmail(email: string): User | null {
  const users = loadUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

function findUserById(id: string): User | null {
  const users = loadUsers();
  return users.find((u) => u.id === id) ?? null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function signup(email: string, password: string): { user: User; session: Session } | { error: string } {
  const existing = findUserByEmail(email);
  if (existing) {
    return { error: "An account with this email already exists. Please sign in." };
  }

  const user: User = {
    id: genId(),
    email: email.toLowerCase().trim(),
    createdAt: new Date().toISOString(),
    stripeCustomerId: null,
    isDevAdmin: false,
    emailWeeklyDigestEnabled: true,
    digestDayOfWeek: 1,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles",
  };

  const users = loadUsers();
  users.push(user);
  saveUsers(users);

  // Store password hash (simplified for client-side: just store a hash-like key)
  localStorage.setItem(`incomecalc-pw-${user.id}`, btoa(password));

  const session = createSession(user);
  return { user, session };
}

export function login(email: string, password: string): { user: User; session: Session } | { error: string } {
  const user = findUserByEmail(email);
  if (!user) {
    return { error: "No account found with this email." };
  }

  const storedPw = localStorage.getItem(`incomecalc-pw-${user.id}`);
  if (!storedPw || storedPw !== btoa(password)) {
    return { error: "Incorrect password." };
  }

  const session = createSession(user);
  return { user, session };
}

export function logout(): void {
  localStorage.removeItem(KEYS.SESSION);
}

function createSession(user: User): Session {
  const session: Session = {
    userId: user.id,
    email: user.email,
    token: genToken(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  };
  localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
  return session;
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEYS.SESSION);
    if (!raw) return null;
    const session: Session = JSON.parse(raw);
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(KEYS.SESSION);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function getCurrentUser(): User | null {
  const session = getSession();
  if (!session) return null;
  return findUserById(session.userId);
}

export function updateUserPreferences(
  userId: string,
  prefs: Partial<Pick<User, "emailWeeklyDigestEnabled" | "digestDayOfWeek" | "timezone">>
): User | null {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...prefs };
  saveUsers(users);
  return users[idx];
}

// ─── Scenarios CRUD ───────────────────────────────────────────────────────────

function loadSavedScenarios(): SavedScenario[] {
  try {
    const raw = localStorage.getItem(KEYS.SCENARIOS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSavedScenarios(scenarios: SavedScenario[]): void {
  localStorage.setItem(KEYS.SCENARIOS, JSON.stringify(scenarios));
}

export function createScenario(
  userId: string,
  name: string,
  expenses: ExpenseData,
  taxRate: number,
  currentGrossIncome?: number
): SavedScenario {
  const outputs = calculate({ expenses, taxRate });
  const now = new Date().toISOString();

  const scenario: SavedScenario = {
    id: genId(),
    userId,
    name,
    inputsJson: { expenses, taxRate, currentGrossIncome },
    resultsJson: {
      hourlyRequired: outputs.hourlyRequired,
      grossMonthlyRequired: outputs.grossMonthlyRequired,
      annualGrossRequired: outputs.annualGrossRequired,
      monthlyExpensesTotal: outputs.monthlyExpensesTotal,
      healthScore: outputs.healthScore,
      healthLabel: outputs.healthLabel,
      fragilityScore: outputs.fragilityScore,
      fragilityLabel: outputs.fragilityLabel,
    },
    shareSlug: null,
    isPublic: false,
    createdAt: now,
    updatedAt: now,
  };

  const all = loadSavedScenarios();
  all.push(scenario);
  saveSavedScenarios(all);
  return scenario;
}

export function listScenarios(userId: string): SavedScenario[] {
  const all = loadSavedScenarios();
  return all
    .filter((s) => s.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getScenario(id: string): SavedScenario | null {
  const all = loadSavedScenarios();
  return all.find((s) => s.id === id) ?? null;
}

export function getScenarioBySlug(slug: string): SavedScenario | null {
  const all = loadSavedScenarios();
  return all.find((s) => s.shareSlug === slug && s.isPublic) ?? null;
}

export function deleteScenario(id: string, userId: string): boolean {
  const all = loadSavedScenarios();
  const idx = all.findIndex((s) => s.id === id && s.userId === userId);
  if (idx === -1) return false;
  all.splice(idx, 1);
  saveSavedScenarios(all);
  return true;
}

export function publishScenario(id: string, userId: string): SavedScenario | null {
  const all = loadSavedScenarios();
  const idx = all.findIndex((s) => s.id === id && s.userId === userId);
  if (idx === -1) return null;

  if (!all[idx].shareSlug) {
    all[idx].shareSlug = genSlug();
  }
  all[idx].isPublic = true;
  all[idx].updatedAt = new Date().toISOString();
  saveSavedScenarios(all);
  return all[idx];
}

export function unpublishScenario(id: string, userId: string): SavedScenario | null {
  const all = loadSavedScenarios();
  const idx = all.findIndex((s) => s.id === id && s.userId === userId);
  if (idx === -1) return null;

  all[idx].isPublic = false;
  all[idx].updatedAt = new Date().toISOString();
  saveSavedScenarios(all);
  return all[idx];
}

// ─── Weekly Digest Logic ──────────────────────────────────────────────────────

export interface DigestData {
  user: User;
  latestScenario: SavedScenario;
  previousScenario: SavedScenario | null;
  deltas: {
    monthlyRequired: number | null;
    hourlyRequired: number | null;
    healthScore: number | null;
  };
  recommendations: string[];
}

function generateRecommendations(scenario: SavedScenario): string[] {
  const recs: string[] = [];
  const inputs = scenario.inputsJson;
  const results = scenario.resultsJson;
  const expenses = inputs.expenses;
  const netMonthly = results.monthlyExpensesTotal;

  // Housing > 35% of net
  if (netMonthly > 0 && expenses.housing / netMonthly > 0.35) {
    const pct = Math.round((expenses.housing / netMonthly) * 100);
    recs.push(
      `Housing is ${pct}% of your net expenses (target: under 35%). Consider downsizing, getting a roommate, or negotiating rent.`
    );
  }

  // Transport > 15%
  if (netMonthly > 0 && expenses.transport / netMonthly > 0.15) {
    const pct = Math.round((expenses.transport / netMonthly) * 100);
    recs.push(
      `Transportation is ${pct}% of your expenses (target: under 15%). Look into carpooling, public transit, or a more fuel-efficient vehicle.`
    );
  }

  // Savings goal = 0
  if (expenses.savings === 0) {
    recs.push(
      "You have no savings allocation. Start with even $50/month to build an emergency fund and develop the habit."
    );
  }

  // Savings < 10%
  if (netMonthly > 0 && expenses.savings > 0 && expenses.savings / netMonthly < 0.1) {
    const pct = Math.round((expenses.savings / netMonthly) * 100);
    recs.push(
      `Savings rate is only ${pct}%. Aim for at least 15-20% to build financial resilience.`
    );
  }

  // Entertainment > 10%
  if (netMonthly > 0 && expenses.entertainment / netMonthly > 0.1) {
    const pct = Math.round((expenses.entertainment / netMonthly) * 100);
    recs.push(
      `Entertainment spending is ${pct}% of your budget. Consider free alternatives for some activities to redirect funds to savings.`
    );
  }

  // Health score < 50
  if (results.healthScore < 50) {
    recs.push(
      `Your financial health score is ${results.healthScore}/100. Focus on reducing high-ratio expenses and boosting your savings rate.`
    );
  }

  // Emergency fund < 3 months (use savings as proxy)
  const emergencyMonths = expenses.savings > 0 ? expenses.savings / (netMonthly - expenses.savings) : 0;
  if (emergencyMonths < 3 && netMonthly > 0) {
    recs.push(
      "Your emergency fund coverage is under 3 months. Prioritize building a 3-6 month emergency cushion before investing."
    );
  }

  // Food > 15%
  if (netMonthly > 0 && expenses.food / netMonthly > 0.15) {
    const pct = Math.round((expenses.food / netMonthly) * 100);
    recs.push(
      `Food spending is ${pct}% of your budget. Meal planning, bulk buying, and cooking at home can reduce this significantly.`
    );
  }

  return recs.slice(0, 3); // Return top 3
}

export function generateDigestForUser(userId: string): DigestData | null {
  const user = findUserById(userId);
  if (!user) return null;

  const scenarios = listScenarios(userId);
  if (scenarios.length === 0) return null;

  const latestScenario = scenarios[0];
  const previousScenario = scenarios.length > 1 ? scenarios[1] : null;

  const deltas = {
    monthlyRequired: previousScenario
      ? latestScenario.resultsJson.grossMonthlyRequired - previousScenario.resultsJson.grossMonthlyRequired
      : null,
    hourlyRequired: previousScenario
      ? latestScenario.resultsJson.hourlyRequired - previousScenario.resultsJson.hourlyRequired
      : null,
    healthScore: previousScenario
      ? latestScenario.resultsJson.healthScore - previousScenario.resultsJson.healthScore
      : null,
  };

  const recommendations = generateRecommendations(latestScenario);

  return { user, latestScenario, previousScenario, deltas, recommendations };
}

export function getAllDigestEligibleUsers(): User[] {
  return loadUsers().filter((u) => u.emailWeeklyDigestEnabled);
}

// ─── Unsubscribe Token ────────────────────────────────────────────────────────

export function generateUnsubscribeToken(userId: string): string {
  // Simple signed token: base64(userId:timestamp:signature)
  const timestamp = Date.now();
  const payload = `${userId}:${timestamp}`;
  // Simple HMAC-like signature using btoa (in production, use a real HMAC with CRON_SECRET)
  const signature = btoa(payload + ":incomecalc-unsub-secret").slice(0, 16);
  return btoa(`${payload}:${signature}`);
}

export function validateUnsubscribeToken(token: string): string | null {
  try {
    const decoded = atob(token);
    const parts = decoded.split(":");
    if (parts.length < 3) return null;

    const userId = parts[0];
    const timestamp = parseInt(parts[1]);
    const signature = parts[2];

    // Check if token is less than 7 days old
    if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) return null;

    // Verify signature
    const expectedSignature = btoa(`${userId}:${timestamp}:incomecalc-unsub-secret`).slice(0, 16);
    if (signature !== expectedSignature) return null;

    return userId;
  } catch {
    return null;
  }
}

export function unsubscribeUser(userId: string): boolean {
  const result = updateUserPreferences(userId, { emailWeeklyDigestEnabled: false });
  return result !== null;
}

// ─── Feature Flags ────────────────────────────────────────────────────────────

const ENV_KEYS = {
  DEV_BYPASS_PAYWALL: "DEV_BYPASS_PAYWALL",
  DEV_ADMIN_EMAILS: "DEV_ADMIN_EMAILS",
} as const;

export function isDevBypassPaywall(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("dev") !== "1") return false;

    const session = getSession();
    if (!session) return false;

    // Check if user email is in DEV_ADMIN_EMAILS
    // In production, this comes from env var. Client-side we use localStorage config.
    const adminEmails = getDevAdminEmails();
    return adminEmails.includes(session.email.toLowerCase());
  } catch {
    return false;
  }
}

export function getDevAdminEmails(): string[] {
  try {
    // Check localStorage for dev admin emails config
    const raw = localStorage.getItem("incomecalc-dev-admin-emails");
    if (raw) {
      return raw
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0);
    }
  } catch {
    // ignore
  }
  return [];
}

export function setDevAdminEmails(emails: string): void {
  localStorage.setItem("incomecalc-dev-admin-emails", emails);
}

// ─── Email Provider (stub) ────────────────────────────────────────────────────

export type EmailProvider = "resend" | "sendgrid" | "console";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export function getEmailProvider(): EmailProvider {
  try {
    const provider = localStorage.getItem("incomecalc-email-provider");
    if (provider === "resend" || provider === "sendgrid") return provider;
  } catch {
    // ignore
  }
  return "console";
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; message: string }> {
  const provider = getEmailProvider();

  if (provider === "console") {
    console.log("═══════════════════════════════════════════");
    console.log("📧 EMAIL (console provider)");
    console.log(`To: ${payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log("───────────────────────────────────────────");
    console.log(payload.html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
    console.log("═══════════════════════════════════════════");
    return { success: true, message: "Email logged to console (DEV mode)" };
  }

  // In production, these would call actual APIs
  // For now, log a warning and succeed
  console.warn(`Email provider "${provider}" configured but no API key set. Email logged to console.`);
  console.log(`📧 [${provider}] To: ${payload.to} | Subject: ${payload.subject}`);
  return { success: true, message: `Email queued via ${provider} (stub)` };
}

// ─── Digest Email Template ────────────────────────────────────────────────────

function fmtCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtDelta(n: number | null): string {
  if (n === null) return "N/A";
  const sign = n > 0 ? "+" : "";
  return sign + fmtCurrency(n);
}

function fmtDeltaNum(n: number | null): string {
  if (n === null) return "N/A";
  const sign = n > 0 ? "+" : "";
  return sign + n.toFixed(0);
}

export function buildDigestEmailHtml(digest: DigestData, appBaseUrl: string): string {
  const unsubToken = generateUnsubscribeToken(digest.user.id);
  const unsubUrl = `${appBaseUrl}?action=unsubscribe&token=${encodeURIComponent(unsubToken)}`;

  const s = digest.latestScenario;
  const deltaMonthly = fmtDelta(digest.deltas.monthlyRequired);
  const deltaHourly = fmtDelta(digest.deltas.hourlyRequired);
  const deltaScore = fmtDeltaNum(digest.deltas.healthScore);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Weekly Income Report</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
<div style="background:#18181b;border-radius:12px 12px 0 0;padding:24px;text-align:center;">
<div style="color:#fff;font-size:24px;font-weight:800;">IncomeCalc</div>
<div style="color:#a1a1aa;font-size:14px;margin-top:4px;">Weekly Financial Report</div>
</div>
<div style="background:#fff;padding:24px;border:1px solid #e4e4e7;border-top:none;">
<p style="color:#18181b;font-size:16px;margin:0 0 16px;">Hi ${digest.user.email.split("@")[0]},</p>
<p style="color:#71717a;font-size:14px;margin:0 0 20px;line-height:1.5;">Here's your weekly financial summary based on "<strong>${s.name}</strong>".</p>

<div style="background:#f4f4f5;border-radius:8px;padding:16px;margin-bottom:16px;">
<div style="font-size:13px;color:#71717a;margin-bottom:8px;">LATEST SCENARIO: ${s.name}</div>
<div style="display:flex;gap:16px;flex-wrap:wrap;">
<div style="flex:1;min-width:120px;">
<div style="color:#71717a;font-size:12px;">Monthly Required</div>
<div style="color:#18181b;font-size:20px;font-weight:800;">${fmtCurrency(s.resultsJson.grossMonthlyRequired)}</div>
<div style="color:${digest.deltas.monthlyRequired !== null ? (digest.deltas.monthlyRequired > 0 ? '#ef4444' : '#22c55e') : '#71717a'};font-size:12px;font-weight:600;">${deltaMonthly} vs previous</div>
</div>
<div style="flex:1;min-width:120px;">
<div style="color:#71717a;font-size:12px;">Hourly Rate</div>
<div style="color:#18181b;font-size:20px;font-weight:800;">${fmtCurrency(s.resultsJson.hourlyRequired)}/hr</div>
<div style="color:${digest.deltas.hourlyRequired !== null ? (digest.deltas.hourlyRequired > 0 ? '#ef4444' : '#22c55e') : '#71717a'};font-size:12px;font-weight:600;">${deltaHourly} vs previous</div>
</div>
<div style="flex:1;min-width:120px;">
<div style="color:#71717a;font-size:12px;">Health Score</div>
<div style="color:#18181b;font-size:20px;font-weight:800;">${s.resultsJson.healthScore}/100</div>
<div style="color:${digest.deltas.healthScore !== null ? (digest.deltas.healthScore > 0 ? '#22c55e' : '#ef4444') : '#71717a'};font-size:12px;font-weight:600;">${deltaScore} vs previous</div>
</div>
</div>
</div>

<div style="margin-bottom:20px;">
<div style="font-size:14px;font-weight:700;color:#18181b;margin-bottom:8px;">Next Actions</div>
${digest.recommendations.map((r) => `<div style="display:flex;gap:8px;padding:8px 0;border-bottom:1px solid #f4f4f5;">
<span style="color:#6366f1;font-weight:700;flex-shrink:0;">→</span>
<span style="color:#3f3f46;font-size:13px;line-height:1.5;">${r}</span>
</div>`).join("")}
</div>

<div style="text-align:center;padding:16px 0;">
<a href="${appBaseUrl}" style="background:#18181b;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">Open IncomeCalc</a>
</div>
</div>

<div style="background:#f4f4f5;border-radius:0 0 12px 12px;padding:16px;text-align:center;border:1px solid #e4e4e7;border-top:none;">
<p style="color:#a1a1aa;font-size:12px;margin:0;">
You're receiving this because you have weekly digests enabled.<br>
<a href="${unsubUrl}" style="color:#6366f1;text-decoration:underline;">Unsubscribe</a>
</p>
</div>
</div>
</body>
</html>`;
}

// ─── Run Weekly Digest ────────────────────────────────────────────────────────

export async function runWeeklyDigest(appBaseUrl: string): Promise<{ sent: number; errors: string[] }> {
  const eligibleUsers = getAllDigestEligibleUsers();
  let sent = 0;
  const errors: string[] = [];

  for (const user of eligibleUsers) {
    const digest = generateDigestForUser(user.id);
    if (!digest) {
      errors.push(`${user.email}: No scenarios found, skipped.`);
      continue;
    }

    const html = buildDigestEmailHtml(digest, appBaseUrl);
    const result = await sendEmail({
      to: user.email,
      subject: `Your Weekly Income Report — ${digest.latestScenario.resultsJson.healthLabel} (${digest.latestScenario.resultsJson.healthScore}/100)`,
      html,
    });

    if (result.success) {
      sent++;
    } else {
      errors.push(`${user.email}: ${result.message}`);
    }
  }

  return { sent, errors };
}
