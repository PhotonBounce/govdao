export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskFactor {
  id: string;
  label: string;
  score: number; // 0–100 (100 = highest risk)
  detail: string;
}

export interface ProposalRiskInputs {
  treasuryImpactPct: number; // 0–100: % of treasury being spent
  daysUntilDeadline: number; // urgency
  currentParticipationPct: number; // 0–100 current voter turnout
  quorumRequiredPct: number; // 0–100 required quorum
  proposerReputation: number; // 0–100 (100 = highly trusted)
  isUpgradeProposal: boolean; // contract upgrades are inherently riskier
}

export interface ProposalRisk {
  score: number; // 0–100 aggregate risk
  level: RiskLevel;
  label: string;
  factors: RiskFactor[];
  recommendation: string;
}

export function riskLevelForScore(score: number): RiskLevel {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
}

export function riskLabel(level: RiskLevel): string {
  switch (level) {
    case "LOW": return "Safe to proceed";
    case "MEDIUM": return "Review carefully";
    case "HIGH": return "Proceed with caution";
    case "CRITICAL": return "High-risk — guardian review";
  }
}

export function riskColor(level: RiskLevel): string {
  switch (level) {
    case "LOW": return "#6a9a7a";
    case "MEDIUM": return "#c9a040";
    case "HIGH": return "#c07040";
    case "CRITICAL": return "#c06464";
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function computeProposalRisk(inputs: ProposalRiskInputs): ProposalRisk {
  const urgencyScore = clamp(inputs.daysUntilDeadline <= 1 ? 90 : inputs.daysUntilDeadline <= 3 ? 65 : inputs.daysUntilDeadline <= 7 ? 35 : 10);
  const quorumGapScore = clamp(Math.max(0, inputs.quorumRequiredPct - inputs.currentParticipationPct) * 2);
  const reputationScore = clamp(100 - inputs.proposerReputation);
  const upgradeScore = inputs.isUpgradeProposal ? 80 : 0;

  const factors: RiskFactor[] = [
    {
      id: "treasury",
      label: "Treasury impact",
      score: clamp(inputs.treasuryImpactPct * 1.2),
      detail: `${inputs.treasuryImpactPct}% of DAO treasury`,
    },
    {
      id: "urgency",
      label: "Deadline urgency",
      score: urgencyScore,
      detail: inputs.daysUntilDeadline <= 1 ? "< 24 h remaining" : `${inputs.daysUntilDeadline}d remaining`,
    },
    {
      id: "quorum",
      label: "Quorum shortfall",
      score: quorumGapScore,
      detail: `${inputs.currentParticipationPct}% of ${inputs.quorumRequiredPct}% required`,
    },
    {
      id: "reputation",
      label: "Proposer trust",
      score: reputationScore,
      detail: inputs.proposerReputation >= 80 ? "Established proposer" : "Low reputation",
    },
    {
      id: "upgrade",
      label: "Upgrade risk",
      score: upgradeScore,
      detail: inputs.isUpgradeProposal ? "Contract upgrade — irreversible" : "Standard proposal",
    },
  ];

  const weights = [3, 2, 2, 1, 3];
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const aggregate = factors.reduce((s, f, i) => s + f.score * weights[i], 0) / totalWeight;
  const score = clamp(aggregate);
  const level = riskLevelForScore(score);

  const recommendation =
    level === "CRITICAL" ? "Request guardian review before voting opens."
    : level === "HIGH" ? "Extend voting window and verify proposer intent."
    : level === "MEDIUM" ? "Confirm quorum trajectory before deadline."
    : "No blockers detected — proceed normally.";

  return { score, level, label: riskLabel(level), factors, recommendation };
}

export const FIXTURE_RISK_INPUTS: ProposalRiskInputs = {
  treasuryImpactPct: 22,
  daysUntilDeadline: 3,
  currentParticipationPct: 38,
  quorumRequiredPct: 50,
  proposerReputation: 72,
  isUpgradeProposal: false,
};
