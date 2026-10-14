import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useT } from "@/i18n";
import { useTheme } from "@/store/useTheme";

/** Shown instead of owner-only screens when a staff member is logged in. */
export default function OwnerOnly() {
  const t = useT();
  const { colors } = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Ionicons name="lock-closed-outline" size={40} color={colors.muted} />
      <Text style={[styles.title, { color: colors.text }]}>{t("Para sa owner lang")}</Text>
      <Text style={[styles.text, { color: colors.muted }]}>
        {t("Hilingin sa may-ari na buksan ito gamit ang kanyang PIN.")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  text: {
    fontSize: 14,
    textAlign: "center",
  },
});
