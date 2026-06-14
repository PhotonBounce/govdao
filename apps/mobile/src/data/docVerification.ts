// Dependency-free keccak-256 so the client can verify proposal document
// integrity against the on-chain metadataHash without bundling a crypto lib.
// Cross-checked against known vectors and ethers in scripts/check-proposal.mjs.

const ROUND_CONSTANTS = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
];

// Rotation offsets r[x][y] from the Keccak reference.
const ROTATIONS = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14]
];

const LANE_MASK = (1n << 64n) - 1n;
const RATE_BYTES = 136; // 1088-bit rate for keccak-256

function rotl(value: bigint, shift: number): bigint {
  const offset = BigInt(shift % 64);
  return ((value << offset) | (value >> (64n - offset))) & LANE_MASK;
}

function keccakF(state: bigint[]): void {
  for (let round = 0; round < 24; round += 1) {
    // theta
    const c: bigint[] = [];
    for (let x = 0; x < 5; x += 1) {
      c[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    }
    for (let x = 0; x < 5; x += 1) {
      const d = c[(x + 4) % 5] ^ rotl(c[(x + 1) % 5], 1);
      for (let y = 0; y < 5; y += 1) {
        state[x + 5 * y] ^= d;
      }
    }

    // rho + pi
    const b: bigint[] = new Array(25).fill(0n);
    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        b[y + 5 * ((2 * x + 3 * y) % 5)] = rotl(state[x + 5 * y], ROTATIONS[x][y]);
      }
    }

    // chi
    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        state[x + 5 * y] = b[x + 5 * y] ^ (~b[((x + 1) % 5) + 5 * y] & b[((x + 2) % 5) + 5 * y] & LANE_MASK);
      }
    }

    // iota
    state[0] ^= ROUND_CONSTANTS[round];
  }
}

function utf8Encode(text: string): number[] {
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }

  return bytes;
}

export function keccak256(text: string): string {
  const message = utf8Encode(text);
  const padded = [...message, 0x01];
  while (padded.length % RATE_BYTES !== 0) {
    padded.push(0x00);
  }
  padded[padded.length - 1] |= 0x80;

  const state: bigint[] = new Array(25).fill(0n);
  for (let blockStart = 0; blockStart < padded.length; blockStart += RATE_BYTES) {
    for (let lane = 0; lane < RATE_BYTES / 8; lane += 1) {
      let value = 0n;
      for (let byteIndex = 7; byteIndex >= 0; byteIndex -= 1) {
        value = (value << 8n) | BigInt(padded[blockStart + lane * 8 + byteIndex]);
      }
      state[lane] ^= value;
    }
    keccakF(state);
  }

  let hex = "";
  for (let lane = 0; lane < 4; lane += 1) {
    let value = state[lane];
    for (let byteIndex = 0; byteIndex < 8; byteIndex += 1) {
      hex += (value & 0xffn).toString(16).padStart(2, "0");
      value >>= 8n;
    }
  }

  return `0x${hex}`;
}

export type DocVerificationStatus = "verified" | "mismatch" | "unavailable";

export interface DocVerificationResult {
  status: DocVerificationStatus;
  detail: string;
  expectedHash: string | null;
  computedHash: string | null;
}

const REQUEST_TIMEOUT_MS = 4000;
const FIXTURE_SCHEME = "fixture://";

const fixtureDocuments: Record<string, string> = {
  "fixture://govdao/docs/gov-104": "GOVDAO Proposal GOV-104\n\nExpand the emergency guardian signer set by adding two institutional signers and rotating the active threshold to 3-of-5. Includes the signer onboarding checklist and revocation procedure.",
  "fixture://govdao/docs/gov-105": "GOVDAO Proposal GOV-105\n\nMove monthly treasury reports into an anchored off-chain review flow with on-chain acceptance. Defines the report template, review window, and anchoring format.",
  "fixture://govdao/docs/gov-201": "GOVDAO Proposal GOV-201\n\nRatify the member-facing release operations checklist before expanding the internal-track pilot. Covers support escalation, rollback steps, and disclosure links.",
  "fixture://govdao/docs/gov-202": "GOVDAO Proposal GOV-202\n\nRaise the emergency response rehearsal cadence from quarterly to monthly with expanded signer coverage and published drill reports."
};

async function fetchDocumentText(uri: string): Promise<string | null> {
  if (uri.toLowerCase().startsWith(FIXTURE_SCHEME)) {
    return fixtureDocuments[uri.toLowerCase()] ?? null;
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(uri, { signal: controller.signal });
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export async function verifyProposalDocument(docUri: string, expectedHash: string): Promise<DocVerificationResult> {
  if (!docUri || !expectedHash) {
    return {
      status: "unavailable",
      detail: "This proposal does not carry a document URI and anchored hash.",
      expectedHash: expectedHash || null,
      computedHash: null
    };
  }

  const text = await fetchDocumentText(docUri);

  if (text === null) {
    return {
      status: "unavailable",
      detail: `The proposal document could not be retrieved from ${docUri}.`,
      expectedHash,
      computedHash: null
    };
  }

  const computedHash = keccak256(text);
  const matches = computedHash.toLowerCase() === expectedHash.toLowerCase();

  return {
    status: matches ? "verified" : "mismatch",
    detail: matches
      ? "The retrieved document matches the anchored keccak-256 hash."
      : "The retrieved document does NOT match the anchored hash; treat its contents as untrusted.",
    expectedHash,
    computedHash
  };
}
