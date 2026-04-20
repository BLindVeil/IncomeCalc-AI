import type { ThemeConfig } from "@/lib/app-shared";

export interface ComingSoonToastProps {
  message: string;
  show: boolean;
  t: ThemeConfig;
}

export function ComingSoonToast({ message, show, t }: ComingSoonToastProps) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginTop: 6,
        background: t.text,
        color: t.cardBg,
        fontSize: 12,
        padding: "6px 12px",
        borderRadius: 8,
        whiteSpace: "nowrap",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      {message}
    </div>
  );
}
