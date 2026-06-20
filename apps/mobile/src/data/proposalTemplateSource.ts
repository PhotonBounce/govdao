export interface ProposalTemplate {
  id: string;
  glyph: string;
  name: string;
  category: string;
  title: string;
  summary: string;
}

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  {
    id: "treasury-spend",
    glyph: "◇",
    name: "Treasury Spend",
    category: "Treasury",
    title: "Authorize treasury spend for ",
    summary: "Proposes a treasury transfer of [AMOUNT] ETH to [RECIPIENT] for [PURPOSE]. Subject to the per-transfer cap and the timelock delay before execution.",
  },
  {
    id: "param-change",
    glyph: "⚙",
    name: "Parameter Change",
    category: "Governance",
    title: "Update governance parameter: ",
    summary: "Proposes changing [PARAMETER] from [CURRENT] to [NEW]. Affects future proposals once executed through the timelock. Include rationale and risk assessment.",
  },
  {
    id: "member-onboard",
    glyph: "✚",
    name: "Member Onboarding",
    category: "Membership",
    title: "Onboard new member: ",
    summary: "Proposes adding [ADDRESS] to the MemberRegistry with the [ROLE] role. Include the member's background and why they should join the DAO.",
  },
  {
    id: "guardian-action",
    glyph: "🛡",
    name: "Guardian Policy",
    category: "Safety",
    title: "Guardian policy update: ",
    summary: "Proposes a change to the emergency guardian configuration — signer set, threshold, or drill cadence. Security-critical; describe the threat model addressed.",
  },
  {
    id: "text-signal",
    glyph: "✎",
    name: "Text Signal",
    category: "Signal",
    title: "Signal: ",
    summary: "A non-binding signalling proposal to gauge member sentiment on [TOPIC]. No on-chain action executes — it records the membership's position for the record.",
  },
];

export interface TemplatePrefill {
  title: string;
  summary: string;
  docUri: string;
  docHash: string;
}

/** Produce a create-proposal prefill from a template (user edits the bracketed fields). */
export function applyTemplate(template: ProposalTemplate): TemplatePrefill {
  return {
    title: template.title,
    summary: template.summary,
    docUri: "",
    docHash: "",
  };
}

export function templatesByCategory(): Record<string, ProposalTemplate[]> {
  const out: Record<string, ProposalTemplate[]> = {};
  for (const t of PROPOSAL_TEMPLATES) {
    (out[t.category] = out[t.category] ?? []).push(t);
  }
  return out;
}

export function findTemplate(id: string): ProposalTemplate | null {
  return PROPOSAL_TEMPLATES.find((t) => t.id === id) ?? null;
}
