#!/usr/bin/env bash
set -euo pipefail

# ── Environment variable validation ─────────────────────────────────────────
if [[ -z "${FTP_HOST:-}" ]]; then
  echo "ERROR: FTP_HOST environment variable is not set." >&2
  exit 1
fi

if [[ -z "${FTP_USER:-}" ]]; then
  echo "ERROR: FTP_USER environment variable is not set." >&2
  exit 1
fi

if [[ -z "${FTP_PASS:-}" ]]; then
  echo "ERROR: FTP_PASS environment variable is not set." >&2
  exit 1
fi

# ── Resolve script location so paths work from any working directory ─────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MICROSITE_DIR="${REPO_ROOT}/microsite"

# ── Helper: upload one file ──────────────────────────────────────────────────
# Usage: upload_file <local-path> <remote-path>
upload_file() {
  local local_path="$1"
  local remote_path="$2"
  local remote_url="ftp://${FTP_HOST}${remote_path}"

  if [[ ! -f "${local_path}" ]]; then
    echo "ERROR: Local file not found: ${local_path}" >&2
    exit 1
  fi

  echo "Uploading ${local_path} → ${remote_url}"

  curl \
    --silent \
    --show-error \
    --fail \
    --ftp-create-dirs \
    --user "${FTP_USER}:${FTP_PASS}" \
    --upload-file "${local_path}" \
    "${remote_url}"

  echo "  OK: ${remote_url}"
}

# ── File manifest: local path → remote path ──────────────────────────────────
echo "=== GOVDAO Microsite FTP Deploy ==="
echo "Host : ${FTP_HOST}"
echo "User : ${FTP_USER}"
echo ""

upload_file "${MICROSITE_DIR}/index.html"                  "/index.html"
upload_file "${MICROSITE_DIR}/privacy-policy.html"         "/privacy-policy.html"
upload_file "${MICROSITE_DIR}/terms.html"                  "/terms.html"
upload_file "${MICROSITE_DIR}/assets/style.css"            "/assets/style.css"
upload_file "${MICROSITE_DIR}/assets/main.js"              "/assets/main.js"
upload_file "${MICROSITE_DIR}/assets/seal.svg"             "/assets/seal.svg"

echo ""
echo "=== Deploy complete. All files uploaded to ftp://${FTP_HOST}/ ==="
