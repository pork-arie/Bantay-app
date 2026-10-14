import { useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import BottomSheet from "@/components/BottomSheet";
import { colors, paymentStyles, peso, radius, shadow } from "@/constants/theme";
import { PAYMENT_LABELS, type PaymentMethod, type Period } from "@/data/sample";
import { success } from "@/store/haptics";
import {
  PERIOD_DAYS,
  formatDate,
  formatTime,
  isToday,
  salesInLastDays,
  summarize,
  trend,
} from "@/store/selectors";
import { useStore } from "@/store/StoreProvider";

const PERIODS: { key: Period; label: string; title: string }[] = [
  { key: "today", label: "Ngayon", title: "ngayong araw" },
  { key: "week", label: "Linggo", title: "nitong 7 araw" },
  { key: "month", label: "Buwan", title: "nitong 4 na linggo" },
];
const METHODS: PaymentMethod[] = ["cash", "gcash", "utang"];

export default function Reports() {
  const { sales, debtors, settings, closings, closeDay } = useStore();
  const [period, setPeriod] = useState<Period>("week");
  const [closingOpen, setClosingOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState("");
  const [counted, setCounted] = useState("");

  const report = summarize(salesInLastDays(sales, PERIOD_DAYS[period]));
  const periodTitle = PERIODS.find((p) => p.key === period)!.title;
  const margin = report.total > 0 ? (report.profit / report.total) * 100 : 0;
  const average = report.transactions > 0 ? report.total / report.transactions : 0;
  const chart = trend(sales, period);
  const maxTrend = Math.max(...chart.map((t) => t.total), 1);
  const best = chart.reduce((a, b) => (b.total > a.total ? b : a));
  const topProducts = report.topProducts.slice(0, 5);
  const maxRevenue = topProducts[0]?.revenue ?? 1;

  // Daily closing: what should be in the drawer and in GCash today.
  const today = summarize(sales.filter((s) => isToday(s.date)));
  const todayPayments = debtors
    .flatMap((d) => d.entries)
    .filter((e) => e.type === "bayad" && isToday(e.date));
  const utangPaidCash = todayPayments
    .filter((e) => e.method !== "gcash")
    .reduce((sum, e) => sum + e.amount, 0);
  const utangPaidGcash = todayPayments
    .filter((e) => e.method === "gcash")
    .reduce((sum, e) => sum + e.amount, 0);
  const expectedCash = (parseFloat(openingCash) || 0) + today.byPayment.cash + utangPaidCash;
  const expectedGcash = today.byPayment.gcash + utangPaidGcash;
  const countedAmount = parseFloat(counted);
  const difference = isNaN(countedAmount) ? null : countedAmount - expectedCash;
  const lastClosing = closings[0];

  function shareReport() {
    const lines = [
      `📊 ${settings.storeName || "Bantay"} Report — ${periodTitle}`,
      `Benta: ${peso(report.total)}`,
      `Tubo: ${peso(report.profit)} (${margin.toFixed(1)}%)`,
      `Transaksyon: ${report.transactions}`,
      ...METHODS.map((m) => `${PAYMENT_LABELS[m]}: ${peso(report.byPayment[m])}`),
      "",
      "Top products:",
      ...topProducts.slice(0, 3).map((t, i) => `${i + 1}. ${t.name} — ${t.qty} pcs`),
    ];
    Share.share({ message: lines.join("\n") });
  }

  function saveClosing() {
    if (difference === null) return;
    closeDay(expectedCash, countedAmount);
    success();
    setClosingOpen(false);
    setCounted("");
    setOpeningCash("");
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
        <Text style={styles.heroValue}>{peso(report.total)}</Text>
        <View style={styles.heroDivider} />
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroLabel}>Tubo (profit)</Text>
            <Text style={styles.heroProfit}>{peso(report.profit)}</Text>
          </View>
          <View style={styles.marginPill}>
            <Ionicons name="trending-up" size={14} color={colors.primary} />
            <Text style={styles.marginText}>{margin.toFixed(1)}% margin</Text>
          </View>
        </View>
      </View>

      {/* Daily closing */}
      <Pressable
        onPress={() => setClosingOpen(true)}
        style={({ pressed }) => [styles.closingCard, pressed && styles.pressed]}
      >
        <View style={[styles.closingIcon]}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.closingTitle}>Pagsara ng araw</Text>
          <Text style={styles.closingSub}>
            {lastClosing
              ? `Huling sara: ${formatDate(lastClosing.date)} ${formatTime(lastClosing.date)}`
              : "Bilangin ang kaha at i-check ang GCash"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>

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
          {best.total > 0 && (
            <Text style={styles.sectionSub}>Pinakamalakas: {best.label}</Text>
          )}
        </View>
        <View style={styles.chart}>
          {chart.map((t, i) => {
            const isBest = t === best && t.total > 0;
            return (
              <View key={i} style={styles.barColumn}>
                <Text style={[styles.barValue, isBest && { color: colors.primary }]}>
                  {t.total >= 1000 ? `${(t.total / 1000).toFixed(1)}k` : Math.round(t.total)}
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

      {/* Payment split */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Paraan ng bayad</Text>
        <View style={styles.splitBar}>
          {METHODS.map((m) =>
            report.byPayment[m] > 0 ? (
              <View
                key={m}
                style={{ flex: report.byPayment[m], backgroundColor: paymentStyles[m].fg }}
              />
            ) : null,
          )}
        </View>
        <View style={styles.legendRow}>
          {METHODS.map((m) => (
            <View key={m} style={styles.legend}>
              <View style={[styles.dot, { backgroundColor: paymentStyles[m].fg }]} />
              <View>
                <Text style={styles.legendLabel}>
                  {PAYMENT_LABELS[m]} ·{" "}
                  {report.total > 0 ? Math.round((report.byPayment[m] / report.total) * 100) : 0}%
                </Text>
                <Text style={styles.legendValue}>{peso(report.byPayment[m])}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Top products */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { marginBottom: 6 }]}>Pinakamabenta</Text>
        {topProducts.length === 0 && (
          <Text style={styles.sectionSub}>Wala pang benta sa panahong ito.</Text>
        )}
        {topProducts.map((t, i) => (
          <View key={t.productId} style={styles.topRow}>
            <View style={[styles.rank, i === 0 && { backgroundColor: colors.primary }]}>
              <Text style={[styles.rankText, i === 0 && { color: "#fff" }]}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.topHeader}>
                <Text style={styles.topName} numberOfLines={1}>
                  {t.name}
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

      {/* Daily closing sheet */}
      <BottomSheet
        visible={closingOpen}
        title="Pagsara ng araw"
        onClose={() => setClosingOpen(false)}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.closeRow}>
            <Text style={styles.closeLabel}>Cash na benta</Text>
            <Text style={styles.closeValue}>{peso(today.byPayment.cash)}</Text>
          </View>
          <View style={styles.closeRow}>
            <Text style={styles.closeLabel}>Bayad-utang (cash)</Text>
            <Text style={styles.closeValue}>{peso(utangPaidCash)}</Text>
          </View>

          <Text style={styles.label}>Panimulang pera sa kaha (optional)</Text>
          <TextInput
            value={openingCash}
            onChangeText={setOpeningCash}
            placeholder="₱0.00"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <View style={[styles.closeBox, { backgroundColor: colors.primarySoft }]}>
            <Text style={styles.closeLabel}>Dapat nasa kaha</Text>
            <Text style={[styles.closeBig, { color: colors.primary }]}>{peso(expectedCash)}</Text>
          </View>

          <Text style={styles.label}>Binilang na pera sa kaha</Text>
          <TextInput
            value={counted}
            onChangeText={setCounted}
            placeholder="₱0.00"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          {difference !== null && (
            <View
              style={[
                styles.closeBox,
                {
                  backgroundColor:
                    Math.abs(difference) < 0.01
                      ? colors.primarySoft
                      : difference < 0
                        ? colors.redSoft
                        : colors.orangeSoft,
                },
              ]}
            >
              <Text style={styles.closeLabel}>
                {Math.abs(difference) < 0.01
                  ? "Tama ang bilang! 🎉"
                  : difference < 0
                    ? "Kulang ang kaha"
                    : "Sobra ang kaha"}
              </Text>
              {Math.abs(difference) >= 0.01 && (
                <Text
                  style={[
                    styles.closeBig,
                    { color: difference < 0 ? colors.red : colors.orange },
                  ]}
                >
                  {peso(Math.abs(difference))}
                </Text>
              )}
            </View>
          )}

          <View style={[styles.closeBox, { backgroundColor: colors.gcashSoft }]}>
            <Text style={styles.closeLabel}>Dapat pumasok sa GCash ngayon</Text>
            <Text style={[styles.closeBig, { color: colors.gcash }]}>{peso(expectedGcash)}</Text>
            <Text style={styles.closeHint}>I-compare sa history ng GCash app.</Text>
          </View>

          <Pressable
            onPress={saveClosing}
            disabled={difference === null}
            style={({ pressed }) => [
              styles.primaryBtn,
              difference === null && { opacity: 0.4 },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryBtnText}>I-save ang pagsara</Text>
          </Pressable>
        </ScrollView>
      </BottomSheet>
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
  closingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    ...shadow,
  },
  closingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  closingTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  closingSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
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
    backgroundColor: colors.background,
  },
  legendRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 8,
  },
  legend: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
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
    fontSize: 14,
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
  closeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  closeLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  closeValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  closeBox: {
    borderRadius: radius.md,
    padding: 14,
    marginTop: 12,
  },
  closeBig: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
  },
  closeHint: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
