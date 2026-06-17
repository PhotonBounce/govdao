export type ReactionType = "fire" | "thumbsUp" | "eyes" | "thinking" | "warning";

export interface SentimentReaction {
  type: ReactionType;
  emoji: string;
  label: string;
  count: number;
}

export interface ProposalSentiment {
  proposalId: string;
  reactions: SentimentReaction[];
  totalReactions: number;
  dominantReaction: ReactionType;
  sentimentScore: number; // -100 to +100 (positive = bullish)
}

const REACTION_META: Record<ReactionType, { emoji: string; label: string; weight: number }> = {
  fire: { emoji: "🔥", label: "Let's go", weight: 1 },
  thumbsUp: { emoji: "👍", label: "Supports", weight: 0.8 },
  eyes: { emoji: "👀", label: "Watching", weight: 0 },
  thinking: { emoji: "🤔", label: "Unsure", weight: -0.4 },
  warning: { emoji: "⚠️", label: "Concern", weight: -1 },
};

export function buildSentimentReactions(counts: Partial<Record<ReactionType, number>>): SentimentReaction[] {
  return (Object.keys(REACTION_META) as ReactionType[]).map((type) => ({
    type,
    emoji: REACTION_META[type].emoji,
    label: REACTION_META[type].label,
    count: counts[type] ?? 0,
  }));
}

export function computeSentiment(reactions: SentimentReaction[]): { score: number; dominant: ReactionType } {
  const total = reactions.reduce((s, r) => s + r.count, 0);
  if (total === 0) return { score: 0, dominant: "eyes" };

  const weighted = reactions.reduce((s, r) => s + r.count * REACTION_META[r.type].weight, 0);
  const score = Math.round((weighted / total) * 100);
  const dominant = reactions.reduce((a, b) => (a.count >= b.count ? a : b)).type;
  return { score: Math.max(-100, Math.min(100, score)), dominant };
}

export function buildProposalSentiment(
  proposalId: string,
  counts: Partial<Record<ReactionType, number>>
): ProposalSentiment {
  const reactions = buildSentimentReactions(counts);
  const totalReactions = reactions.reduce((s, r) => s + r.count, 0);
  const { score, dominant } = computeSentiment(reactions);
  return {
    proposalId,
    reactions,
    totalReactions,
    dominantReaction: dominant,
    sentimentScore: score,
  };
}

export function sentimentLabel(score: number): string {
  if (score >= 60) return "Strong support";
  if (score >= 20) return "Leaning yes";
  if (score >= -20) return "Mixed signals";
  if (score >= -60) return "Skeptical";
  return "Community concerned";
}

export function sentimentColor(score: number): string {
  if (score >= 20) return "#6a9a7a";
  if (score >= -20) return "#c9a040";
  return "#c06464";
}

export const FIXTURE_SENTIMENTS: ProposalSentiment[] = [
  buildProposalSentiment("prop-1", { fire: 42, thumbsUp: 31, eyes: 18, thinking: 8, warning: 4 }),
  buildProposalSentiment("prop-2", { fire: 5, thumbsUp: 12, eyes: 22, thinking: 30, warning: 25 }),
  buildProposalSentiment("prop-3", { fire: 18, thumbsUp: 44, eyes: 10, thinking: 6, warning: 3 }),
];
