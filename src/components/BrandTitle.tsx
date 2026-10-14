import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { BRAND } from "@/constants/theme";
import { useTheme } from "@/store/useTheme";

/** Logo + brand name for the top bar, with the current page underneath. */
export default function BrandTitle({ page }: { page: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.logo, { backgroundColor: colors.primary }]}>
        <Ionicons name="storefront" size={16} color="#fff" />
      </View>
      <View>
        <Text style={[styles.brand, { color: colors.text }]}>{BRAND}</Text>
        <Text style={[styles.page, { color: colors.muted }]}>{page}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  page: {
    fontSize: 12,
    fontWeight: "600",
  },
});
