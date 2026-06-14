import fs from "node:fs";
import path from "node:path";
import { AppManifest } from "./export-app-manifest";

interface ExpoAppConfig {
  expo: {
    name: string;
    version: string;
    icon?: string;
    splash?: { image?: string; backgroundColor?: string };
    android?: {
      package?: string;
      versionCode?: number;
      adaptiveIcon?: { foregroundImage?: string; backgroundColor?: string };
      permissions?: string[];
    };
  };
}

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return undefined;
  }

  return process.argv[index + 1];
}

function validateAppConfig(manifest: AppManifest, appConfig: ExpoAppConfig, mobileDir: string): string[] {
  const errors: string[] = [];
  const expo = appConfig.expo;
  const android = expo.android ?? {};

  if (android.package !== manifest.app.bundleId) {
    errors.push(`app.json android.package (${android.package}) must match manifest app.bundleId (${manifest.app.bundleId}).`);
  }

  if (android.package !== manifest.release.android.applicationId) {
    errors.push(`app.json android.package (${android.package}) must match manifest release.android.applicationId (${manifest.release.android.applicationId}).`);
  }

  if (expo.version !== manifest.app.version) {
    errors.push(`app.json expo.version (${expo.version}) must match manifest app.version (${manifest.app.version}).`);
  }

  if (android.versionCode !== manifest.release.android.versionCode) {
    errors.push(`app.json android.versionCode (${android.versionCode}) must match manifest release.android.versionCode (${manifest.release.android.versionCode}).`);
  }

  const imagePaths: Array<[string, string | undefined]> = [
    ["expo.icon", expo.icon],
    ["expo.splash.image", expo.splash?.image],
    ["expo.android.adaptiveIcon.foregroundImage", android.adaptiveIcon?.foregroundImage]
  ];

  for (const [label, imagePath] of imagePaths) {
    if (!imagePath) {
      errors.push(`${label} must be set for a store build.`);
    } else if (!fs.existsSync(path.resolve(mobileDir, imagePath))) {
      errors.push(`${label} points at ${imagePath}, which does not exist. Run npm --prefix apps/mobile run generate:assets.`);
    }
  }

  const extraPermissions = (android.permissions ?? []).filter((permission) => !permission.endsWith(".INTERNET"));
  if (extraPermissions.length > 0) {
    errors.push(`app.json declares extra Android permissions (${extraPermissions.join(", ")}); each one must be justified in the Play data-safety form before release.`);
  }

  return errors;
}

function main() {
  const manifestArg = getArgValue("--manifest") ?? path.join("config", "mobile-app.manifest.generated.json");
  const manifestPath = path.resolve(process.cwd(), manifestArg);
  const mobileDir = path.resolve(process.cwd(), "apps", "mobile");
  const appConfigPath = path.join(mobileDir, "app.json");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as AppManifest;
  const appConfig = JSON.parse(fs.readFileSync(appConfigPath, "utf8")) as ExpoAppConfig;
  const errors = validateAppConfig(manifest, appConfig, mobileDir);

  console.log(`Validated app config ${appConfigPath} against ${manifestPath}`);

  if (errors.length > 0) {
    console.error("Errors:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("App config validation passed.");
}

main();
