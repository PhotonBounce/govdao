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
    body: "On-chain governance for your organisation. Vote, propose, and control your DAO treasury — secured by smart contracts on Polygon.",
  },
  {
    id: "what-is-dao",
    glyph: "🏛",
    title: "What is a DAO?",
    body: "A DAO replaces traditional management with community votes. Instead of one person deciding, members propose changes and the majority rules — automatically enforced by code, not trust.",
  },
  {
    id: "members",
    glyph: "👥",
    title: "Members & Roles",
    body: "Your DAO has four roles:\n\n• Admin — manages the DAO setup\n• Proposer — creates proposals\n• Member — votes on proposals\n• Executor — runs approved actions\n\nRoles live on-chain in the Member Registry.",
  },
  {
    id: "propose",
    glyph: "📋",
    title: "Create a Proposal",
    body: "A proposal is a motion members vote on. Common templates:\n\n• Invite a new member\n• Set a spending limit\n• Transfer treasury funds\n• Transfer DAO ownership\n\nTap '+' on the Proposals screen to start.",
  },
  {
    id: "vote",
    glyph: "🗳",
    title: "Vote on-chain",
    body: "When a proposal is Active, members vote For, Against, or Abstain. Voting lasts 7 days. If quorum is reached and For wins — it passes to the Timelock.",
  },
  {
    id: "lifecycle",
    glyph: "⛓",
    title: "Queue → Execute",
    body: "Passed proposals wait 2 days in the Timelock (a safety delay). After that, anyone can tap Execute and the actions run automatically on-chain.",
  },
  {
    id: "treasury",
    glyph: "◇",
    title: "Treasury",
    body: "Your DAO's funds sit in a smart contract. Only approved proposals can move money out. There's a spending cap per transaction and per month — extra protection against mistakes.",
  },
  {
    id: "start",
    glyph: "✦",
    title: "You're live on Polygon",
    body: "Your contracts are deployed. Connect MetaMask to start proposing and voting. Tap ⓘ on any screen for a plain-English explanation of what it does.",
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
