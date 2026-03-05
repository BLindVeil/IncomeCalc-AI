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
  body: {
    feature: "incomeIdeas" | "budgetInsights" | "advisor";
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

async function callAnthropic(system: string, messages: Msg[]): Promise<string> {

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
      max_tokens: 500,
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
): Promise<string> {
  const hasOAI = !!process.env.OPENAI_API_KEY;
  const hasAnt = !!process.env.ANTHROPIC_API_KEY;
  if (!hasOAI && !hasAnt) throw noKeysError();

  const msgs: Msg[] = [
    { role: "system", content: system },
    { role: "user", content: userContent },
  ];

  if (preferOpenAI && hasOAI) return callOpenAI(msgs);
  if (hasAnt) return callAnthropic(system, [{ role: "user", content: userContent }]);
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
  if (!req.headers["x-forwarded-for"]) {
    res.status(403).json({ error: "Access denied" });
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
      const { messages } = input as { messages: Msg[] };
      // Advisor prefers OpenAI to preserve the original gpt-4.1 behaviour.
      const reply = await callAIChat(messages, /* preferOpenAI= */ true);
      res.json({ reply });
      return;
    }

    res.status(400).json({ error: `Unknown feature: ${String(feature)}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    res.status(500).json({ error: message });
  }
}
