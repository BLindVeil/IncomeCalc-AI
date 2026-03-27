import { useState, useEffect, useRef } from "react";
import { Brain, X, Send } from "lucide-react";
import { fmt } from "@/lib/app-shared";
import type { ThemeConfig } from "@/lib/app-shared";
import type { ExpenseData } from "@/lib/calc";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIChatProps {
  data: ExpenseData;
  taxRate: number;
  grossAnnual: number;
  grossMonthly: number;
  totalMonthly: number;
  t: ThemeConfig;
  isDark: boolean;
  onClose: () => void;
}

export function AIChat({ data, taxRate, grossAnnual, grossMonthly, totalMonthly, t, isDark, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hi! I'm your AI Financial Advisor 👋\n\nI can see your monthly expenses total **${fmt(totalMonthly)}**, meaning you need to earn **${fmt(grossAnnual)}/year** gross at a ${taxRate}% tax rate.\n\nAsk me anything — how to boost income, cut costs, invest smarter, or find realistic side hustles based on your numbers.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const systemPrompt = `You are a friendly, expert financial advisor helping a user who has submitted their monthly expense data. Here are their exact numbers:
- Total monthly expenses: ${fmt(totalMonthly)}
- Required gross annual income: ${fmt(grossAnnual)}
- Required gross monthly income: ${fmt(grossMonthly)}
- Effective tax rate: ${taxRate}%
- Housing/Rent: ${fmt(data.housing)}/mo
- Food & Groceries: ${fmt(data.food)}/mo
- Transportation: ${fmt(data.transport)}/mo
- Healthcare: ${fmt(data.healthcare)}/mo
- Utilities & Internet: ${fmt(data.utilities)}/mo
- Entertainment: ${fmt(data.entertainment)}/mo
- Clothing & Personal: ${fmt(data.clothing)}/mo
- Savings & Investments: ${fmt(data.savings)}/mo
- Other Expenses: ${fmt(data.other)}/mo

Give personalized, actionable advice based on these real numbers. Be concise, warm, and specific. Use bullet points where helpful. If they ask about side hustles or income ideas, suggest realistic options with estimated income ranges. Always reference their actual numbers when relevant.`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    // Add empty assistant message immediately for streaming
    const streamingMessages = [...newMessages, { role: "assistant" as const, content: "" }];
    setMessages(streamingMessages);
    setInput("");
    setLoading(true);

    const apiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...newMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: "advisor", input: { messages: apiMessages } }),
      });

      if (res.headers.get("content-type")?.includes("text/plain") && res.body) {
        // Streaming response
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: text }]);
        }
        setLoading(false);
      } else {
        // Non-streaming fallback
        const json = await res.json() as { reply?: string; error?: string };
        const reply = json.reply ?? json.error ?? "Sorry, I couldn't get a response. Please try again.";
        setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: reply }]);
        setLoading(false);
      }
    } catch {
      setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: "Network error — please try again." }]);
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "min(860px, 100%)",
          height: "min(700px, calc(100vh - 2rem))",
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: "20px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            background: `linear-gradient(135deg, ${t.primary}12, ${t.accent ?? t.primary}08)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${t.primary}, ${t.accent ?? t.primary})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Brain size={20} style={{ color: "#fff" }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>AI Financial Advisor</div>
              <div style={{ fontSize: "0.78rem", color: "#22c55e", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e" }} />
                Online · Powered by GPT-4.1
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: isDark ? "#ffffff18" : "#00000010",
              border: "none",
              cursor: "pointer",
              color: t.muted,
              padding: "6px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Close (Esc)"
          >
            <X size={22} />
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                gap: "0.6rem",
                alignItems: "flex-end",
              }}
            >
              {msg.role === "assistant" && (
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${t.primary}, ${t.accent ?? t.primary})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginBottom: "2px",
                  }}
                >
                  <Brain size={13} style={{ color: "#fff" }} />
                </div>
              )}
              <div
                style={{
                  maxWidth: "72%",
                  padding: "0.75rem 1rem",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user" ? t.primary : isDark ? "#2a2a2f" : "#f4f4f5",
                  color: msg.role === "user" ? "#fff" : t.text,
                  fontSize: "0.92rem",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  boxShadow: msg.role === "user" ? `0 2px 12px ${t.primary}40` : "none",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.content === "" && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", paddingLeft: "2.5rem" }}>
              <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: t.muted, animation: "pulse 1s infinite" }} />
              <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: t.muted, animation: "pulse 1s 0.2s infinite" }} />
              <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: t.muted, animation: "pulse 1s 0.4s infinite" }} />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div style={{ padding: "0 1.5rem 0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {["How can I earn more?", "Cut my biggest expense", "Best side hustles for me", "Create a savings plan", "How much should I invest?"].map((q) => (
            <button
              key={q}
              onClick={() => { setInput(q); }}
              style={{
                background: t.primary + "15",
                border: `1px solid ${t.primary}30`,
                borderRadius: "14px",
                padding: "0.35rem 0.85rem",
                fontSize: "0.82rem",
                color: t.primary,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div
          style={{
            padding: "0.85rem 1.5rem 1rem",
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            gap: "0.6rem",
            flexShrink: 0,
            alignItems: "center",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask anything about your finances..."
            autoFocus
            style={{
              flex: 1,
              background: isDark ? "#2a2a2f" : "#f4f4f5",
              border: `1px solid ${t.border}`,
              borderRadius: "12px",
              padding: "0.75rem 1rem",
              fontSize: "0.95rem",
              color: t.text,
              outline: "none",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{
              background: t.primary,
              border: "none",
              borderRadius: "12px",
              width: "46px",
              height: "46px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              opacity: input.trim() && !loading ? 1 : 0.5,
              flexShrink: 0,
              boxShadow: `0 2px 12px ${t.primary}50`,
            }}
          >
            <Send size={18} style={{ color: "#fff" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
