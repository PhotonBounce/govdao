export interface HealthFactor {
  id: string;
  label: string;
  value: number; // 0–100 contribution
  weight: number; // relative weight
}

export interface HealthInputs {
  participationRate: number; // 0–100, avg voter turnout
  passRate: number; // 0–100, proposals that passed
  quorumDistance: number; // 0–100, avg margin above quorum
  treasuryHealthy: boolean; // not paused, within caps
  guardianArmed: boolean; // guardian configured + not paused
}

export interface HealthScore {
  score: number; // 0–100 weighted
  grade: "A" | "B" | "C" | "D";
  label: string;
  factors: HealthFactor[];
}

function clamp(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

export function gradeForScore(score: number): "A" | "B" | "C" | "D" {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  return "D";
}

export function gradeLabel(grade: "A" | "B" | "C" | "D"): string {
  switch (grade) {
    case "A":
      return "Thriving";
    case "B":
      return "Healthy";
    case "C":
      return "Needs attention";
    default:
      return "At risk";
  }
}

/** Compute a weighted 0–100 governance-health score from participation + safety signals. */
export function computeHealthScore(inputs: HealthInputs): HealthScore {
  const factors: HealthFactor[] = [
    { id: "participation", label: "Participation", value: clamp(inputs.participationRate), weight: 3 },
    { id: "passRate", label: "Decisiveness", value: clamp(inputs.passRate), weight: 2 },
    { id: "quorum", label: "Quorum margin", value: clamp(inputs.quorumDistance), weight: 2 },
    { id: "treasury", label: "Treasury", value: inputs.treasuryHealthy ? 100 : 40, weight: 2 },
    { id: "guardian", label: "Guardian", value: inputs.guardianArmed ? 100 : 30, weight: 1 },
  ];

  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weighted = factors.reduce((sum, f) => sum + f.value * f.weight, 0) / totalWeight;
  const score = clamp(weighted);
  const grade = gradeForScore(score);

  return { score, grade, label: gradeLabel(grade), factors };
}

/** Fixture inputs so the Overview shows a meaningful score in demo mode. */
export const FIXTURE_HEALTH_INPUTS: HealthInputs = {
  participationRate: 78,
  passRate: 66,
  quorumDistance: 24,
  treasuryHealthy: true,
  guardianArmed: true,
};
