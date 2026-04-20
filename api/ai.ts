/**
 * Vercel serverless function: POST /api/ai
 *
 * Body:  { feature: "incomeIdeas" | "budgetInsights" | "advisor", input: { ... } }
 *
 * Returns:
 *   incomeIdeas    → { ideas: IncomeIdea[] }
 *   budgetInsights → { insights: string[] }
 *   advisor        → { reply: string }
 *   errors         → { error: string }  (4xx / 5xx)
 *
 * Provider selection (both keys present):
 *   "advisor"                      → prefers OpenAI  (gpt-4.1)
 *   "incomeIdeas"/"budgetInsights" → prefers Anthropic (claude-sonnet-4-5)
 * If only one key is set it is used for every feature.
 */

// ── Inline types (no @vercel/node dependency needed) ─────────────────────────

interface Req {
  method?: string;

  headers: Record<string, string | string[] | undefined>;

  body: {
    feature: "incomeIdeas" | "budgetInsights" | "advisor" | "financialInsights" | "financialDiagnosis";
    input: Record<string, unknown>;
  };
}

interface Res {
  status(code: number): Res;
  json(data: unknown): void;
}

interface Msg {
  role: string;
  content: string;
}

// ── Rate Limiter (in-memory, per serverless instance) ────────────────────────

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 15;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Periodically clean stale entries to prevent memory leak (every 5 min)
let lastCleanup = Date.now();
function cleanupRateLimitMap(): void {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetTime) rateLimitMap.delete(key);
  }
}

