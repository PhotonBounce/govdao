#!/usr/bin/env bash
#
# deploy-and-wire — one command to deploy the GOVDAO contracts to a network and
# generate a production app manifest wired to the new addresses.
#
# Usage:
#   export SEPOLIA_RPC_URL="https://..."          # RPC for the target network
#   export DEPLOYER_PRIVATE_KEY="0x..."           # funded deployer
#   # optional store-listing values:
#   export RPC_URL="$SEPOLIA_RPC_URL" SUPPORT_WEBSITE="https://..." \
#          PRIVACY_POLICY_URL="https://.../privacy-policy.html" \
#          TERMS_URL="https://.../terms.html" SUPPORT_EMAIL="contact@..."
#   bash scripts/deploy-and-wire.sh sepolia
#
set -euo pipefail

NET="${1:-sepolia}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

echo "=== GOVDAO deploy-and-wire → ${NET} ==="

if [[ "${NET}" != "localhost" && "${NET}" != "hardhat" ]]; then
  : "${SEPOLIA_RPC_URL:?Set SEPOLIA_RPC_URL (or your network RPC) before deploying}"
  : "${DEPLOYER_PRIVATE_KEY:?Set DEPLOYER_PRIVATE_KEY (a funded account) before deploying}"
  # Default the manifest RPC to the deploy RPC unless RPC_URL is set explicitly.
  export RPC_URL="${RPC_URL:-${SEPOLIA_RPC_URL}}"
fi

echo "[1/2] Deploying contracts..."
npx hardhat run scripts/deploy.ts --network "${NET}"

echo ""
echo "[2/3] Wiring production manifest..."
npx ts-node scripts/wire-manifest.ts --network "${NET}"

echo ""
echo "[3/3] Validating production manifest for Google Play..."
PROD_MANIFEST="config/mobile-app.manifest.production.json"
if npx ts-node scripts/validate-google-play-release.ts --manifest "${PROD_MANIFEST}"; then
  echo ""
  echo "✅ Production manifest is store-ready. Next: build a signed AAB —"
  echo "   cd apps/mobile && eas build -p android --profile production"
  echo "   (see docs/RELEASE_CHECKLIST.md phases 3-5)"
else
  echo ""
  echo "⚠️  Validation flagged fields that still need real values (above)."
  echo "    Set them via env (RPC_URL, SUPPORT_WEBSITE, PRIVACY_POLICY_URL, …) and re-run,"
  echo "    or edit ${PROD_MANIFEST} directly, then re-validate:"
  echo "    npm run validate:google-play -- --manifest ${PROD_MANIFEST}"
fi
