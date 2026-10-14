import { useEffect, useRef, useState, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { radius } from "@/constants/theme";
import { useT } from "@/i18n";
import { useTheme } from "@/store/useTheme";

export type ScanFeedback = { text: string; tone: "ok" | "warn" };

type Props = {
  visible: boolean;
  onClose: () => void;
  onScanned: (code: string) => void;
  /** Keep scanning after each code (checkout counter) instead of closing. */
  continuous?: boolean;
  /** Message shown after a scan, e.g. "✓ Coke 290ml ×2". */
  feedback?: ScanFeedback | null;
  /** Extra content at the bottom, e.g. the running cart total. */
  footer?: ReactNode;
};

/** The same code is ignored for this long, so one item isn't counted twice. */
const REPEAT_COOLDOWN_MS = 1500;

/** Full-screen camera that reports product barcodes. */
export default function BarcodeScanner({
  visible,
  onClose,
  onScanned,
  continuous = false,
  feedback,
  footer,
}: Props) {
  const t = useT();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  // Single-scan mode: the camera fires many times per second; only report once.
  const [done, setDone] = useState(false);
  const last = useRef({ code: "", time: 0 });

  useEffect(() => {
    if (visible) {
      setDone(false);
      last.current = { code: "", time: 0 };
    }
  }, [visible]);

  function handleScan(code: string) {
    if (continuous) {
      const now = Date.now();
      if (code === last.current.code && now - last.current.time < REPEAT_COOLDOWN_MS) return;
      last.current = { code, time: now };
    } else {
      setDone(true);
    }
    onScanned(code);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"],
            }}
            onBarcodeScanned={done ? undefined : ({ data }) => handleScan(data)}
          />
        ) : (
          <View style={styles.permission}>
            <Ionicons name="camera-outline" size={48} color="#fff" />
            <Text style={styles.permissionText}>
              {t("Kailangan ng camera para ma-scan ang barcode.")}
            </Text>
            <Pressable
              onPress={requestPermission}
              style={[styles.permissionBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.permissionBtnText}>{t("Payagan ang camera")}</Text>
            </Pressable>
          </View>
        )}

        {permission?.granted && (
          <View style={styles.frameWrap} pointerEvents="none">
            <View style={styles.frame} />
            <Text style={styles.hint}>
              {continuous
                ? t("Mag-scan nang sunod-sunod. Pindutin ang Tapos kapag kumpleto na.")
                : t("Itapat ang barcode sa loob ng kahon")}
            </Text>
          </View>
        )}

        <Pressable
          onPress={onClose}
          style={[styles.close, { top: insets.top + 16 }]}
          accessibilityLabel={t("Isara")}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>

        <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
          {feedback && (
            <View
              style={[
                styles.feedback,
                { backgroundColor: feedback.tone === "ok" ? "#16A34A" : "#EA580C" },
              ]}
            >
              <Ionicons
                name={feedback.tone === "ok" ? "checkmark-circle" : "alert-circle"}
                size={20}
                color="#fff"
              />
              <Text style={styles.feedbackText}>{feedback.text}</Text>
            </View>
          )}
          {footer}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  permission: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
  },
  permissionText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  permissionBtn: {
    borderRadius: radius.md,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  permissionBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  frameWrap: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  frame: {
    width: 260,
    height: 160,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: "#fff",
  },
  hint: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  close: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottom: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    gap: 10,
  },
  feedback: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackText: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
