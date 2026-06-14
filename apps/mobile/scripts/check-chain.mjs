import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
require("ts-node").register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: {
    module: "commonjs",
    moduleResolution: "node",
    target: "es2020",
    jsx: "react-jsx",
    resolveJsonModule: true,
    esModuleInterop: true
  }
});

const rootPath = path.resolve(process.cwd(), "src", "data");
const manifest = require(path.join(rootPath, "app.manifest.json"));
const { isChainConfigured, loadOnchainSnapshot } = require(path.join(rootPath, "chainSource.ts"));

// Env overrides let CI or a local hardhat run point the check at a real deployment
// without editing the checked-in manifest.
if (process.env.CHAIN_RPC_URL) {
  manifest.chain.rpcUrl = process.env.CHAIN_RPC_URL;
}
if (process.env.TREASURY_ADDRESS) {
  manifest.contracts.treasury = process.env.TREASURY_ADDRESS;
}
if (process.env.MEMBER_REGISTRY_ADDRESS) {
  manifest.contracts.memberRegistry = process.env.MEMBER_REGISTRY_ADDRESS;
}
if (process.env.EMERGENCY_GUARDIAN_ADDRESS) {
  manifest.contracts.emergencyGuardian = process.env.EMERGENCY_GUARDIAN_ADDRESS;
}

const configured = isChainConfigured(manifest);
const snapshot = await loadOnchainSnapshot(manifest);

console.log(JSON.stringify({ configured, snapshot }, null, 2));

if (!configured) {
  if (snapshot.available) {
    console.error("Chain check failed: snapshot reported available despite placeholder configuration.");
    process.exitCode = 1;
  } else {
    console.log("Chain configuration is still placeholder-backed; the snapshot degraded gracefully as expected.");
  }
} else if (!snapshot.available) {
  console.error("Chain check failed: configuration looks live but the snapshot was unavailable.");
  process.exitCode = 1;
} else if (snapshot.treasuryBalance === null || snapshot.memberCount === null || snapshot.guardianPaused === null) {
  console.error("Chain check failed: one or more contract reads returned no data.");
  process.exitCode = 1;
}
