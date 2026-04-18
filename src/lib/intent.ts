const INTENT_KEY = "ascentra-intent";

export type UserIntent = "afford" | "stress_test" | "life_change" | "curious";

export interface IntentOption {
  id: UserIntent;
  title: string;
  description: string;
}

export const INTENT_OPTIONS: IntentOption[] = [
  {
    id: "afford",
    title: "Figure out if I can afford something",
    description: "A move, a car, a wedding, school, a kid — see if your number supports it.",
  },
  {
    id: "stress_test",
    title: "Stress-test my current life",
    description: "Am I actually okay? What's my buffer? How close to the edge am I living?",
  },
  {
    id: "life_change",
    title: "Plan a life change I know is coming",
    description: "New job, moving cities, going freelance — model the impact before you commit.",
  },
  {
    id: "curious",
    title: "Just curious about my number",
    description: "No specific goal. Exploring where I stand.",
  },
];

export function writeIntent(intent: UserIntent): void {
  try {
    sessionStorage.setItem(INTENT_KEY, intent);
  } catch {
    // silent — sessionStorage can fail in private mode
  }
}

export function readIntent(): UserIntent | null {
  try {
    const raw = sessionStorage.getItem(INTENT_KEY);
    if (!raw) return null;
    if (raw === "afford" || raw === "stress_test" || raw === "life_change" || raw === "curious") {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearIntent(): void {
  try {
    sessionStorage.removeItem(INTENT_KEY);
  } catch {
    // ignore
  }
}

export function getIntentSnapshotCopy(intent: UserIntent | null): string | null {
  if (!intent) return null;
  const map: Record<UserIntent, string> = {
    afford: "Since you're weighing whether you can afford something specific, here's the number that makes it real.",
    stress_test: "You wanted to see how close to the edge you're actually living. Here's the picture.",
    life_change: "You're planning a change. Here's what your numbers say about it.",
    curious: "Here's what your numbers actually say.",
  };
  return map[intent];
}
