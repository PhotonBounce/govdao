/**
 * QA gate: validates ABI encoding, fixture vs live path detection, and provider construction.
 */

import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const abisFile = path.resolve(__dirname, "../src/data/contractAbis.ts");
const providerFile = path.resolve(__dirname, "../src/data/walletProvider.ts");

const abisJs = execSync(
  `npx --yes ts-node --compiler-options '{"module":"CommonJS"}' --eval "const m = require('${abisFile}'); console.log(JSON.stringify({keys: Object.keys(m), governorLen: m.GOVERNOR_ABI.length, treasuryLen: m.TREASURY_ABI.length, memberLen: m.MEMBER_REGISTRY_ABI.length, guardianLen: m.EMERGENCY_GUARDIAN_ABI.length, timelockLen: m.TIMELOCK_ABI.length, voteSupport: m.VOTE_SUPPORT}))"`,
  { cwd: path.resolve(__dirname, ".."), encoding: "utf8" }
);
const abis = JSON.parse(abisJs.trim());

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

const providerJs = execSync(
  `npx --yes ts-node --compiler-options '{"module":"CommonJS"}' --eval "const m = require('${providerFile}'); console.log(JSON.stringify({keys: Object.keys(m)}))"`,
  { cwd: path.resolve(__dirname, ".."), encoding: "utf8" }
);
const provider = JSON.parse(providerJs.trim());

console.log("\nWalletProvider: all functions exported");
assert("isFixtureMode exported", provider.keys.includes("isFixtureMode"));
assert("setActiveSigner exported", provider.keys.includes("setActiveSigner"));
assert("getActiveSigner exported", provider.keys.includes("getActiveSigner"));
assert("getProvider exported", provider.keys.includes("getProvider"));
assert("clearSession exported", provider.keys.includes("clearSession"));
assert("buildContract exported", provider.keys.includes("buildContract"));
assert("connectInjectedWallet exported", provider.keys.includes("connectInjectedWallet"));
assert("getBrowserProvider exported", provider.keys.includes("getBrowserProvider"));

console.log("\nWalletProvider: isFixtureMode detection");
const fixtureJs = execSync(
  `npx --yes ts-node --compiler-options '{"module":"CommonJS"}' --eval "
const m = require('${providerFile}');
const placeholder = { chain: { rpcUrl: 'https://YOUR_RPC_ENDPOINT' }, contracts: { governor: '0x1234' } };
const live = { chain: { rpcUrl: 'https://sepolia.infura.io/v3/abc' }, contracts: { governor: '0xabcdef1234567890abcdef1234567890abcdef12' } };
const zeroGov = { chain: { rpcUrl: 'https://sepolia.infura.io/v3/abc' }, contracts: { governor: '0x0000000000000000000000000000000000000000' } };
console.log(JSON.stringify({ placeholder: m.isFixtureMode(placeholder), live: m.isFixtureMode(live), zeroGov: m.isFixtureMode(zeroGov) }))
"`,
  { cwd: path.resolve(__dirname, ".."), encoding: "utf8" }
);
const fixtureChecks = JSON.parse(fixtureJs.trim());
assert("placeholder RPC → fixture mode", fixtureChecks.placeholder === true);
assert("live RPC + real governor → live mode", fixtureChecks.live === false);
assert("zero governor address → fixture mode", fixtureChecks.zeroGov === true);

console.log(`\ncheck-wallet-integration: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
