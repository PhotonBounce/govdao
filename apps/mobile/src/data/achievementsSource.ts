export interface MemberStats {
  votesCast: number;
  proposalsCreated: number;
  quorumsReached: number;
  drillsRun: number;
  treasuryActions: number;
  daysActive: number;
}

export interface Achievement {
  id: string;
  glyph: string;
  title: string;
  description: string;
  threshold: number;
  metric: keyof MemberStats;
  earned: boolean;
  progress: number; // 0–100 toward threshold
}

interface AchievementDef {
  id: string;
  glyph: string;
  title: string;
  description: string;
  metric: keyof MemberStats;
  threshold: number;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: "first-vote", glyph: "🗳", title: "First Ballot", description: "Cast your first on-chain vote", metric: "votesCast", threshold: 1 },
  { id: "ten-votes", glyph: "⚡", title: "Active Voter", description: "Cast 10 votes", metric: "votesCast", threshold: 10 },
  { id: "first-proposal", glyph: "✍", title: "Proposer", description: "Create your first proposal", metric: "proposalsCreated", threshold: 1 },
  { id: "quorum-hero", glyph: "◈", title: "Quorum Hero", description: "Help reach quorum 5 times", metric: "quorumsReached", threshold: 5 },
  { id: "guardian", glyph: "🛡", title: "Guardian", description: "Run an emergency drill", metric: "drillsRun", threshold: 1 },
  { id: "treasurer", glyph: "◇", title: "Treasurer", description: "Queue 3 treasury actions", metric: "treasuryActions", threshold: 3 },
  { id: "veteran", glyph: "★", title: "Veteran", description: "Active for 30 days", metric: "daysActive", threshold: 30 },
];

export function evaluateAchievements(stats: MemberStats): Achievement[] {
  return ACHIEVEMENT_DEFS.map((def) => {
    const current = stats[def.metric] ?? 0;
    const progress = Math.min(100, Math.round((current / def.threshold) * 100));
    return {
      id: def.id,
      glyph: def.glyph,
      title: def.title,
      description: def.description,
      threshold: def.threshold,
      metric: def.metric,
      earned: current >= def.threshold,
      progress,
    };
  });
}

export function countEarned(achievements: Achievement[]): number {
  return achievements.filter((a) => a.earned).length;
}

export function reputationTier(earnedCount: number): string {
  if (earnedCount >= 6) return "Legendary";
  if (earnedCount >= 4) return "Distinguished";
  if (earnedCount >= 2) return "Contributor";
  if (earnedCount >= 1) return "Newcomer";
  return "Observer";
}

/** Fixture member stats so the badges screen is populated in demo mode. */
export const FIXTURE_MEMBER_STATS: MemberStats = {
  votesCast: 12,
  proposalsCreated: 2,
  quorumsReached: 6,
  drillsRun: 1,
  treasuryActions: 2,
  daysActive: 21,
};