function isRateLimited(ip: string): boolean {
  cleanupRateLimitMap();
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

// ── Input validation constants ───────────────────────────────────────────────

const MAX_PAYLOAD_BYTES = 15_000;
const MAX_ADVISOR_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2_000;

/** Strip control characters (keep newlines and tabs). */
function sanitizeText(s: string): string {
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function usd(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

// ── OpenAI ────────────────────────────────────────────────────────────────────

async function callOpenAI(messages: Msg[]): Promise<string> {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "gpt-4.1", messages }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`OpenAI ${resp.status}: ${txt.slice(0, 200)}`);
  }
  const data = (await resp.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Anthropic ─────────────────────────────────────────────────────────────────

async function callAnthropic(system: string, messages: Msg[], maxTokens = 500): Promise<string> {

  const ANTHROPIC_MODEL =
    (process.env.ANTHROPIC_MODEL && process.env.ANTHROPIC_MODEL.trim()) ||
    "claude-sonnet-4-6";

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: messages.filter((m) => m.role !== "system"),
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Anthropic ${resp.status}: ${txt.slice(0, 200)}`);
  }
  const data = (await resp.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  return data.content?.[0]?.text ?? "";
}

// ── Provider routing ──────────────────────────────────────────────────────────

function noKeysError(): Error {
  return new Error(
    "AI not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in your Vercel environment variables.",
  );
}

/** Single-turn convenience wrapper. */
async function callAI(
  system: string,
  userContent: string,
  preferOpenAI = false,
  maxTokens = 500,
): Promise<string> {
  const hasOAI = !!process.env.OPENAI_API_KEY;
  const hasAnt = !!process.env.ANTHROPIC_API_KEY;
  if (!hasOAI && !hasAnt) throw noKeysError();

  const msgs: Msg[] = [
    { role: "system", content: system },
    { role: "user", content: userContent },
  ];

  if (preferOpenAI && hasOAI) return callOpenAI(msgs);
  if (hasAnt) return callAnthropic(system, [{ role: "user", content: userContent }], maxTokens);
  return callOpenAI(msgs);
}

/** Multi-turn wrapper — caller supplies full messages array incl. system. */
async function callAIChat(messages: Msg[], preferOpenAI = false): Promise<string> {
  const hasOAI = !!process.env.OPENAI_API_KEY;
  const hasAnt = !!process.env.ANTHROPIC_API_KEY;
  if (!hasOAI && !hasAnt) throw noKeysError();

  const system = ` You are a strategic financial advisor analyzing a user's exact income and expense breakdown. Focus on the 3 highest-impact opportunities to increase income or reduce expenses. Use the user's numbers explicitly in your reasoning. Provide clear, practical actions with estimated yearly financial impact. Respond with concise bullet points and estimated yearly dollar impact.`.trim();
  const nonSystem = messages.filter((m) => m.role !== "system");

  if (preferOpenAI && hasOAI) return callOpenAI(messages);
  if (hasAnt) return callAnthropic(system, nonSystem);
  return callOpenAI(messages);
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req: Req, res: Res): Promise<void> {
  // ── Access check ──────────────────────────────────────────────────────────
  const forwarded = req.headers["x-forwarded-for"];
  if (!forwarded) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  // ── Rate limiting (per IP, in-memory) ─────────────────────────────────────
  const clientIp = (typeof forwarded === "string" ? forwarded : forwarded[0]).split(",")[0].trim();
  if (isRateLimited(clientIp)) {
    res.status(429).json({ error: "Too many requests. Please wait a minute before trying again." });
    return;
  }

  // ── Payload size check ────────────────────────────────────────────────────
  try {
    const bodySize = JSON.stringify(req.body).length;
    if (bodySize > MAX_PAYLOAD_BYTES) {
      res.status(413).json({ error: "Payload too large. Maximum size is 15KB." });
      return;
    }
  } catch {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { feature, input } = req.body ?? {};
  if (!feature || !input) {
    res.status(400).json({ error: "Missing feature or input" });
    return;
  }

  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({
      error:
        "AI not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in your Vercel environment variables.",
    });
    return;
  }

  try {
    // ── incomeIdeas ────────────────────────────────────────────────────────
    if (feature === "incomeIdeas") {
      const { grossAnnual, totalMonthly, gap, housing, food, transport } = input as {
        grossAnnual: number;
        totalMonthly: number;
        gap: number;
        housing: number;
        food: number;
        transport: number;
      };

      const prompt =
        `A person needs ${usd(grossAnnual)}/year gross income to cover their ${usd(totalMonthly)}/month expenses. ` +
        `Their top expenses are: housing ${usd(housing)}, food ${usd(food)}, transport ${usd(transport)}.\n\n` +
        `Suggest 4 realistic ways they could earn an extra ${usd(Math.round(gap))} per year to build financial freedom. ` +
        `Make them specific and actionable.\n\n` +
        `Respond in this exact JSON format (an array of 4 objects):\n` +
        `[{"title":"Idea Name","range":"$X-$Y/month","description":"One sentence description.","difficulty":"Easy|Medium|Hard"}]\n\n` +
        `Only output the JSON array, nothing else.`;

      const text = await callAI(
        "You are a financial coach. Respond only with valid JSON.",
        prompt,
        /* preferOpenAI= */ false,
      );

      let ideas: unknown[] = [];
      try {
        ideas = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim()) as unknown[];
      } catch {
        ideas = [];
      }
      res.json({ ideas: ideas.slice(0, 4) });
      return;
    }

    // ── budgetInsights ─────────────────────────────────────────────────────
    if (feature === "budgetInsights") {
      const d = input as {
        grossAnnual: number;
        taxRate: number;
        totalMonthly: number;
        housing: number;
        food: number;
        transport: number;
        healthcare: number;
        utilities: number;
        entertainment: number;
        clothing: number;
        savings: number;
        other: number;
      };

      const prompt =
        `A user has these monthly expenses (total: ${usd(d.totalMonthly)}, needs ${usd(d.grossAnnual)}/year gross at ${d.taxRate}% tax):\n` +
        `Housing: ${usd(d.housing)}, Food: ${usd(d.food)}, Transport: ${usd(d.transport)}, ` +
        `Healthcare: ${usd(d.healthcare)}, Utilities: ${usd(d.utilities)}, Entertainment: ${usd(d.entertainment)}, ` +
        `Clothing: ${usd(d.clothing)}, Savings: ${usd(d.savings)}, Other: ${usd(d.other)}.\n\n` +
        `Give exactly 4 short, specific, actionable budget optimization tips based on their actual numbers. ` +
        `Each tip should reference a specific dollar amount or percentage from their data. ` +
        `Format as 4 separate lines, no numbering, no bullets, just the tip text. Keep each under 100 characters.`;

      const text = await callAI(
        "You are a concise financial advisor. Respond with exactly 4 short tips, one per line.",
        prompt,
        /* preferOpenAI= */ false,
      );

      const insights = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .slice(0, 4);

      res.json({ insights });
      return;
    }

    // ── advisor (multi-turn chat) ──────────────────────────────────────────
    if (feature === "advisor") {
      const { messages: rawMessages } = input as { messages: Msg[] };

      // Validate messages array
      if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
        res.status(400).json({ error: "Advisor requires a non-empty messages array." });
        return;
      }
      if (rawMessages.length > MAX_ADVISOR_MESSAGES) {
        res.status(400).json({ error: `Too many messages. Maximum is ${MAX_ADVISOR_MESSAGES}.` });
        return;
      }

      // Sanitize and truncate each message
      const messages: Msg[] = rawMessages.map((m) => ({
        role: typeof m.role === "string" ? m.role : "user",
        content: sanitizeText(
          typeof m.content === "string" ? m.content.slice(0, MAX_MESSAGE_LENGTH) : ""
        ),
      }));

      // Advisor prefers OpenAI to preserve the original gpt-4.1 behaviour.
      const reply = await callAIChat(messages, /* preferOpenAI= */ true);
      res.json({ reply });
      return;
    }

    // ── financialInsights ─────────────────────────────────────────────────
    if (feature === "financialInsights") {
      const d = input as {
        grossAnnual: number;
        netMonthly: number;
        taxRate: number;
        totalMonthly: number;
        housing: number;
        food: number;
        transport: number;
        healthcare: number;
        utilities: number;
        entertainment: number;
        clothing: number;
        savings: number;
        investments: number;
        other: number;
        healthScore: number;
        savingsRate: number;
        hourlyRate: number;
      };

      const savingsMonthly = d.savings;
      const investmentsMonthly = d.investments;
      const disposableMonthly = d.netMonthly - d.totalMonthly;
      const housingPct = d.totalMonthly > 0 ? ((d.housing / d.totalMonthly) * 100).toFixed(1) : "0";
      const savingsPct = d.grossAnnual > 0 ? d.savingsRate.toFixed(1) : "0";

      const prompt =
        `Analyze this person's complete financial picture and provide a structured JSON response.\n\n` +
        `FINANCIAL DATA:\n` +
        `- Gross Annual Income Needed: ${usd(d.grossAnnual)}\n` +
        `- Net Monthly Take-Home: ${usd(d.netMonthly)}\n` +
        `- Tax Rate: ${d.taxRate}%\n` +
        `- Total Monthly Expenses: ${usd(d.totalMonthly)}\n` +
        `- Monthly Savings: ${usd(savingsMonthly)}\n` +
        `- Monthly Investments: ${usd(investmentsMonthly)}\n` +
        `- Monthly Disposable Income: ${usd(disposableMonthly)}\n` +
        `- Savings Rate: ${savingsPct}%\n` +
        `- Required Hourly Rate: ${usd(d.hourlyRate)}/hr\n` +
        `- Financial Health Score: ${d.healthScore}/100\n\n` +
        `EXPENSE BREAKDOWN:\n` +
        `Housing: ${usd(d.housing)} (${housingPct}% of expenses), Food: ${usd(d.food)}, ` +
        `Transport: ${usd(d.transport)}, Healthcare: ${usd(d.healthcare)}, ` +
        `Utilities: ${usd(d.utilities)}, Entertainment: ${usd(d.entertainment)}, ` +
        `Clothing: ${usd(d.clothing)}, Other: ${usd(d.other)}\n\n` +
        `Respond ONLY with this exact JSON (no markdown, no extra text):\n` +
        `{\n` +
        `  "insights": [\n` +
        `    "Specific insight about their cashflow citing exact numbers",\n` +
        `    "Specific insight about their savings/investment rate with a concrete benchmark",\n` +
        `    "Specific insight about their largest expense category and what it means"\n` +
        `  ],\n` +
        `  "riskWarning": "One specific risk based on their actual numbers (e.g. housing over 30%, no emergency fund, negative cashflow)",\n` +
        `  "optimization": "One highest-impact action with estimated dollar impact per year",\n` +
        `  "projection": "Where they will be financially in 10 years if they maintain current trajectory, with specific dollar estimates"\n` +
        `}\n\n` +
        `GUARDRAILS:\n` +
        `- If savings is $0, never describe them as stable. Their position is fragile.\n` +
        `- Never recommend reducing a $0 category.\n` +
        `- If savings exceeds 60% of expenses, acknowledge aggressive saving and focus on allocation optimization.`;

      const text = await callAI(
        "You are a quantitative financial analyst. Respond only with valid JSON matching the exact schema requested.",
        prompt,
        /* preferOpenAI= */ false,
      );

      let parsed: {
        insights?: string[];
        riskWarning?: string;
        optimization?: string;
        projection?: string;
      } = {};
      try {
        parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim()) as typeof parsed;
      } catch {
        parsed = {};
      }

      res.json({
        insights: (parsed.insights ?? []).slice(0, 3),
        riskWarning: parsed.riskWarning ?? "",
        optimization: parsed.optimization ?? "",
        projection: parsed.projection ?? "",
      });
      return;
    }

    // ── financialDiagnosis ──────────────────────────────────────────────
    if (feature === "financialDiagnosis") {
      const d = input as {
        grossAnnual: number;
        netMonthly: number;
        taxRate: number;
        totalMonthly: number;
        leftover: number;
        savingsRate: number;
        healthScore: number;
        hourlyRate: number;
        housing: number;
        food: number;
        transport: number;
        healthcare: number;
        utilities: number;
        entertainment: number;
        clothing: number;
        savings: number;
        other: number;
        top3Categories: string[];
        tone: string;
        fragilityScore?: number;
        debtRatio?: number;
        emergencyFundTarget?: number;
      };

      const tone = d.tone || "direct";
      const toneGuide =
        tone === "supportive"
          ? "Use an empathetic, encouraging tone while remaining specific and actionable."
          : tone === "disciplined"
            ? "Use a firm, coaching-oriented tone focused on execution and accountability."
            : "Use a concise, blunt, strategic tone. No fluff.";

      const prompt =
        `Analyze this person's complete financial situation and produce a structured diagnosis.\n\n` +
        `FINANCIAL DATA:\n` +
        `- Gross Annual Income Needed: ${usd(d.grossAnnual)}\n` +
        `- Net Monthly Take-Home: ${usd(d.netMonthly)}\n` +
        `- Tax Rate: ${d.taxRate}%\n` +
        `- Total Monthly Expenses: ${usd(d.totalMonthly)}\n` +
        `- Monthly Leftover/Margin: ${usd(d.leftover)}\n` +
        `- Savings Rate: ${d.savingsRate.toFixed(1)}%\n` +
        `- Financial Health Score: ${d.healthScore}/100\n` +
        `- Required Hourly Rate: ${usd(d.hourlyRate)}/hr\n` +
        (d.fragilityScore != null ? `- Fragility Score: ${d.fragilityScore}/100\n` : "") +
        (d.debtRatio != null ? `- Debt Ratio: ${(d.debtRatio * 100).toFixed(1)}%\n` : "") +
        (d.emergencyFundTarget != null ? `- Emergency Fund Target: ${usd(d.emergencyFundTarget)}\n` : "") +
        `\nEXPENSE BREAKDOWN:\n` +
        `Housing: ${usd(d.housing)}, Food: ${usd(d.food)}, Transport: ${usd(d.transport)}, ` +
        `Healthcare: ${usd(d.healthcare)}, Utilities: ${usd(d.utilities)}, Entertainment: ${usd(d.entertainment)}, ` +
        `Clothing: ${usd(d.clothing)}, Savings: ${usd(d.savings)}, Other: ${usd(d.other)}\n` +
        `\nTop 3 Categories: ${d.top3Categories.join(", ")}\n` +
        `\nTONE INSTRUCTION: ${toneGuide}\n` +
        `The "toneUsed" field in your response MUST be "${tone}".\n\n` +
        `Respond ONLY with this exact JSON structure (no markdown fences, no extra text):\n` +
        `{\n` +
        `  "mainIssue": "Primary financial bottleneck in one sentence",\n` +
        `  "summary": "2-3 sentence explanation of the structure of their finances",\n` +
        `  "riskLevel": "low" | "medium" | "high",\n` +
        `  "topMoves": [\n` +
        `    {\n` +
        `      "title": "Action title",\n` +
        `      "explanation": "Why this matters and what to do",\n` +
        `      "impact": "low" | "medium" | "high",\n` +
        `      "difficulty": "easy" | "moderate" | "hard"\n` +
        `    }\n` +
        `  ],\n` +
        `  "ifUnchanged30d": "What happens in 30 days if nothing changes",\n` +
        `  "ifOptimized30d": "What happens in 30 days if optimized",\n` +
        `  "ifUnchanged12m": "What happens in 12 months if nothing changes",\n` +
        `  "ifOptimized12m": "What happens in 12 months if optimized",\n` +
        `  "verdict": "One concise premium-quality verdict sentence",\n` +
        `  "cutFirst": ["Item 1 to cut", "Item 2 to cut", "Item 3 to cut"],\n` +
        `  "hiddenStrength": "One hidden strength or positive they may not see",\n` +
        `  "toneUsed": "${tone}"\n` +
        `}\n\n` +
        `Requirements:\n` +
        `- topMoves must have exactly 3 items\n` +
        `- All string values must be specific to their actual numbers\n` +
        `- Be practical, non-judgmental, and non-preachy\n` +
        `- cutFirst and hiddenStrength are optional but recommended\n` +
        `- Output ONLY the JSON object, nothing else\n\n` +
        `GUARDRAILS (you must follow these):\n` +
        `- If savings is $0 or savings rate is 0%, NEVER describe the person as "stable" or "in good shape". Their position is fragile.\n` +
        `- If monthly leftover/margin is $0 or negative, this is a high-risk situation — do not downplay it.\n` +
        `- NEVER recommend reducing a category that is already $0. If a category is $0, skip it entirely and focus on non-zero categories.\n` +
        `- If savings exceeds 60% of total expenses, acknowledge that the person is saving aggressively. Do not treat this as a problem — instead focus on optimizing allocation (emergency fund vs investments vs debt paydown).\n` +
        `- riskLevel must be "high" if savings rate is 0% or monthly leftover is $0 or negative.`;

      const text = await callAI(
        "You are a premium financial diagnostician. You analyze personal finances and return structured JSON diagnoses. Never output markdown fences or prose outside JSON. Your analysis must be specific, practical, and based on the exact numbers provided.",
        prompt,
        /* preferOpenAI= */ false,
        /* maxTokens= */ 1200,
      );

      let parsed: unknown;
      try {
        parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
      } catch {
        res.status(500).json({ error: "Failed to parse AI diagnosis response." });
        return;
      }

      res.json(parsed);
      return;
    }

    res.status(400).json({ error: `Unknown feature: ${String(feature)}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    res.status(500).json({ error: message });
  }
}
