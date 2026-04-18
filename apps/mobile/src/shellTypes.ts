export type ActiveView = "overview" | "proposals" | "modules" | "settings";

export type DetailKind = "proposal" | "motion" | "module" | "workspace";

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