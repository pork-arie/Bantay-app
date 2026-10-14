import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, peso, radius, shadow } from "../constants/theme";
import {
  LOW_STOCK_LIMIT,
  PRODUCTS,
  TOTAL_UTANG,
  TRANSACTIONS,
  WEEKLY_SALES,
} from "@/data/sample";

type StatCardProps = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
  onPress?: () => void;
};

function StatCard({ label, value, icon, color, tint, onPress }: StatCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.cardIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </Pressable>
  );
}

export default function Index() {
  const router = useRouter();

  const todaySales = TRANSACTIONS.reduce((sum, t) => sum + t.total, 0);
  const lowStock = PRODUCTS.filter((p) => p.stock <= LOW_STOCK_LIMIT).length;
  const maxSale = Math.max(...WEEKLY_SALES.map((d) => d.total));
  const weekTotal = WEEKLY_SALES.reduce((sum, d) => sum + d.total, 0);
  const todayIndex = WEEKLY_SALES.length - 1;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.smalltext}>Magandang araw,</Text>
          <Text style={styles.bigtext}>Name san User ddi</Text>
        </View>
        <Pressable
          onPress={() => router.navigate("/(tabs)/Benta")}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          accessibilityLabel="Bagong benta"
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      </View>

      {/* Stat cards */}
      <View style={styles.grid}>
        <View style={styles.row}>
          <StatCard
            label="Benta ngayon"
            value={peso(todaySales)}
            icon="cash-outline"
            color={colors.primary}
            tint={colors.primarySoft}
            onPress={() => router.navigate("/(tabs)/Benta")}
          />
          <StatCard
            label="Transaksyon"
            value={String(TRANSACTIONS.length)}
            icon="receipt-outline"
            color={colors.blue}
            tint={colors.blueSoft}
            onPress={() => router.navigate("/(tabs)/Reports")}
          />
        </View>
        <View style={styles.row}>
          <StatCard
            label="Paubos na stock"
            value={String(lowStock)}
            icon="alert-circle-outline"
            color={colors.orange}
            tint={colors.orangeSoft}
            onPress={() => router.navigate("/(tabs)/Inventory")}
          />
          <StatCard
            label="Kabuuang utang"
            value={peso(TOTAL_UTANG)}
            icon="people-outline"
            color={colors.red}
            tint={colors.redSoft}
            onPress={() => router.navigate("/(tabs)/Utang")}
          />
        </View>
      </View>

      {/* Weekly sales graph */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Benta ngayong linggo</Text>
            <Text style={styles.sectionSub}>{peso(weekTotal)}</Text>
          </View>
          <Ionicons name="trending-up" size={22} color={colors.primary} />
        </View>

        <View style={styles.chart}>
          {WEEKLY_SALES.map((d, i) => {
            const isToday = i === todayIndex;
            return (
              <View key={d.day} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(d.total / maxSale) * 100}%`,
                        backgroundColor: isToday ? colors.primary : colors.primarySoft,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                  {d.day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Today's activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Aktibidad ngayon</Text>
            <Text style={styles.sectionSub}>Pinakabagong transaksyon</Text>
          </View>
          <Pressable
            onPress={() => router.navigate("/tabs/Reports")}
            style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
          >
            <Text style={styles.linkText}>View all</Text>
          </Pressable>
        </View>

        {TRANSACTIONS.map((t, i) => {
          const isUtang = t.type === "utang";
          return (
            <View
              key={t.id}
              style={[styles.txRow, i < TRANSACTIONS.length - 1 && styles.txDivider]}
            >
              <View
                style={[
                  styles.txIcon,
                  { backgroundColor: isUtang ? colors.orangeSoft : colors.primarySoft },
                ]}
              >
                <Ionicons
                  name={isUtang ? "time-outline" : "checkmark"}
                  size={18}
                  color={isUtang ? colors.orange : colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txName}>{t.customer}</Text>
                <Text style={styles.txMeta}>
                  {t.items} item{t.items > 1 ? "s" : ""} · {t.time}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.txTotal}>{peso(t.total)}</Text>
                <Text
                  style={[styles.txBadge, { color: isUtang ? colors.orange : colors.primary }]}
                >
                  {isUtang ? "Utang" : "Cash"}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  smalltext: {
    fontSize: 15,
    color: colors.muted,
  },
  bigtext: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  grid: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    ...shadow,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  cardLabel: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    ...shadow,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  sectionSub: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 160,
    gap: 10,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    height: "100%",
  },
  barTrack: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 8,
    minHeight: 6,
  },
  barLabel: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 8,
  },
  barLabelToday: {
    color: colors.primary,
    fontWeight: "700",
  },
  linkButton: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  linkText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  txDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  txName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  txMeta: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  txTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  txBadge: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
});