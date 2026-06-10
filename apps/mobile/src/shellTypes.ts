export type ActiveView = "overview" | "proposals" | "treasury" | "modules" | "settings";

export type DetailKind = "proposal" | "motion" | "module" | "workspace" | "treasury" | "guardian";

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