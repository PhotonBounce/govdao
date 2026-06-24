import fs from "node:fs";
import path from "node:path";

type DistributionChannel = "google-play" | "app-store" | "enterprise" | "web";
type PricingModel = "subscription" | "license" | "hybrid";
type ReleaseTrack = "internal" | "closed" | "open" | "production";
type GovernanceMode = "on-chain" | "off-chain" | "hybrid";
type OffchainAuthMethod = "passkey" | "email-otp" | "oauth" | "wallet-signature";
type ModuleKind = "dao" | "documents" | "chat" | "payments" | "support" | "analytics" | "custom";

export interface AppManifest {
  app: {
    name: string;
    bundleId: string;
    version: string;
    environment: string;
    distribution: {
      channel: DistributionChannel;
      pricingModel: PricingModel;
      hostedServices: string[];
    };
  };
  wallet: {
    required: boolean;
    supported: string[];
  };
  chain: {
    id: number;
    name: string;
    rpcUrl: string;
    blockExplorer: string;
  };
  contracts: {
    memberRegistry: string;
    timelock: string;
    governor: string;
    treasury: string;
    emergencyGuardian: string;
  };
  features: {
    proposalFeed: boolean;
    proposalCreation: boolean;
    voting: boolean;
    treasuryView: boolean;
    pushNotifications: boolean;
    biometricConfirm: boolean;
    fiatOnramp: boolean;
  };
  services: {
    metadataBaseUrl: string;
    indexerBaseUrl: string;
    notificationBaseUrl: string;
    mobileFeeds: {
      proposalsPath: string;
      motionsPath: string;
      treasuryPath: string;
      guardianPath: string;
      workspacePath: string;
      membersPath: string;
    };
  };
  support: {
    website: string;
    email: string;
    legalName: string;
    privacyPolicyUrl: string;
    termsOfServiceUrl: string;
  };
  governance: {
    mode: GovernanceMode;
    offchain: {
      enabled: boolean;
      provider: string;
      apiBaseUrl: string;
      auth: OffchainAuthMethod[];
      proposalStorage: string;
      voteStorage: string;
      voteAnchoringEnabled: boolean;
    };
  };
  experiences: {
    primaryModuleId: string;
    modules: Array<{
      id: string;
      title: string;
      kind: ModuleKind;
      enabled: boolean;
      entryRoute: string;
      apiBaseUrl: string;
      webUrl: string;
      requiresAuth: boolean;
    }>;
  };
  release: {
    android: {
      applicationId: string;
      versionCode: number;
      track: ReleaseTrack;
    };
    listing: {
      shortDescription: string;
      fullDescription: string;
      category: string;
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

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getOptionalBoolean(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) {
    return fallback;
  }

  return value === "true";
}

function getOptionalNumber(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return parsed;
}

function getOptionalList(name: string, fallback: string[]): string[] {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function buildManifest(): AppManifest {
  return {
    app: {
      name: getEnv("APP_NAME", "GOVDAO"),
      bundleId: getEnv("APP_BUNDLE_ID", "com.govdao.app"),
      version: getEnv("APP_VERSION", "0.2.0"),
      environment: getEnv("APP_ENVIRONMENT", "sepolia"),
      distribution: {
        channel: getEnv("APP_DISTRIBUTION_CHANNEL", "google-play") as DistributionChannel,
        pricingModel: getEnv("APP_PRICING_MODEL", "subscription") as PricingModel,
        hostedServices: getOptionalList("APP_HOSTED_SERVICES", ["notifications", "search", "ipfs-pinning"])
      }
    },
    wallet: {
      required: getOptionalBoolean("APP_WALLET_REQUIRED", true),
      supported: getOptionalList("APP_WALLET_SUPPORTED", ["walletconnect", "coinbase-wallet", "injected"])
    },
    chain: {
      id: getOptionalNumber("CHAIN_ID", 1),
      name: getEnv("CHAIN_NAME", "ethereum"),
      rpcUrl: getEnv("CHAIN_RPC_URL", "https://YOUR_MAINNET_RPC_ENDPOINT"),
      blockExplorer: getEnv("CHAIN_BLOCK_EXPLORER", "https://etherscan.io")
    },
    contracts: {
      memberRegistry: getEnv("MEMBER_REGISTRY_ADDRESS", "0x0000000000000000000000000000000000000000"),
      timelock: getEnv("TIMELOCK_ADDRESS", "0x0000000000000000000000000000000000000000"),
      governor: getEnv("GOVERNOR_ADDRESS", "0x0000000000000000000000000000000000000000"),
      treasury: getEnv("TREASURY_ADDRESS", "0x0000000000000000000000000000000000000000"),
      emergencyGuardian: getEnv("EMERGENCY_GUARDIAN_ADDRESS", "0x0000000000000000000000000000000000000000")
    },
    features: {
      proposalFeed: getOptionalBoolean("FEATURE_PROPOSAL_FEED", true),
      proposalCreation: getOptionalBoolean("FEATURE_PROPOSAL_CREATION", true),
      voting: getOptionalBoolean("FEATURE_VOTING", true),
      treasuryView: getOptionalBoolean("FEATURE_TREASURY_VIEW", true),
      pushNotifications: getOptionalBoolean("FEATURE_PUSH_NOTIFICATIONS", true),
      biometricConfirm: getOptionalBoolean("FEATURE_BIOMETRIC_CONFIRM", true),
      fiatOnramp: getOptionalBoolean("FEATURE_FIAT_ONRAMP", false)
    },
    services: {
      metadataBaseUrl: getEnv("METADATA_BASE_URL", "https://example.govdao.app/metadata"),
      indexerBaseUrl: getEnv("INDEXER_BASE_URL", "https://example.govdao.app/indexer"),
      notificationBaseUrl: getEnv("NOTIFICATION_BASE_URL", "https://example.govdao.app/notifications"),
      mobileFeeds: {
        proposalsPath: getEnv("MOBILE_FEED_PROPOSALS_PATH", "/mobile/proposals"),
        motionsPath: getEnv("MOBILE_FEED_MOTIONS_PATH", "/mobile/motions"),
        treasuryPath: getEnv("MOBILE_FEED_TREASURY_PATH", "/mobile/treasury"),
        guardianPath: getEnv("MOBILE_FEED_GUARDIAN_PATH", "/mobile/guardian"),
        workspacePath: getEnv("MOBILE_FEED_WORKSPACE_PATH", "/mobile/workspace"),
        membersPath: getEnv("MOBILE_FEED_MEMBERS_PATH", "/mobile/members")
      }
    },
    support: {
      website: getEnv("SUPPORT_WEBSITE", "https://govdao.app"),
      email: getEnv("SUPPORT_EMAIL", "support@govdao.app"),
      legalName: getEnv("SUPPORT_LEGAL_NAME", "GOVDAO Labs"),
      privacyPolicyUrl: getEnv("SUPPORT_PRIVACY_POLICY_URL", "https://govdao.app/privacy"),
      termsOfServiceUrl: getEnv("SUPPORT_TERMS_OF_SERVICE_URL", "https://govdao.app/terms")
    },
    governance: {
      mode: getEnv("GOVERNANCE_MODE", "hybrid") as GovernanceMode,
      offchain: {
        enabled: getOptionalBoolean("OFFCHAIN_DAO_ENABLED", true),
        provider: getEnv("OFFCHAIN_DAO_PROVIDER", "govdao-control-plane"),
        apiBaseUrl: getEnv("OFFCHAIN_DAO_API_BASE_URL", "https://example.govdao.app/offchain"),
        auth: getOptionalList("OFFCHAIN_DAO_AUTH", ["passkey", "wallet-signature"]) as OffchainAuthMethod[],
        proposalStorage: getEnv("OFFCHAIN_DAO_PROPOSAL_STORAGE", "postgres+ipfs"),
        voteStorage: getEnv("OFFCHAIN_DAO_VOTE_STORAGE", "postgres+merkle-anchoring"),
        voteAnchoringEnabled: getOptionalBoolean("OFFCHAIN_DAO_VOTE_ANCHORING_ENABLED", true)
      }
    },
    experiences: {
      primaryModuleId: getEnv("PRIMARY_MODULE_ID", "dao"),
      modules: [
        {
          id: "dao",
          title: getEnv("MODULE_DAO_TITLE", "Governance"),
          kind: "dao",
          enabled: getOptionalBoolean("MODULE_DAO_ENABLED", true),
          entryRoute: getEnv("MODULE_DAO_ENTRY_ROUTE", "/governance"),
          apiBaseUrl: getEnv("MODULE_DAO_API_BASE_URL", "https://api.govdao.app/governance"),
          webUrl: getEnv("MODULE_DAO_WEB_URL", "https://app.govdao.app/governance"),
          requiresAuth: getOptionalBoolean("MODULE_DAO_REQUIRES_AUTH", true)
        },
        {
          id: getEnv("MODULE_COMPANION_ID", "workspace"),
          title: getEnv("MODULE_COMPANION_TITLE", "Workspace"),
          kind: getEnv("MODULE_COMPANION_KIND", "documents") as ModuleKind,
          enabled: getOptionalBoolean("MODULE_COMPANION_ENABLED", true),
          entryRoute: getEnv("MODULE_COMPANION_ENTRY_ROUTE", "/workspace"),
          apiBaseUrl: getEnv("MODULE_COMPANION_API_BASE_URL", "https://api.govdao.app/workspace"),
          webUrl: getEnv("MODULE_COMPANION_WEB_URL", "https://app.govdao.app/workspace"),
          requiresAuth: getOptionalBoolean("MODULE_COMPANION_REQUIRES_AUTH", true)
        }
      ]
    },
    release: {
      android: {
        applicationId: getEnv("ANDROID_APPLICATION_ID", getEnv("APP_BUNDLE_ID", "com.govdao.app")),
        versionCode: getOptionalNumber("ANDROID_VERSION_CODE", 3),
        track: getEnv("ANDROID_RELEASE_TRACK", "internal") as ReleaseTrack
      },
      listing: {
        shortDescription: getEnv("PLAY_SHORT_DESCRIPTION", "Transparent governance for member-led organizations."),
        fullDescription: getEnv(
          "PLAY_FULL_DESCRIPTION",
          "GOVDAO gives members a secure mobile interface for proposals, voting, treasury transparency, and emergency governance status."
        ),
        category: getEnv("PLAY_CATEGORY", "business")
      }
    }
  };
}

function main() {
  const outputArg = getArgValue("--output");
  const outputPath = outputArg
    ? path.resolve(process.cwd(), outputArg)
    : path.resolve(process.cwd(), "config", "mobile-app.manifest.generated.json");

  const manifest = buildManifest();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`Manifest written to ${outputPath}`);
}

if (require.main === module) {
  main();
}