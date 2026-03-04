     /**
      * Vercel serverless function: POST /api/ai
      *
      * Accepts: { feature: "incomeIdeas" | "budgetInsights" | "advisor", input: { ... } }
      * Returns structured JSON per feature (see types below).
      *
      * Provider selection:
      *   - "advisor" (chat): prefers OPENAI_API_KEY, falls back to ANTHROPIC_API_KEY
      *   - "incomeIdeas" / "budgetInsights": prefers ANTHROPIC_API_KEY, falls back to OPENAI_API_KEY
      *   - If only one key is set, it is used for all features.
      */

     // ─── Minimal inline types (avoids @vercel/node dependency) ───────────────────

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

     // ─── Shared message type ──────────────────────────────────────────────────────

     interface Msg {
       role: string;
       content: string;
     }

     // ─── Currency formatter (server-side) ────────────────────────────────────────

     function usd(n: number): string {
       return "$" + Math.round(n).toLocaleString("en-US");
     }

     // ─── OpenAI ──────────────────────────────────────────────────────────────────

     async function callOpenAI(messages: Msg[]): Promise<string> {
       const res = await fetch("https://api.openai.com/v1/chat/completions", {
         method: "POST",
         headers: {
           Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({ model: "gpt-4.1", messages }),
       });
       if (!res.ok) {
         const text = await res.text();
         throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 200)}`);
       }
       const data = (await res.json()) as {
         choices: Array<{ message: { content: string } }>;
       };
       return data.choices?.[0]?.message?.content ?? "";
     }

     // ─── Anthropic ───────────────────────────────────────────────────────────────

     async function callAnthropic(system: string, messages: Msg[]): Promise<string> {
       const res = await fetch("https://api.anthropic.com/v1/messages", {
         method: "POST",
         headers: {
           "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
           "anthropic-version": "2023-06-01",
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           model: "claude-sonnet-4-5-20251001",
           max_tokens: 1024,
           system,
           messages: messages.filter((m) => m.role !== "system"),
         }),
       });
       if (!res.ok) {
         const text = await res.text();
         throw new Error(`Anthropic error ${res.status}: ${text.slice(0, 200)}`);
       }
       const data = (await res.json()) as {
         content: Array<{ type: string; text: string }>;
       };
       return data.content?.[0]?.text ?? "";
     }

     // ─── Routing helpers ──────────────────────────────────────────────────────────

     /**
      * Single-turn: build messages from system + user content, pick provider.
      * preferOpenAI=true → use OpenAI when both keys are present.
      */
     async function callAI(
       system: string,
       userContent: string,
       preferOpenAI = false,
     ): Promise<string> {
       const hasOpenAI = !!process.env.OPENAI_API_KEY;
       const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

       if (preferOpenAI && hasOpenAI) {
         return callOpenAI([
           { role: "system", content: system },
           { role: "user", content: userContent },
         ]);
       }
       if (hasAnthropic) {
         return callAnthropic(system, [{ role: "user", content: userContent }]);
       }
       if (hasOpenAI) {
         return callOpenAI([
           { role: "system", content: system },
           { role: "user", content: userContent },
         ]);
       }
       throw new Error(
         "AI not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in Vercel environment variables.",
       );
     }

     /**
      * Multi-turn: caller provides the full messages array (system message included).
      * preferOpenAI=true → use OpenAI when both keys are present.
      */
     async function callAIWithMessages(
       messages: Msg[],
       preferOpenAI = false,
     ): Promise<string> {
       const hasOpenAI = !!process.env.OPENAI_API_KEY;
       const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

       const system = messages.find((m) => m.role === "system")?.content ?? "";
       const nonSystem = messages.filter((m) => m.role !== "system");

       if (preferOpenAI && hasOpenAI) return callOpenAI(messages);
       if (hasAnthropic) return callAnthropic(system, nonSystem);
       if (hasOpenAI) return callOpenAI(messages);
       throw new Error(
         "AI not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in Vercel environment variables.",
       );
     }

     // ─── Handler ─────────────────────────────────────────────────────────────────

     export default async function handler(req: Req, res: Res): Promise<void> {
       if (req.method !== "POST") {
         res.status(405).json({ error: "Method not allowed" });
         return;
       }

       const { feature, input } = req.body ?? {};

       if (!feature || !input) {
         res.status(400).json({ error: "Missing feature or input" });
         return;
       }

       const hasOpenAI = !!process.env.OPENAI_API_KEY;
       const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

       if (!hasOpenAI && !hasAnthropic) {
         res.status(503).json({
           error:
             "AI not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in your Vercel environment variables.",
         });
         return;
       }

       try {
         // ── incomeIdeas ─────────────────────────────────────────────────────────
         if (feature === "incomeIdeas") {
           const { grossAnnual, totalMonthly, gap, housing, food, transport } =
             input as {
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
             ideas = JSON.parse(
               text.replace(/```json\n?|\n?```/g, "").trim(),
             ) as unknown[];
           } catch {
             ideas = [];
           }

           res.json({ ideas: ideas.slice(0, 4) });
           return;
         }

         // ── budgetInsights ──────────────────────────────────────────────────────
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

         // ── advisor (multi-turn chat) ────────────────────────────────────────────
         if (feature === "advisor") {
           const { messages } = input as { messages: Msg[] };
           // Advisor uses OpenAI by preference to match the original gpt-4.1 behaviour.
           const reply = await callAIWithMessages(messages, /* preferOpenAI= */ true);
           res.json({ reply });
           return;
         }

         res.status(400).json({ error: `Unknown feature: ${String(feature)}` });
       } catch (err) {
         const message = err instanceof Error ? err.message : "AI request failed";
         res.status(500).json({ error: message });
       }
     }
