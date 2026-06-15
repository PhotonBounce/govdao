export interface OnboardingStep {
  id: string;
  glyph: string;
  title: string;
  body: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    glyph: "◈",
    title: "Welcome to GOVDAO",
    body: "On-chain governance in your pocket. Vote, propose, and run your DAO's treasury — transparently and verifiably.",
  },
  {
    id: "vote",
    glyph: "🗳",
    title: "Vote on-chain",
    body: "Cast binding votes with a cryptographic receipt. Read live proposals straight from the Governor contract.",
  },
  {
    id: "lifecycle",
    glyph: "⛓",
    title: "Run the full lifecycle",
    body: "Create proposals, queue the winners into the timelock, and execute them — confirmed with Face ID.",
  },
  {
    id: "treasury",
    glyph: "◇",
    title: "Treasury & safety",
    body: "Spend caps, timelocked requests, and an emergency guardian keep funds safe. Reminders keep you on schedule.",
  },
  {
    id: "start",
    glyph: "✦",
    title: "You're ready",
    body: "Explore everything in demo mode now — no wallet needed. Connect a wallet any time to go live.",
  },
];

export function isLastStep(index: number): boolean {
  return index >= ONBOARDING_STEPS.length - 1;
}

export function isFirstStep(index: number): boolean {
  return index <= 0;
}

export function nextStep(index: number): number {
  return Math.min(index + 1, ONBOARDING_STEPS.length - 1);
}

export function prevStep(index: number): number {
  return Math.max(index - 1, 0);
}

export function clampStep(index: number): number {
  if (index < 0) return 0;
  if (index > ONBOARDING_STEPS.length - 1) return ONBOARDING_STEPS.length - 1;
  return index;
}

export function stepProgress(index: number): number {
  return Math.round(((clampStep(index) + 1) / ONBOARDING_STEPS.length) * 100);
}
