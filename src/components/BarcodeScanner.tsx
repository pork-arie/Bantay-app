import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { radius } from "@/constants/theme";
import { useT } from "@/i18n";

type Props = {
  visible: boolean;
  onClose: () => void;
  onScanned: (code: string) => void;
};

/** Full-screen camera that reports the first product barcode it sees. */
export default function BarcodeScanner({ visible, onClose, onScanned }: Props) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  // The camera fires many times per second; only report the first code.
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (visible) setDone(false);
  }, [visible]);

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
            onBarcodeScanned={
              done
                ? undefined
                : ({ data }) => {
                    setDone(true);
                    onScanned(data);
                  }
            }
          />
        ) : (
          <View style={styles.permission}>
            <Ionicons name="camera-outline" size={48} color="#fff" />
            <Text style={styles.permissionText}>
              {t("Kailangan ng camera para ma-scan ang barcode.")}
            </Text>
            <Pressable onPress={requestPermission} style={styles.permissionBtn}>
              <Text style={styles.permissionBtnText}>{t("Payagan ang camera")}</Text>
            </Pressable>
          </View>
        )}

        {permission?.granted && (
          <View style={styles.frameWrap} pointerEvents="none">
            <View style={styles.frame} />
            <Text style={styles.hint}>{t("Itapat ang barcode sa loob ng kahon")}</Text>
          </View>
        )}

        <Pressable
          onPress={onClose}
          style={[styles.close, { top: insets.top + 16 }]}
          accessibilityLabel={t("Isara")}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
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
    backgroundColor: "#16A34A",
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
});
