import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ModulePill } from "./ModulePill";
import { SectionCard } from "./SectionCard";
import { SignalRow } from "./SignalRow";
import { loadProposalChainState, ProposalChainState } from "../data/chainSource";
import { DocVerificationResult, verifyProposalDocument } from "../data/docVerification";
import { ProposalItem } from "../data/mobileDataSource";
import { shortenAddress } from "../data/sessionSource";
import { AppManifest } from "../types";
import { palette } from "../theme";

interface ProposalIntegrityCardProps {
  manifest: AppManifest;
  proposal: ProposalItem;
}

const pendingChainState: ProposalChainState = {
  available: false,
  label: null,
  detail: "Checking live proposal status…"
};

const pendingDocResult: DocVerificationResult = {
  status: "unavailable",
  detail: "Verifying the anchored proposal document…",
  expectedHash: null,
  computedHash: null
};

export function ProposalIntegrityCard({ manifest, proposal }: ProposalIntegrityCardProps) {
  const requestIdRef = useRef(0);
  const [chainState, setChainState] = useState<ProposalChainState>(pendingChainState);
  const [docResult, setDocResult] = useState<DocVerificationResult>(pendingDocResult);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setChainState(pendingChainState);
    setDocResult(pendingDocResult);

    void loadProposalChainState(manifest, proposal.onchainId).then((state) => {
      if (requestIdRef.current === requestId) {
        setChainState(state);
      }
    });
    void verifyProposalDocument(proposal.docUri, proposal.docHash).then((result) => {
      if (requestIdRef.current === requestId) {
        setDocResult(result);
      }
    });

    return () => {
      requestIdRef.current += 1;
    };
  }, [manifest, proposal]);

  const docTone = docResult.status === "verified" ? "pine" : docResult.status === "mismatch" ? "rose" : "bronze";
  const docLabel = docResult.status === "verified" ? "DOC VERIFIED" : docResult.status === "mismatch" ? "HASH MISMATCH" : "DOC UNVERIFIED";

  return (
    <SectionCard
      eyebrow="Integrity"
      title="On-Chain Status And Document Proof"
      subtitle="Reviewers should be able to confirm what the chain says about this proposal and that the off-chain document still matches its anchored hash."
      infoKey="proposal-integrity"
    >
      <View style={styles.pillRow}>
        <ModulePill label={chainState.available ? `CHAIN ${chainState.label?.toUpperCase()}` : "CHAIN OFFLINE"} tone={chainState.available ? "pine" : "bronze"} />
        <ModulePill label={docLabel} tone={docTone} />
      </View>
      <SignalRow
        label="Live status"
        value={chainState.available ? chainState.label ?? "Unknown" : "Not connected"}
        tone={chainState.available ? "good" : "neutral"}
      />
      <Text style={styles.detailLine}>{chainState.detail}</Text>
      <SignalRow
        label="Document"
        value={docResult.status === "verified" ? "Hash verified" : docResult.status === "mismatch" ? "Hash mismatch" : "Unverified"}
        tone={docResult.status === "verified" ? "good" : docResult.status === "mismatch" ? "warning" : "neutral"}
      />
      {docResult.expectedHash ? <SignalRow label="Anchored hash" value={shortenAddress(docResult.expectedHash)} tone="neutral" /> : null}
      {docResult.computedHash ? <SignalRow label="Computed hash" value={shortenAddress(docResult.computedHash)} tone={docResult.status === "verified" ? "good" : "warning"} /> : null}
      <Text style={styles.detailLine}>{docResult.detail}</Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8
  },
  detailLine: {
    color: palette.inkSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8
  }
});
