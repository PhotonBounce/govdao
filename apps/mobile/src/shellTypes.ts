export type ActiveView = "overview" | "proposals" | "create-proposal" | "treasury" | "request-spend" | "schedule-drill" | "invite-member" | "modules" | "activity" | "analytics" | "calendar" | "settings" | "upgrade" | "deploy-wizard";

export type DetailKind = "proposal" | "motion" | "module" | "workspace" | "treasury" | "guardian" | "member";

export type DetailState = {
  refId: string;
  kind: DetailKind;
  eyebrow: string;
  title: string;
  summary: string;
  owner: string;
  nextStep: string;
  tone?: "paper" | "graphite";
  meta: string[];
};