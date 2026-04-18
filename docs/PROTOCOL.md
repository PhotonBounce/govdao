# GOVDAO Protocol Specification

## Decentralization Rules (Non-Negotiable)

### Must be on-chain
- Membership registry (who is a member, what role)
- Proposal creation and state transitions
- Vote recording and tallying
- Quorum and threshold enforcement
- Timelock queue and execution eligibility
- Treasury authorization and spending caps
- Emergency pause invocation and records
- Governance parameter changes
- Role grants and revocations

### Off-chain but decentralized (IPFS/Arweave + on-chain hash)
- Proposal text and attachments
- Governance documents (constitution, playbooks)
- Member profile metadata
- Audit archives and exported reports
- Frontend hosting (IPFS with ENS fallback)

### Temporarily centralized (must have deprecation path)
- Full-text search index
- Push notifications
- Institutional identity verification
- IPFS pinning bootstrap
- CDN acceleration

### Off-chain by necessity (cannot be on-chain)
- Fiat payment execution
- Legal signatures
- Human mediation discussions
- Raw identity documents
- Real-time collaborative editing

## Governance State Machine

```
DRAFT (off-chain only, not registered)
  |
  v
PROPOSED (on-chain, voting power snapshot taken)
  |
  v
VOTING (on-chain, time-bounded)
  |
  +---> DEFEATED (quorum missed or threshold not met)
  |
  +---> SUCCEEDED (quorum met + threshold passed)
          |
          v
        QUEUED (timelock period active)
          |
          +---> CANCELLED (emergency veto during timelock)
          |
          v
        EXECUTED (on-chain state change applied)
```

## Role Model

- **Member**: Can vote on proposals. Base role.
- **Proposer**: Can create proposals. Requires member status + minimum token/stake.
- **Executor**: Can trigger execution of queued proposals after timelock.
- **Admin**: Can grant/revoke roles. Initially deployer, must be transferred to governance.
- **Guardian**: Emergency pause/veto power. Multi-sig, time-limited, removable by governance.

## Treasury Model

- All on-chain assets held by Treasury contract.
- Spending requires governance approval via passed + timelocked proposal.
- Guardian can pause treasury (not withdraw) during emergency.
- Spending caps per transaction and per period are governance-configurable.
- No hidden admin withdrawal path. Period.

## Emergency Controls

- Guardian (multi-sig) can pause governance and treasury for max 72 hours.
- Pause must be ratified by governance vote within 72 hours or auto-lifts.
- Guardian cannot move funds, only freeze operations.
- Guardian role is removable by governance vote.

## Upgrade Policy

- Core contracts are non-upgradeable in v1.
- Parameter changes (quorum, thresholds, periods) are governance-controlled.
- If a contract must be replaced, governance votes to migrate to a new address.
- No proxy patterns in v1 to minimize attack surface.
