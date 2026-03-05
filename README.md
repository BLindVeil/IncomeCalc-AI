# IncomeCalc AI

A financial calculator with AI-powered income ideas, budget insights, and a GPT advisor chat — deployable as a static site + serverless functions on Vercel.

---

## Enable AI on Vercel

The three AI features (**AI Income Ideas**, **AI Budget Insights**, **GPT Advisor**) are powered by a single Vercel serverless function at `/api/ai`.

Set **at least one** of the following environment variables in your Vercel project settings (**Settings → Environment Variables**):

| Variable | Provider | Notes |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI | Used for the GPT Advisor by preference; fallback for other features |
| `ANTHROPIC_API_KEY` | Anthropic | Used for Income Ideas & Budget Insights by preference; fallback for Advisor |

- If **both** keys are set: the Advisor uses OpenAI (`gpt-4.1`); Income Ideas and Budget Insights use Anthropic (`claude-sonnet-4-5`).
- If **only one** key is set: that provider handles all three features.
- If **neither** key is set: the AI buttons render an "AI not configured" error message instead of calling the API.

### Quick setup

```bash
# In Vercel dashboard → Project → Settings → Environment Variables
ANTHROPIC_API_KEY=sk-ant-...
# and/or
OPENAI_API_KEY=sk-...
```

After adding the variables, **redeploy** the project for them to take effect.

---

## Local development

```bash
npm install
npm run dev        # Vite dev server on :3000
```

To test the `/api/ai` endpoint locally, use the [Vercel CLI](https://vercel.com/docs/cli):

```bash
npx vercel dev     # serves both the Vite frontend and /api/* functions
```

Set your keys in a `.env.local` file (never commit this file):

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Build

```bash
npm run build      # outputs to dist/
```
