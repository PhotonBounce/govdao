/**
 * QA gate: validates ABI encoding, fixture vs live path detection, and provider construction.
 */

import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

require("ts-node").register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: {
    module: "commonjs",
    moduleResolution: "node",
    target: "es2020",
    esModuleInterop: true
  }
});

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
    failed++;
  }
}

const mAbis = require("../src/data/contractAbis.ts");
const abis = {
  keys: Object.keys(mAbis),
  governorLen: mAbis.GOVERNOR_ABI.length,
  treasuryLen: mAbis.TREASURY_ABI.length,
  memberLen: mAbis.MEMBER_REGISTRY_ABI.length,
  guardianLen: mAbis.EMERGENCY_GUARDIAN_ABI.length,
  timelockLen: mAbis.TIMELOCK_ABI.length,
  voteSupport: mAbis.VOTE_SUPPORT
};

console.log("\nContractAbis: all ABI arrays exported");
assert("GOVERNOR_ABI exported", abis.keys.includes("GOVERNOR_ABI"));
assert("TREASURY_ABI exported", abis.keys.includes("TREASURY_ABI"));
assert("MEMBER_REGISTRY_ABI exported", abis.keys.includes("MEMBER_REGISTRY_ABI"));
assert("EMERGENCY_GUARDIAN_ABI exported", abis.keys.includes("EMERGENCY_GUARDIAN_ABI"));
assert("TIMELOCK_ABI exported", abis.keys.includes("TIMELOCK_ABI"));
assert("VOTE_SUPPORT exported", abis.keys.includes("VOTE_SUPPORT"));

console.log("\nContractAbis: ABIs have minimum entry count");
assert("Governor ABI ≥ 5 entries", abis.governorLen >= 5, `got ${abis.governorLen}`);
assert("Treasury ABI ≥ 4 entries", abis.treasuryLen >= 4, `got ${abis.treasuryLen}`);
assert("MemberRegistry ABI ≥ 4 entries", abis.memberLen >= 4, `got ${abis.memberLen}`);
assert("EmergencyGuardian ABI ≥ 3 entries", abis.guardianLen >= 3, `got ${abis.guardianLen}`);
assert("Timelock ABI ≥ 3 entries", abis.timelockLen >= 3, `got ${abis.timelockLen}`);

console.log("\nContractAbis: VOTE_SUPPORT values");
assert("against = 0", abis.voteSupport.against === 0);
assert("for = 1", abis.voteSupport.for === 1);
assert("abstain = 2", abis.voteSupport.abstain === 2);

const mProvider = require("../src/data/walletProvider.ts");
const provider = { keys: Object.keys(mProvider) };

console.log("\nWalletProvider: all functions exported");
assert("isFixtureMode exported", provider.keys.includes("isFixtureMode"));
assert("setActiveSigner exported", provider.keys.includes("setActiveSigner"));
assert("getActiveSigner exported", provider.keys.includes("getActiveSigner"));
assert("getProvider exported", provider.keys.includes("getProvider"));
assert("clearSession exported", provider.keys.includes("clearSession"));
assert("buildContract exported", provider.keys.includes("buildContract"));

console.log("\nWalletProvider: isFixtureMode detection");
const placeholder = { chain: { rpcUrl: 'https://YOUR_RPC_ENDPOINT' }, contracts: { governor: '0x1234' } };
const live = { chain: { rpcUrl: 'https://sepolia.infura.io/v3/abc' }, contracts: { governor: '0xabcdef1234567890abcdef1234567890abcdef12' } };
const zeroGov = { chain: { rpcUrl: 'https://sepolia.infura.io/v3/abc' }, contracts: { governor: '0x0000000000000000000000000000000000000000' } };
const fixtureChecks = {
  placeholder: mProvider.isFixtureMode(placeholder),
  live: mProvider.isFixtureMode(live),
  zeroGov: mProvider.isFixtureMode(zeroGov)
};
assert("placeholder RPC → fixture mode", fixtureChecks.placeholder === true);
assert("live RPC + real governor → live mode", fixtureChecks.live === false);
assert("zero governor address → fixture mode", fixtureChecks.zeroGov === true);

console.log(`\ncheck-wallet-integration: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
