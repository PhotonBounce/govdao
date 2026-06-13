export type DistributionChannel = "google-play" | "app-store" | "enterprise" | "web";
export type PricingModel = "subscription" | "license" | "hybrid";
export type GovernanceMode = "on-chain" | "off-chain" | "hybrid";
export type OffchainAuthMethod = "passkey" | "email-otp" | "oauth" | "wallet-signature";
export type ModuleKind = "dao" | "documents" | "chat" | "payments" | "support" | "analytics" | "custom";

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
    plan: "free" | "premium";
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
      track: string;
    };
    listing: {
      shortDescription: string;
      fullDescription: string;
      category: string;
    };
  };
}