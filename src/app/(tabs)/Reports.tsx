import { useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, peso, radius, shadow } from "@/constants/theme";
import { PRODUCTS, REPORTS, type Period } from "@/data/sample";

const PERIODS: { key: Period; label: string; title: string }[] = [
  { key: "today", label: "Ngayon", title: "ngayong araw" },
  { key: "week", label: "Linggo", title: "ngayong linggo" },
  { key: "month", label: "Buwan", title: "ngayong buwan" },
];

export default function Reports() {
  const [period, setPeriod] = useState<Period>("week");
  const report = REPORTS[period];
  const periodTitle = PERIODS.find((p) => p.key === period)!.title;

  const profit = report.sales - report.cost;
  const margin = report.sales > 0 ? (profit / report.sales) * 100 : 0;
  const average = report.transactions > 0 ? report.sales / report.transactions : 0;
  const cashShare = report.sales > 0 ? report.cash / report.sales : 0;
  const maxTrend = Math.max(...report.trend.map((t) => t.total));
  const best = report.trend.reduce((a, b) => (b.total > a.total ? b : a));

  const topProducts = report.topProducts
    .map(({ id, qty }) => {
      const product = PRODUCTS.find((p) => p.id === id)!;
      return { product, qty, revenue: product.price * qty };
    })
    .sort((a, b) => b.revenue - a.revenue);
  const maxRevenue = topProducts[0]?.revenue ?? 1;

  function shareReport() {
    const lines = [
      `📊 Bantay Report — ${periodTitle}`,
      `Benta: ${peso(report.sales)}`,
      `Tubo: ${peso(profit)} (${margin.toFixed(1)}%)`,
      `Transaksyon: ${report.transactions}`,
      `Cash: ${peso(report.cash)} · Utang: ${peso(report.utang)}`,
      "",
      "Top products:",
      ...topProducts.slice(0, 3).map((t, i) => `${i + 1}. ${t.product.name} — ${t.qty} pcs`),
    ];
    Share.share({ message: lines.join("\n") });
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>Takbo ng tindahan {periodTitle}</Text>
        </View>
        <Pressable
          onPress={shareReport}
          style={({ pressed }) => [styles.shareBtn, pressed && styles.pressed]}
          accessibilityLabel="I-share ang report"
        >
          <Ionicons name="share-outline" size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* Period switch */}
      <View style={styles.segment}>
        {PERIODS.map((p) => {
          const active = p.key === period;
          return (
            <Pressable
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={[styles.segmentBtn, active && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, active && { color: "#fff" }]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Hero: sales + profit */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Kabuuang benta</Text>
        <Text style={styles.heroValue}>{peso(report.sales)}</Text>
        <View style={styles.heroDivider} />
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroLabel}>Tubo (profit)</Text>
            <Text style={styles.heroProfit}>{peso(profit)}</Text>
          </View>
          <View style={styles.marginPill}>
            <Ionicons name="trending-up" size={14} color={colors.primary} />
            <Text style={styles.marginText}>{margin.toFixed(1)}% margin</Text>
          </View>
        </View>
      </View>

      {/* KPIs */}
      <View style={styles.kpiRow}>
        <View style={styles.kpi}>
          <Ionicons name="receipt-outline" size={18} color={colors.blue} />
          <Text style={styles.kpiValue}>{report.transactions}</Text>
          <Text style={styles.kpiLabel}>Transaksyon</Text>
        </View>
        <View style={styles.kpi}>
          <Ionicons name="basket-outline" size={18} color={colors.orange} />
          <Text style={styles.kpiValue}>{peso(average)}</Text>
          <Text style={styles.kpiLabel}>Average kada benta</Text>
        </View>
      </View>

      {/* Trend */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Takbo ng benta</Text>
          <Text style={styles.sectionSub}>Pinakamalakas: {best.label}</Text>
        </View>
        <View style={styles.chart}>
          {report.trend.map((t) => {
            const isBest = t === best;
            return (
              <View key={t.label} style={styles.barColumn}>
                <Text style={[styles.barValue, isBest && { color: colors.primary }]}>
                  {t.total >= 1000 ? `${(t.total / 1000).toFixed(1)}k` : t.total}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(t.total / maxTrend) * 100}%`,
                        backgroundColor: isBest ? colors.primary : colors.primarySoft,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{t.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Cash vs utang */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Paraan ng bayad</Text>
        <View style={styles.splitBar}>
          <View style={{ flex: cashShare, backgroundColor: colors.primary }} />
          <View style={{ flex: 1 - cashShare, backgroundColor: colors.orange }} />
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legend}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <View>
              <Text style={styles.legendLabel}>Cash · {Math.round(cashShare * 100)}%</Text>
              <Text style={styles.legendValue}>{peso(report.cash)}</Text>
            </View>
          </View>
          <View style={styles.legend}>
            <View style={[styles.dot, { backgroundColor: colors.orange }]} />
            <View>
              <Text style={styles.legendLabel}>
                Utang · {Math.round((1 - cashShare) * 100)}%
              </Text>
              <Text style={styles.legendValue}>{peso(report.utang)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Top products */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { marginBottom: 6 }]}>Pinakamabenta</Text>
        {topProducts.map((t, i) => (
          <View key={t.product.id} style={styles.topRow}>
            <View style={[styles.rank, i === 0 && { backgroundColor: colors.primary }]}>
              <Text style={[styles.rankText, i === 0 && { color: "#fff" }]}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.topHeader}>
                <Text style={styles.topName} numberOfLines={1}>
                  {t.product.name}
                </Text>
                <Text style={styles.topRevenue}>{peso(t.revenue)}</Text>
              </View>
              <View style={styles.topTrack}>
                <View
                  style={[styles.topFill, { width: `${(t.revenue / maxRevenue) * 100}%` }]}
                />
              </View>
              <Text style={styles.topQty}>{t.qty} pcs nabenta</Text>
            </View>
          </View>
        ))}
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
    gap: 16,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: colors.dark,
  },
  segmentText: {
    fontWeight: "600",
    fontSize: 13,
    color: colors.muted,
  },
  hero: {
    backgroundColor: colors.dark,
    borderRadius: radius.lg,
    padding: 20,
  },
  heroLabel: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  heroValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
    marginTop: 4,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 16,
  },
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroProfit: {
    color: "#4ADE80",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },
  marginPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  marginText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 12,
  },
  kpi: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    gap: 6,
    ...shadow,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  kpiLabel: {
    fontSize: 12,
    color: colors.muted,
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
    fontSize: 12,
    color: colors.muted,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 180,
    gap: 10,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    height: "100%",
  },
  barValue: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
    marginBottom: 4,
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
  splitBar: {
    flexDirection: "row",
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
    gap: 3,
  },
  legendRow: {
    flexDirection: "row",
    marginTop: 14,
  },
  legend: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  legendValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  topRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontWeight: "700",
    color: colors.muted,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  topName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  topRevenue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  topTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background,
    marginTop: 8,
    overflow: "hidden",
  },
  topFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  topQty: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
});
