/**
 * QA gate: validates wire-manifest's pure merge + placeholder-detection logic.
 * No network or compiler needed — uses the example manifest and a synthetic
 * deployment record.
 */
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
require("ts-node").register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", resolveJsonModule: true, esModuleInterop: true, ignoreDeprecations: "6.0" },
});

const root = process.cwd();
const example = require(path.join(root, "config", "mobile-app.manifest.example.json"));
const { buildProductionManifest, findRemainingPlaceholders, isPlaceholderValue } = require(path.join(root, "scripts", "wire-manifest.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

const ADDR = (n) => "0x" + String(n).repeat(40).slice(0, 40);
const deployment = {
  network: "sepolia",
  chainId: 11155111,
  contracts: {
    memberRegistry: ADDR(1),
    timelock: ADDR(2),
    governor: ADDR(3),
    treasury: ADDR(4),
    emergencyGuardian: ADDR(5),
  },
};

console.log("\nwire-manifest: isPlaceholderValue");
assert("zero address is placeholder", isPlaceholderValue("0x0000000000000000000000000000000000000000"));
assert("YOUR_RPC is placeholder", isPlaceholderValue("https://YOUR_RPC_ENDPOINT"));
assert("example.com is placeholder", isPlaceholderValue("https://api.example.com"));
assert("empty is placeholder", isPlaceholderValue(""));
assert("real address is not placeholder", !isPlaceholderValue(ADDR(7)));
assert("real https is not placeholder", !isPlaceholderValue("https://rpc.sepolia.org"));

console.log("\nwire-manifest: buildProductionManifest");
const prod = buildProductionManifest(example, deployment, {
  rpcUrl: "https://sepolia.example-rpc.io/v2/key",
  support: { website: "https://photon-bounce.com", privacyPolicyUrl: "https://photon-bounce.com/privacy-policy.html" },
});
assert("contracts overwritten from deployment", prod.contracts.governor === ADDR(3));
assert("all 5 contracts wired", ["memberRegistry","timelock","governor","treasury","emergencyGuardian"].every((k) => prod.contracts[k] === deployment.contracts[k]));
assert("chainId applied", prod.chain.id === 11155111);
assert("network name applied", prod.chain.name === "sepolia");
assert("rpcUrl override applied", prod.chain.rpcUrl === "https://sepolia.example-rpc.io/v2/key");
assert("support override applied", prod.support.website === "https://photon-bounce.com");
assert("example manifest not mutated", example.contracts.governor === "0x0000000000000000000000000000000000000000");

console.log("\nwire-manifest: findRemainingPlaceholders");
const remainingExample = findRemainingPlaceholders(example);
assert("example flags rpc + 5 contracts + support", remainingExample.includes("chain.rpcUrl") && remainingExample.includes("contracts.governor"), remainingExample.join(","));
const remainingProd = findRemainingPlaceholders(prod);
assert("wired manifest clears contracts + rpc", !remainingProd.includes("chain.rpcUrl") && !remainingProd.some((r) => r.startsWith("contracts.")), remainingProd.join(","));
assert("wired manifest still flags unset service URLs", remainingProd.includes("services.metadataBaseUrl"), remainingProd.join(","));

console.log("\nwire-manifest: fully-wired manifest has zero placeholders");
const full = buildProductionManifest(example, deployment, {
  rpcUrl: "https://sepolia.example-rpc.io/v2/key",
  support: {
    website: "https://photon-bounce.com",
    email: "contact@photon-bounce.com",
    privacyPolicyUrl: "https://photon-bounce.com/privacy-policy.html",
    termsOfServiceUrl: "https://photon-bounce.com/terms.html",
  },
  services: {
    metadataBaseUrl: "https://api.photon-bounce.com/metadata",
    indexerBaseUrl: "https://api.photon-bounce.com/index",
    notificationBaseUrl: "https://api.photon-bounce.com/notify",
  },
});
const none = findRemainingPlaceholders(full);
assert("zero remaining placeholders when fully set", none.length === 0, none.join(","));

console.log(`\ncheck-wire-manifest: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
