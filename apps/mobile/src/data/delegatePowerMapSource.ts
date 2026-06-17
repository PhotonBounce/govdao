export interface DelegateNode {
  address: string;
  label: string;
  voteWeight: number; // 0–100 normalized bubble size
  delegatedFrom: string[]; // addresses that delegated to this node
  tier: "whale" | "active" | "delegate" | "dormant";
}

export interface DelegateEdge {
  from: string;
  to: string;
  weight: number; // 0–100
}

export interface DelegatePowerMap {
  nodes: DelegateNode[];
  edges: DelegateEdge[];
  totalDelegated: number; // sum of all delegated weight
  topHolder: string; // label of highest-weight node
}

export function tierForWeight(weight: number): DelegateNode["tier"] {
  if (weight >= 70) return "whale";
  if (weight >= 40) return "active";
  if (weight >= 15) return "delegate";
  return "dormant";
}

export function tierColor(tier: DelegateNode["tier"]): string {
  switch (tier) {
    case "whale": return "#c98340";
    case "active": return "#e8c87a";
    case "delegate": return "#6a8a7a";
    default: return "#3a3a4a";
  }
}

export function buildPowerMap(nodes: DelegateNode[]): DelegatePowerMap {
  const edges: DelegateEdge[] = [];
  for (const node of nodes) {
    for (const from of node.delegatedFrom) {
      const source = nodes.find((n) => n.address === from);
      if (source) {
        edges.push({ from, to: node.address, weight: Math.round((source.voteWeight / node.voteWeight) * 50) });
      }
    }
  }
  const totalDelegated = nodes.reduce((s, n) => s + n.delegatedFrom.length, 0);
  const top = nodes.reduce((a, b) => (a.voteWeight > b.voteWeight ? a : b));
  return { nodes, edges, totalDelegated, topHolder: top.label };
}

export const FIXTURE_DELEGATE_NODES: DelegateNode[] = [
  { address: "0xA1", label: "Titan.eth", voteWeight: 88, delegatedFrom: ["0xB1", "0xC1", "0xD1"], tier: "whale" },
  { address: "0xA2", label: "Oracle.dao", voteWeight: 65, delegatedFrom: ["0xB2", "0xC2"], tier: "active" },
  { address: "0xA3", label: "Vanguard", voteWeight: 52, delegatedFrom: ["0xB3"], tier: "active" },
  { address: "0xB1", label: "Alpha.eth", voteWeight: 30, delegatedFrom: ["0xE1"], tier: "delegate" },
  { address: "0xB2", label: "Beta.dao", voteWeight: 22, delegatedFrom: [], tier: "delegate" },
  { address: "0xB3", label: "Gamma.eth", voteWeight: 18, delegatedFrom: ["0xE2"], tier: "delegate" },
  { address: "0xC1", label: "Delta.eth", voteWeight: 10, delegatedFrom: [], tier: "dormant" },
  { address: "0xC2", label: "Epsilon", voteWeight: 8, delegatedFrom: [], tier: "dormant" },
  { address: "0xD1", label: "Zeta.dao", voteWeight: 7, delegatedFrom: [], tier: "dormant" },
  { address: "0xE1", label: "Eta.eth", voteWeight: 5, delegatedFrom: [], tier: "dormant" },
  { address: "0xE2", label: "Theta", voteWeight: 4, delegatedFrom: [], tier: "dormant" },
];
