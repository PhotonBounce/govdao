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
const { connectSession, getAccessOptions } = require(path.join(rootPath, "sessionSource.ts"));

const options = getAccessOptions(manifest);
const walletOption = options.find((option) => option.kind === "wallet");
const offchainOption = options.find((option) => option.kind === "offchain");
const probes = [walletOption, offchainOption].filter(Boolean);
const sessions = await Promise.all(probes.map((option) => connectSession(option, manifest)));

console.log(JSON.stringify({
  required: manifest.wallet.required,
  options: options.map((option) => ({ id: option.id, label: option.label, kind: option.kind })),
  sessions: sessions.map((session) => ({
    methodId: session.methodId,
    kind: session.kind,
    memberLabel: session.memberLabel,
    role: session.role,
    transport: session.transport
  }))
}, null, 2));

if (options.length === 0) {
  console.error("Session check failed: the active manifest enables no access methods.");
  process.exitCode = 1;
} else if (manifest.wallet.required && !walletOption) {
  console.error("Session check failed: wallet.required is true but no wallet methods are supported.");
  process.exitCode = 1;
} else if (sessions.some((session) => !session.memberLabel || !session.address)) {
  console.error("Session check failed: a sign-in handshake returned an incomplete identity.");
  process.exitCode = 1;
}
