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
const { loadMobileDashboardData } = require(path.join(rootPath, "mobileDataSource.ts"));

const data = await loadMobileDashboardData(manifest);

console.log(JSON.stringify({
  source: data.source,
  syncMessage: data.syncMessage,
  endpoints: data.endpoints.map((endpoint) => ({
    label: endpoint.label,
    state: endpoint.state,
    detail: endpoint.detail
  }))
}, null, 2));

if (data.source === "mock") {
  console.error("Dashboard data check failed: local manifest is still using preview-only data.");
  process.exitCode = 1;
}