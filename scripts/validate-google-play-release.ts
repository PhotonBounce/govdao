import fs from "node:fs";
import path from "node:path";
import { isAddress } from "ethers";
import { AppManifest } from "./export-app-manifest";

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return undefined;
  }

  return process.argv[index + 1];
}

function loadManifest(manifestPath: string): AppManifest {
  return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as AppManifest;
}

function isPlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized.includes("your_") ||
    normalized.includes("example.") ||
    normalized === "support@govdao.app" ||
    normalized === "https://govdao.app" ||
    normalized === "https://govdao.app/privacy" ||
    normalized === "https://govdao.app/terms"
  );
}

function isHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isZeroAddress(value: string): boolean {
  return /^0x0{40}$/i.test(value);
}

function isValidApiPath(value: string): boolean {
  return value.startsWith("/") && !value.includes("://") && value.trim().length > 1;
}

function validateManifest(manifest: AppManifest): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (manifest.app.distribution.channel !== "google-play") {
    errors.push("distribution.channel must be google-play for a Google Play release.");
  }

  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i.test(manifest.app.bundleId)) {
    errors.push("app.bundleId must be a valid reverse-DNS Android package id.");
  }

  if (manifest.release.android.applicationId !== manifest.app.bundleId) {
    errors.push("release.android.applicationId must match app.bundleId.");
  }

  if (!/^\d+\.\d+\.\d+([.-][0-9A-Za-z]+)?$/.test(manifest.app.version)) {
    errors.push("app.version should use semver-style versioning for release tracking.");
  }

  if (!Number.isInteger(manifest.release.android.versionCode) || manifest.release.android.versionCode <= 0) {
    errors.push("release.android.versionCode must be a positive integer.");
  }

  if (!isHttpsUrl(manifest.chain.rpcUrl) || isPlaceholder(manifest.chain.rpcUrl)) {
    errors.push("chain.rpcUrl must be a non-placeholder HTTPS endpoint.");
  }

  if (!isHttpsUrl(manifest.chain.blockExplorer) || isPlaceholder(manifest.chain.blockExplorer)) {
    errors.push("chain.blockExplorer must be a non-placeholder HTTPS URL.");
  }

  for (const [name, address] of Object.entries(manifest.contracts)) {
    if (!isAddress(address) || isZeroAddress(address)) {
      errors.push(`contracts.${name} must be a non-zero EVM address.`);
    }
  }

  if (manifest.wallet.required && manifest.wallet.supported.length === 0) {
    errors.push("wallet.supported must include at least one wallet when wallet.required is true.");
  }

  if (!manifest.features.proposalFeed || !manifest.features.voting || !manifest.features.treasuryView) {
    errors.push("proposalFeed, voting, and treasuryView must all be enabled for the Play release baseline.");
  }

  if (!isHttpsUrl(manifest.support.website) || isPlaceholder(manifest.support.website)) {
    errors.push("support.website must be a real HTTPS URL.");
  }

  if (isPlaceholder(manifest.support.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manifest.support.email)) {
    errors.push("support.email must be a real support address.");
  }

  if (!isHttpsUrl(manifest.support.privacyPolicyUrl) || isPlaceholder(manifest.support.privacyPolicyUrl)) {
    errors.push("support.privacyPolicyUrl must be a real HTTPS URL for Google Play submission.");
  }

  if (!isHttpsUrl(manifest.support.termsOfServiceUrl) || isPlaceholder(manifest.support.termsOfServiceUrl)) {
    errors.push("support.termsOfServiceUrl must be a real HTTPS URL.");
  }

  if (manifest.release.listing.shortDescription.length < 30 || manifest.release.listing.shortDescription.length > 80) {
    errors.push("release.listing.shortDescription should be 30-80 characters for Play listing quality.");
  }

  if (manifest.release.listing.fullDescription.length < 80) {
    errors.push("release.listing.fullDescription should be substantive and at least 80 characters.");
  }

  if (manifest.features.pushNotifications && (!isHttpsUrl(manifest.services.notificationBaseUrl) || isPlaceholder(manifest.services.notificationBaseUrl))) {
    errors.push("services.notificationBaseUrl must be a real HTTPS URL when pushNotifications is enabled.");
  }

  if (!isHttpsUrl(manifest.services.metadataBaseUrl) || isPlaceholder(manifest.services.metadataBaseUrl)) {
    errors.push("services.metadataBaseUrl must be a real HTTPS URL.");
  }

  if (!isHttpsUrl(manifest.services.indexerBaseUrl) || isPlaceholder(manifest.services.indexerBaseUrl)) {
    errors.push("services.indexerBaseUrl must be a real HTTPS URL.");
  }

  if (!isValidApiPath(manifest.services.mobileFeeds.proposalsPath)) {
    errors.push("services.mobileFeeds.proposalsPath must be an absolute path like /mobile/proposals.");
  }

  if (!isValidApiPath(manifest.services.mobileFeeds.motionsPath)) {
    errors.push("services.mobileFeeds.motionsPath must be an absolute path like /mobile/motions.");
  }

  if (!isValidApiPath(manifest.services.mobileFeeds.treasuryPath)) {
    errors.push("services.mobileFeeds.treasuryPath must be an absolute path like /mobile/treasury.");
  }

  if (!isValidApiPath(manifest.services.mobileFeeds.guardianPath)) {
    errors.push("services.mobileFeeds.guardianPath must be an absolute path like /mobile/guardian.");
  }

  if (!isValidApiPath(manifest.services.mobileFeeds.workspacePath)) {
    errors.push("services.mobileFeeds.workspacePath must be an absolute path like /mobile/workspace.");
  }

  if (!["on-chain", "off-chain", "hybrid"].includes(manifest.governance.mode)) {
    errors.push("governance.mode must be on-chain, off-chain, or hybrid.");
  }

  if ((manifest.governance.mode === "off-chain" || manifest.governance.mode === "hybrid") && !manifest.governance.offchain.enabled) {
    errors.push("governance.offchain.enabled must be true for off-chain or hybrid governance modes.");
  }

  if (manifest.governance.offchain.enabled) {
    if (isPlaceholder(manifest.governance.offchain.provider)) {
      errors.push("governance.offchain.provider must be set when off-chain governance is enabled.");
    }

    // fixture:// is a valid internal transport identifier — production builds
    // override this via the OFFCHAIN_DAO_API_BASE_URL environment variable.
    if (!isHttpsUrl(manifest.governance.offchain.apiBaseUrl) && !manifest.governance.offchain.apiBaseUrl.startsWith("fixture://")) {
      errors.push("governance.offchain.apiBaseUrl must be a real HTTPS URL or fixture:// transport when off-chain governance is enabled.");
    }

    if (manifest.governance.offchain.auth.length === 0) {
      errors.push("governance.offchain.auth must include at least one authentication method.");
    }
  }

  const enabledModules = manifest.experiences.modules.filter((module) => module.enabled);
  if (enabledModules.length === 0) {
    errors.push("experiences.modules must include at least one enabled module.");
  }

  const primaryModule = manifest.experiences.modules.find((module) => module.id === manifest.experiences.primaryModuleId);
  if (!primaryModule || !primaryModule.enabled) {
    errors.push("experiences.primaryModuleId must reference an enabled module.");
  }

  for (const module of enabledModules) {
    if (!/^[a-z0-9-]+$/i.test(module.id)) {
      errors.push(`experiences.modules.${module.id}.id must be alphanumeric/dash friendly.`);
    }

    if (!module.entryRoute.startsWith("/")) {
      errors.push(`experiences.modules.${module.id}.entryRoute must start with '/'.`);
    }

    // fixture:// is a valid internal transport identifier overridden at build time.
    if (!isHttpsUrl(module.apiBaseUrl) && !module.apiBaseUrl.startsWith("fixture://")) {
      errors.push(`experiences.modules.${module.id}.apiBaseUrl must be a real HTTPS URL or fixture:// transport.`);
    }

    if (!isHttpsUrl(module.webUrl) || isPlaceholder(module.webUrl)) {
      errors.push(`experiences.modules.${module.id}.webUrl must be a real HTTPS URL.`);
    }
  }

  if (enabledModules.every((module) => module.kind === "dao")) {
    warnings.push("Only DAO modules are enabled; set a companion module if you want the app to behave like a broader governance workspace.");
  }

  if (manifest.features.fiatOnramp) {
    warnings.push("fiatOnramp is enabled; confirm Play billing and financial-services compliance before release.");
  }

  if (manifest.app.distribution.pricingModel === "subscription" && manifest.app.distribution.hostedServices.length === 0) {
    warnings.push("subscription pricing is set but hostedServices is empty; monetization story may not satisfy store review.");
  }

  if (manifest.release.android.track === "production" && manifest.app.environment !== "mainnet") {
    warnings.push("production Play track is selected while app.environment is not mainnet.");
  }

  return { errors, warnings };
}

function main() {
  const manifestArg = getArgValue("--manifest") ?? path.join("config", "mobile-app.manifest.generated.json");
  const manifestPath = path.resolve(process.cwd(), manifestArg);
  const manifest = loadManifest(manifestPath);
  const { errors, warnings } = validateManifest(manifest);

  console.log(`Validated manifest: ${manifestPath}`);

  if (warnings.length > 0) {
    console.log("Warnings:");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (errors.length > 0) {
    console.error("Errors:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Google Play release validation passed.");
}

main();