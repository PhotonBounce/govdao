import { seededRandom } from "../utils/animations";

export interface HeatCell {
  dayIndex: number; // 0 = oldest
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

export interface ActivityHeatmap {
  weeks: number;
  cells: HeatCell[]; // weeks * 7, row-major by week
  total: number;
  busiestCount: number;
  currentStreak: number; // trailing consecutive active days
}

export function intensityFor(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

/** Build a deterministic governance-activity heatmap (weeks × 7 days). */
export function buildHeatmap(weeks = 12, seed = 7): ActivityHeatmap {
  const days = weeks * 7;
  const rand = seededRandom(seed);
  const cells: HeatCell[] = [];
  let total = 0;
  let busiest = 0;

  for (let i = 0; i < days; i += 1) {
    // Weekends quieter; occasional bursts.
    const dow = i % 7;
    const base = dow === 5 || dow === 6 ? 0.25 : 0.6;
    const roll = rand();
    let count = 0;
    if (roll < base) count = 1 + Math.floor(rand() * 6 * roll);
    total += count;
    if (count > busiest) busiest = count;
    cells.push({ dayIndex: i, count, intensity: intensityFor(count) });
  }

  // Trailing streak of active days.
  let streak = 0;
  for (let i = cells.length - 1; i >= 0; i -= 1) {
    if (cells[i].count > 0) streak += 1;
    else break;
  }

  return { weeks, cells, total, busiestCount: busiest, currentStreak: streak };
}

export function weekColumns(heatmap: ActivityHeatmap): HeatCell[][] {
  const cols: HeatCell[][] = [];
  for (let w = 0; w < heatmap.weeks; w += 1) {
    cols.push(heatmap.cells.slice(w * 7, w * 7 + 7));
  }
  return cols;
}
