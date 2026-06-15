/**
 * wire-manifest — turns a deployment record into a production app manifest.
 *
 * Reads deployments/<network>.json (written by deploy.ts) and the example
 * manifest, fills in the live contract addresses + RPC URL (and optional
 * support/service URLs from env), writes config/mobile-app.manifest.production.json,
 * then reports which fields still need real values before a store submission.
 *
 * Usage:
 *   RPC_URL=https://... npx ts-node scripts/wire-manifest.ts --network sepolia
 */
import * as fs from "fs";
import * as path from "path";

export interface DeploymentRecord {
  network: string;
  chainId: number;
  contracts: {
    memberRegistry: string;
    timelock: string;
    governor: string;
    treasury: string;
    emergencyGuardian: string;
  };
}

export interface ManifestOverrides {
  rpcUrl?: string;
  blockExplorer?: string;
  support?: Record<string, string | undefined>;
  services?: Record<string, string | undefined>;
}

const PLACEHOLDER_RE = /(your_|example\.|YOUR_RPC)/i;

export function isPlaceholderValue(value: unknown): boolean {
  if (typeof value !== "string") return true;
  const v = value.trim();
  if (!v) return true;
  if (/^0x0{40}$/i.test(v)) return true;
  return PLACEHOLDER_RE.test(v);
}

/** Deep-clones the example manifest and overlays the deployment + overrides. */
export function buildProductionManifest(
  example: any,
  deployment: DeploymentRecord,
  overrides: ManifestOverrides = {}
): any {
  const manifest = JSON.parse(JSON.stringify(example));

  manifest.contracts = { ...manifest.contracts, ...deployment.contracts };
  manifest.chain = { ...manifest.chain };
  if (deployment.chainId) manifest.chain.id = deployment.chainId;
  if (deployment.network) manifest.chain.name = deployment.network;
  if (overrides.rpcUrl) manifest.chain.rpcUrl = overrides.rpcUrl;
  if (overrides.blockExplorer) manifest.chain.blockExplorer = overrides.blockExplorer;

  if (overrides.support) {
    manifest.support = { ...manifest.support };
    for (const [k, v] of Object.entries(overrides.support)) if (v) manifest.support[k] = v;
  }
  if (overrides.services) {
    manifest.services = { ...manifest.services };
    for (const [k, v] of Object.entries(overrides.services)) if (v) manifest.services[k] = v;
  }

  return manifest;
}

/** Lists the manifest paths that still hold placeholder values and block submission. */
export function findRemainingPlaceholders(manifest: any): string[] {
  const issues: string[] = [];
  if (isPlaceholderValue(manifest?.chain?.rpcUrl)) issues.push("chain.rpcUrl");
  for (const [k, v] of Object.entries(manifest?.contracts ?? {})) {
    if (isPlaceholderValue(v)) issues.push(`contracts.${k}`);
  }
  for (const k of ["website", "email", "privacyPolicyUrl", "termsOfServiceUrl"]) {
    if (isPlaceholderValue(manifest?.support?.[k])) issues.push(`support.${k}`);
  }
  for (const k of ["metadataBaseUrl", "indexerBaseUrl", "notificationBaseUrl"]) {
    if (isPlaceholderValue(manifest?.services?.[k])) issues.push(`services.${k}`);
  }
  return issues;
}

function getArg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : undefined;
}

function main(): void {
  const network = getArg("--network") ?? "sepolia";
  const repoRoot = path.join(__dirname, "..");
  const examplePath = path.join(repoRoot, "config", "mobile-app.manifest.example.json");
  const deploymentPath = path.join(repoRoot, "deployments", `${network}.json`);
  const outPath = path.join(repoRoot, "config", "mobile-app.manifest.production.json");

  if (!fs.existsSync(deploymentPath)) {
    console.error(`No deployment record at ${deploymentPath}. Run the deploy first:`);
    console.error(`  npx hardhat run scripts/deploy.ts --network ${network}`);
    process.exit(1);
  }

  const example = JSON.parse(fs.readFileSync(examplePath, "utf8"));
  const deployment: DeploymentRecord = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const overrides: ManifestOverrides = {
    rpcUrl: process.env.RPC_URL ?? process.env.SEPOLIA_RPC_URL,
    blockExplorer: process.env.BLOCK_EXPLORER_URL,
    support: {
      website: process.env.SUPPORT_WEBSITE,
      email: process.env.SUPPORT_EMAIL,
      legalName: process.env.LEGAL_NAME,
      privacyPolicyUrl: process.env.PRIVACY_POLICY_URL,
      termsOfServiceUrl: process.env.TERMS_URL,
    },
    services: {
      metadataBaseUrl: process.env.METADATA_BASE_URL,
      indexerBaseUrl: process.env.INDEXER_BASE_URL,
      notificationBaseUrl: process.env.NOTIFICATION_BASE_URL,
    },
  };

  const manifest = buildProductionManifest(example, deployment, overrides);
  fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${path.relative(repoRoot, outPath)}`);
  console.log(`  chain: ${manifest.chain.name} (${manifest.chain.id})`);
  console.log(`  governor: ${manifest.contracts.governor}`);

  const remaining = findRemainingPlaceholders(manifest);
  if (remaining.length === 0) {
    console.log("\n✅ No placeholders remain — run `npm run validate:google-play -- --manifest config/mobile-app.manifest.production.json` to confirm, then build.");
  } else {
    console.log(`\n⚠️  ${remaining.length} field(s) still need real values before store submission:`);
    for (const r of remaining) console.log(`   - ${r}`);
    console.log("\nSet them via env vars (RPC_URL, SUPPORT_WEBSITE, PRIVACY_POLICY_URL, …) and re-run, or edit the production manifest directly.");
  }
}

if (require.main === module) {
  main();
}
