import { ActiveView } from "../shellTypes";

const KNOWN_VIEWS: ActiveView[] = [
  "overview",
  "proposals",
  "create-proposal",
  "treasury",
  "request-spend",
  "schedule-drill",
  "invite-member",
  "modules",
  "activity",
  "analytics",
  "calendar",
  "search",
  "settings",
  "upgrade",
  "deploy-wizard",
];

export interface DeepLinkTarget {
  view: ActiveView;
  proposalId?: string;
}

/**
 * Parse a deep link / universal link into a navigation target.
 * Handles e.g. `govdao://treasury`, `govdao://view/calendar`,
 * `govdao://proposal/GOV-12`, and `https://photon-bounce.com/app/analytics`.
 * Returns null when nothing maps.
 */
export function parseDeepLink(url: string): DeepLinkTarget | null {
  if (!url || typeof url !== "string") return null;

  // Strip the scheme (govdao://, https://, exp://…) to get the path/host part.
  let rest = url;
  const schemeMatch = url.match(/^[a-z][a-z0-9+.-]*:\/\/(.*)$/i);
  if (schemeMatch) rest = schemeMatch[1];

  const segments = rest.split(/[/?#]/).filter(Boolean).map((s) => decodeURIComponent(s));

  // proposal/<id> → open the proposals view focused on that proposal.
  const pIdx = segments.indexOf("proposal");
  if (pIdx !== -1 && segments[pIdx + 1]) {
    return { view: "proposals", proposalId: segments[pIdx + 1] };
  }

  // First segment that names a known view (covers `view/<x>`, `app/<x>`, or bare `<x>`).
  for (const seg of segments) {
    if ((KNOWN_VIEWS as string[]).includes(seg)) {
      return { view: seg as ActiveView };
    }
  }

  return null;
}

export function isKnownView(value: string): value is ActiveView {
  return (KNOWN_VIEWS as string[]).includes(value);
}
