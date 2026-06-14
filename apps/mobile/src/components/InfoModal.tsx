import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { infoContent } from "../data/infoContent";
import { darkPalette, palette, radii } from "../theme";

interface InfoModalProps {
  infoKey: string | null;
  onClose: () => void;
}

export function InfoModal({ infoKey, onClose }: InfoModalProps) {
  const slideY = useRef(new Animated.Value(300)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const entry = infoKey ? infoContent[infoKey] : null;

  useEffect(() => {
    if (infoKey) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true })
      ]).start();
    } else {
      slideY.setValue(300);
      opacity.setValue(0);
    }
  }, [infoKey]);

  if (!entry) return null;

  return (
    <Modal visible={!!infoKey} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }], opacity }]}>
          <Pressable>
            <View style={styles.handle} />
            <Text style={styles.title}>{entry.title}</Text>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.body}>{entry.body}</Text>
              {entry.example ? (
                <View style={styles.exampleBox}>
                  <Text style={styles.exampleLabel}>EXAMPLE</Text>
                  <Text style={styles.exampleText}>{entry.example}</Text>
                </View>
              ) : null}
              {entry.onchain ? (
                <View style={styles.onchainBox}>
                  <Text style={styles.onchainLabel}>ON-CHAIN</Text>
                  <Text style={styles.onchainText}>{entry.onchain}</Text>
                </View>
              ) : null}
            </ScrollView>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Got it</Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end"
  },
  sheet: {
    backgroundColor: "#13131f",
    borderTopLeftRadius: radii.panel,
    borderTopRightRadius: radii.panel,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: darkPalette.glassBorder,
    padding: 24,
    paddingBottom: 36,
    maxHeight: "80%"
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginBottom: 20
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: darkPalette.dimWhite,
    marginBottom: 14
  },
  scroll: {
    maxHeight: 360
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: "rgba(224,219,208,0.85)",
    marginBottom: 16
  },
  exampleBox: {
    backgroundColor: "rgba(201,131,64,0.10)",
    borderLeftWidth: 3,
    borderLeftColor: darkPalette.glowBronze,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12
  },
  exampleLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: darkPalette.softGold,
    marginBottom: 6
  },
  exampleText: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(224,219,208,0.80)"
  },
  onchainBox: {
    backgroundColor: "rgba(48,71,58,0.30)",
    borderLeftWidth: 3,
    borderLeftColor: palette.pine,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16
  },
  onchainLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#7ab894",
    marginBottom: 6
  },
  onchainText: {
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(224,219,208,0.70)",
    fontFamily: "monospace"
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: darkPalette.activeGlow,
    borderWidth: 1,
    borderColor: darkPalette.glowBronze,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: "center"
  },
  closeText: {
    color: darkPalette.softGold,
    fontSize: 15,
    fontWeight: "700"
  }
});
