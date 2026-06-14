// Quick-jump command palette — pure search index over the app's destinations.
// No React/RN imports so the ranking logic is unit-testable.
import { ActiveView } from "../shellTypes";

export interface SearchDestination {
  view: ActiveView;
  label: string;
  description: string;
  keywords: string[];
  premium?: boolean;
}

export const SEARCH_DESTINATIONS: SearchDestination[] = [
  { view: "overview", label: "Overview", description: "Governance summary and launchpad", keywords: ["home", "dashboard", "summary", "start"] },
  { view: "proposals", label: "Proposals", description: "Browse and vote on proposals", keywords: ["vote", "ballot", "governance", "list"] },
  { view: "create-proposal", label: "New Proposal", description: "Draft and submit a proposal", keywords: ["propose", "create", "draft", "submit"] },
  { view: "treasury", label: "Treasury", description: "Balance, caps and movements", keywords: ["funds", "money", "balance", "spend", "vault"] },
  { view: "request-spend", label: "Spend Request", description: "Queue a treasury transfer", keywords: ["spend", "transfer", "withdraw", "payment"] },
  { view: "schedule-drill", label: "Guardian Drill", description: "Rehearse the emergency pause", keywords: ["guardian", "drill", "pause", "emergency", "safety"], premium: true },
  { view: "invite-member", label: "Invite Member", description: "Add a delegate to the registry", keywords: ["member", "invite", "add", "delegate", "registry"], premium: true },
  { view: "modules", label: "Modules", description: "Workspace add-ons", keywords: ["workspace", "addons", "extensions", "apps"] },
  { view: "activity", label: "Activity", description: "Chronological event feed", keywords: ["feed", "history", "events", "log", "export"] },
  { view: "calendar", label: "Calendar", description: "Upcoming governance events", keywords: ["schedule", "deadline", "agenda", "upcoming", "countdown"] },
  { view: "analytics", label: "Analytics", description: "Participation and delegate stats", keywords: ["stats", "metrics", "participation", "charts", "data"], premium: true },
  { view: "deploy-wizard", label: "Deploy Wizard", description: "Deploy the governance contracts", keywords: ["deploy", "contracts", "wizard", "bootstrap", "setup"], premium: true },
  { view: "settings", label: "Settings", description: "Preferences, notifications, legal", keywords: ["preferences", "config", "sound", "motion", "legal", "privacy"] },
  { view: "upgrade", label: "Go Premium", description: "Unlock premium features", keywords: ["premium", "upgrade", "subscribe", "plan", "pro"] },
];

export interface SearchResult extends SearchDestination {
  score: number;
}

/**
 * Rank destinations against a query. Higher score = better match.
 *  4 = label starts with query
 *  3 = a word in the label starts with query
 *  2 = label contains query
 *  1 = a keyword/description matches
 * Empty query returns all destinations in their natural order.
 */
export function searchDestinations(query: string, destinations: SearchDestination[] = SEARCH_DESTINATIONS): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return destinations.map((d) => ({ ...d, score: 0 }));

  const results: SearchResult[] = [];
  for (const d of destinations) {
    const label = d.label.toLowerCase();
    let score = 0;
    if (label.startsWith(q)) score = 4;
    else if (label.split(/\s+/).some((w) => w.startsWith(q))) score = 3;
    else if (label.includes(q)) score = 2;
    else if (d.keywords.some((k) => k.includes(q)) || d.description.toLowerCase().includes(q)) score = 1;
    if (score > 0) results.push({ ...d, score });
  }
  // Stable sort: score desc, then original index asc.
  return results.sort((a, b) => b.score - a.score || destinations.indexOf(a) - destinations.indexOf(b));
}

export function topDestination(query: string): SearchResult | null {
  const results = searchDestinations(query);
  return results.length > 0 ? results[0] : null;
}
