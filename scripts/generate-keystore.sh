#!/usr/bin/env bash
#
# Generates an Android UPLOAD keystore for signing the GOVDAO app for Google Play.
#
# This produces a secret file. It is written to ./secrets/ (gitignored) and must
# NEVER be committed. Back it up somewhere safe — if you lose it you cannot push
# updates to the same Play listing without Google's key-reset process.
#
# Passwords are taken from environment variables so they never appear in the repo
# or your shell history:
#
#   KEYSTORE_PASSWORD=...  KEY_PASSWORD=...  bash scripts/generate-keystore.sh
#
# If unset, you'll be prompted interactively by keytool.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SECRETS_DIR="${REPO_ROOT}/secrets"
KEYSTORE_PATH="${SECRETS_DIR}/govdao-upload.keystore"
KEY_ALIAS="${KEY_ALIAS:-govdao-upload}"

mkdir -p "${SECRETS_DIR}"

if [[ -f "${KEYSTORE_PATH}" ]]; then
  echo "Keystore already exists at ${KEYSTORE_PATH} — refusing to overwrite." >&2
  echo "Delete it manually if you really want to regenerate (this invalidates the old key)." >&2
  exit 1
fi

# Distinguished name — override via DNAME env if you want real org details.
DNAME="${DNAME:-CN=GOVDAO, OU=Mobile, O=PhotonBounce, L=, ST=, C=US}"

EXTRA_ARGS=()
if [[ -n "${KEYSTORE_PASSWORD:-}" ]]; then EXTRA_ARGS+=(-storepass "${KEYSTORE_PASSWORD}"); fi
if [[ -n "${KEY_PASSWORD:-}" ]]; then EXTRA_ARGS+=(-keypass "${KEY_PASSWORD}"); fi

echo "Generating upload keystore → ${KEYSTORE_PATH}"
keytool -genkeypair \
  -v \
  -keystore "${KEYSTORE_PATH}" \
  -alias "${KEY_ALIAS}" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "${DNAME}" \
  "${EXTRA_ARGS[@]}"

echo ""
echo "=== Keystore created ==="
echo "  Path  : ${KEYSTORE_PATH}"
echo "  Alias : ${KEY_ALIAS}"
echo ""

# Write a gitignored keystore.properties Gradle can read (passwords only if provided).
PROPS_PATH="${SECRETS_DIR}/keystore.properties"
{
  echo "storeFile=${KEYSTORE_PATH}"
  echo "keyAlias=${KEY_ALIAS}"
  if [[ -n "${KEYSTORE_PASSWORD:-}" ]]; then echo "storePassword=${KEYSTORE_PASSWORD}"; fi
  if [[ -n "${KEY_PASSWORD:-}" ]]; then echo "keyPassword=${KEY_PASSWORD}"; fi
} > "${PROPS_PATH}"
echo "Wrote ${PROPS_PATH} (gitignored)."
echo ""

if [[ -n "${KEYSTORE_PASSWORD:-}" ]]; then
  echo "=== SHA fingerprints (register these in Play Console if asked) ==="
  keytool -list -v -keystore "${KEYSTORE_PATH}" -alias "${KEY_ALIAS}" \
    -storepass "${KEYSTORE_PASSWORD}" 2>/dev/null | grep -E "SHA1:|SHA256:" || true
fi

echo ""
echo "Next: see docs/SIGNING.md to wire this into an EAS or local Gradle release build."
