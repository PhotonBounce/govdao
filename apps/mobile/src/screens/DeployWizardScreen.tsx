import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { SectionCard } from "../components/SectionCard";
import { ModulePill } from "../components/ModulePill";
import { buildManifestFragment, deployStep, DeployStepResult, DEPLOY_STEPS, DeployStep, DeployPhase } from "../data/deploySource";
import { AppManifest } from "../types";
import { darkPalette, radii } from "../theme";

interface DeployWizardScreenProps {
  manifest: AppManifest;
  sessionActive: boolean;
  onBack: () => void;
}

export function DeployWizardScreen({ manifest, sessionActive, onBack }: DeployWizardScreenProps) {
  const [results, setResults] = useState<DeployStepResult[]>([]);
  const [phases, setPhases] = useState<Record<number, DeployPhase>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [finished, setFinished] = useState(false);

  const isDeploying = Object.values(phases).some((p) => p === "deploying");
  const nextStep = results.length < DEPLOY_STEPS.length ? results.length : -1;

  async function handleDeployNext() {
    if (!sessionActive) {
      Alert.alert("Session Required", "Connect your wallet before deploying contracts.");
      return;
    }
    const step = nextStep as DeployStep;
    if (step < 0) return;
    setCurrentStep(step);
    setPhases((prev) => ({ ...prev, [step]: "deploying" }));
    setErrors((prev) => { const n = { ...prev }; delete n[step]; return n; });

    try {
      const result = await deployStep(step, manifest, (phase) => {
        setPhases((prev) => ({ ...prev, [step]: phase }));
      });
      setResults((prev) => [...prev, result]);
      if (step === DEPLOY_STEPS.length - 1) setFinished(true);
    } catch (err) {
      setErrors((prev) => ({ ...prev, [step]: err instanceof Error ? err.message : "Deploy failed." }));
      setPhases((prev) => ({ ...prev, [step]: "error" }));
    }
  }

  function handleExportManifest() {
    const fragment = buildManifestFragment(results);
    Alert.alert(
      "Manifest Fragment",
      JSON.stringify(fragment.contracts, null, 2),
      [{ text: "Copy & Close" }]
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <SectionCard
        tone="glass"
        eyebrow="Developer Tools"
        title="Contract Deploy Wizard"
        subtitle="Deploy all five GOVDAO contracts in dependency order. Each step requires your connected wallet to sign one transaction."
        infoKey="deploy-wizard"
      >
        {!sessionActive && (
          <View style={styles.warningRow}>
            <ModulePill label="NO WALLET" tone="rose" />
            <Text style={styles.warningText}>Connect your wallet in the Overview tab to deploy contracts.</Text>
          </View>
        )}

        <View style={styles.stepList}>
          {DEPLOY_STEPS.map((info, i) => {
            const result = results[i];
            const phase = phases[i] ?? "idle";
            const error = errors[i];
            const isNext = i === nextStep;
            const isDone = !!result;

            return (
              <View key={i} style={[styles.stepRow, isDone && styles.stepRowDone, isNext && styles.stepRowNext]}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>
                    {isDone ? "✓" : phase === "error" ? "✗" : String(i + 1)}
                  </Text>
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepName}>{info.name}</Text>
                  <Text style={styles.stepDesc}>{info.description}</Text>
                  {phase === "deploying" && (
                    <Text style={styles.stepStatus}>Deploying…</Text>
                  )}
                  {isDone && (
                    <>
                      <Text style={styles.stepAddress}>{result.address.slice(0, 10)}…{result.address.slice(-6)}</Text>
                      <Text style={styles.stepTx}>tx: {result.txHash.slice(0, 10)}…</Text>
                      <ModulePill label={result.transport === "remote" ? "ON-CHAIN" : "FIXTURE"} tone={result.transport === "remote" ? "pine" : "bronze"} />
                    </>
                  )}
                  {error && <Text style={styles.stepError}>{error}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {!finished && nextStep >= 0 && (
          <Pressable
            style={[styles.deployBtn, (isDeploying || !sessionActive) && styles.deployBtnDisabled]}
            onPress={handleDeployNext}
            disabled={isDeploying || !sessionActive}
          >
            <Text style={styles.deployBtnText}>
              {isDeploying ? "Deploying…" : `Deploy ${DEPLOY_STEPS[nextStep].name}`}
            </Text>
          </Pressable>
        )}

        {finished && (
          <View style={styles.finishedBlock}>
            <ModulePill label="ALL DEPLOYED" tone="pine" />
            <Text style={styles.finishedText}>
              All 5 contracts deployed successfully. Export the manifest fragment to configure your app for live governance.
            </Text>
            <Pressable style={styles.exportBtn} onPress={handleExportManifest}>
              <Text style={styles.exportBtnText}>Export Manifest Fragment</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back to Settings</Text>
        </Pressable>
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 40
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    padding: 12,
    backgroundColor: "rgba(201,83,64,0.1)",
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "rgba(201,83,64,0.2)"
  },
  warningText: {
    flex: 1,
    color: "rgba(224,219,208,0.7)",
    fontSize: 13
  },
  stepList: {
    gap: 12,
    marginBottom: 20
  },
  stepRow: {
    flexDirection: "row",
    gap: 14,
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: darkPalette.mutedLine,
    backgroundColor: "rgba(255,255,255,0.02)"
  },
  stepRowDone: {
    borderColor: "rgba(201,131,64,0.3)",
    backgroundColor: "rgba(201,131,64,0.05)"
  },
  stepRowNext: {
    borderColor: darkPalette.glowBronze,
    backgroundColor: "rgba(201,131,64,0.08)"
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(201,131,64,0.2)",
    borderWidth: 1,
    borderColor: darkPalette.glowBronze,
    alignItems: "center",
    justifyContent: "center"
  },
  stepNumberText: {
    color: darkPalette.softGold,
    fontSize: 13,
    fontWeight: "700"
  },
  stepBody: {
    flex: 1,
    gap: 4
  },
  stepName: {
    color: darkPalette.dimWhite,
    fontSize: 15,
    fontWeight: "700"
  },
  stepDesc: {
    color: "rgba(224,219,208,0.55)",
    fontSize: 12
  },
  stepStatus: {
    color: darkPalette.glowBronze,
    fontSize: 12,
    fontStyle: "italic"
  },
  stepAddress: {
    color: darkPalette.softGold,
    fontSize: 12,
    fontFamily: "monospace"
  },
  stepTx: {
    color: "rgba(224,219,208,0.4)",
    fontSize: 11,
    fontFamily: "monospace"
  },
  stepError: {
    color: "#e07060",
    fontSize: 12
  },
  deployBtn: {
    backgroundColor: darkPalette.glowBronze,
    borderRadius: radii.card,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12
  },
  deployBtnDisabled: {
    opacity: 0.4
  },
  deployBtnText: {
    color: "#0d0d1a",
    fontSize: 15,
    fontWeight: "700"
  },
  finishedBlock: {
    gap: 12,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "rgba(40,80,50,0.15)",
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "rgba(60,160,80,0.3)"
  },
  finishedText: {
    color: darkPalette.dimWhite,
    fontSize: 13,
    lineHeight: 20
  },
  exportBtn: {
    borderWidth: 1,
    borderColor: darkPalette.softGold,
    borderRadius: radii.card,
    paddingVertical: 10,
    alignItems: "center"
  },
  exportBtnText: {
    color: darkPalette.softGold,
    fontSize: 14,
    fontWeight: "600"
  },
  backBtn: {
    paddingVertical: 10,
    alignItems: "center"
  },
  backBtnText: {
    color: "rgba(224,219,208,0.5)",
    fontSize: 13
  }
});
