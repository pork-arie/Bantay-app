import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import BottomSheet from "@/components/BottomSheet";
import { GrowBar } from "@/components/motion";
import OwnerOnly from "@/components/OwnerOnly";
import { peso, radius, shadow, type Colors } from "@/constants/theme";
import type { Sale } from "@/data/sample";
import { PAYMENT_KEYS, useT } from "@/i18n";
import {
  dailyHistory,
  formatDay,
  formatTime,
  monthName,
  monthlyHistory,
  monthToDay,
  type MonthRef,
} from "@/store/selectors";
import { useStore } from "@/store/StoreProvider";
import { useTheme } from "@/store/useTheme";

type Day = ReturnType<typeof dailyHistory>[number];

export default function HistoryScreen() {
  const t = useT();
  const { colors, pay } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { sales, settings, can } = useStore();
  const lang = settings.language;

  const months = useMemo(() => monthlyHistory(sales, 6), [sales]);
  const [selected, setSelected] = useState<MonthRef>(months[months.length - 1].ref);
  const [openDay, setOpenDay] = useState<Day | null>(null);

  const index = months.findIndex(
    (m) => m.ref.year === selected.year && m.ref.month === selected.month,
  );
  const month = months[index];
  const previous = index > 0 ? months[index - 1] : null;
  // The current month isn't over, so compare it with the same days of last month.
  const isCurrent = index === months.length - 1;
  const today = new Date().getDate();
  const previousTotal = previous
    ? isCurrent
      ? monthToDay(sales, previous.ref, today).total
      : previous.total
    : 0;
  const change = previousTotal > 0 ? ((month.total - previousTotal) / previousTotal) * 100 : null;
  const comparedTo = previous
    ? isCurrent
      ? `${monthName(previous.ref, lang, true)} 1–${today}`
      : monthName(previous.ref, lang, true)
    : "";
  const days = useMemo(() => dailyHistory(sales, selected), [sales, selected]);
  const activeDays = days.filter((d) => d.transactions > 0);
  const bestDay = activeDays.reduce<Day | null>((a, b) => (!a || b.total > a.total ? b : a), null);
  const maxDay = Math.max(...days.map((d) => d.total), 1);
  const maxMonth = Math.max(...months.map((m) => m.total), 1);

  function header() {
    return (
      <View style={{ gap: 16, marginBottom: 6 }}>
        <View>
          <Text style={styles.title}>{t("Kasaysayan ng benta")}</Text>
          <Text style={styles.subtitle}>{t("Pumili ng buwan, tapos pindutin ang araw")}</Text>
        </View>

        {/* Month chart: tap a bar to pick the month */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Huling 6 na buwan")}</Text>
          <View style={styles.chart}>
            {months.map((m, i) => {
              const active = i === index;
              return (
                <Pressable key={i} style={styles.barColumn} onPress={() => setSelected(m.ref)}>
                  <Text style={[styles.barValue, active && { color: colors.primary }]}>
                    {m.total >= 1000 ? `${(m.total / 1000).toFixed(1)}k` : Math.round(m.total)}
                  </Text>
                  <View style={styles.barTrack}>
                    <GrowBar
                      percent={(m.total / maxMonth) * 100}
                      color={active ? colors.primary : colors.primarySoft}
                      delay={i * 60}
                      style={styles.bar}
                    />
                  </View>
                  <Text style={[styles.barLabel, active && styles.barLabelActive]}>
                    {monthName(m.ref, lang, true)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Month switcher + summary */}
        <View style={styles.hero}>
          <View style={styles.monthRow}>
            <Pressable
              onPress={() => index > 0 && setSelected(months[index - 1].ref)}
              disabled={index === 0}
              style={[styles.arrow, index === 0 && { opacity: 0.3 }]}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </Pressable>
            <Text style={styles.monthTitle}>{monthName(selected, lang)}</Text>
            <Pressable
              onPress={() => index < months.length - 1 && setSelected(months[index + 1].ref)}
              disabled={index === months.length - 1}
              style={[styles.arrow, index === months.length - 1 && { opacity: 0.3 }]}
              hitSlop={8}
            >
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </Pressable>
          </View>

          <Text style={styles.heroLabel}>{t("Kabuuang benta")}</Text>
          <Text style={styles.heroValue}>{peso(month.total)}</Text>
          {change !== null && (
            <View style={styles.changeRow}>
              <Ionicons
                name={change >= 0 ? "arrow-up" : "arrow-down"}
                size={14}
                color={change >= 0 ? "#4ADE80" : "#F87171"}
              />
              <Text style={[styles.changeText, { color: change >= 0 ? "#4ADE80" : "#F87171" }]}>
                {t("{pct}% kumpara sa {month}", {
                  pct: Math.abs(change).toFixed(1),
                  month: comparedTo,
                })}
              </Text>
            </View>
          )}

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>{t("Tubo")}</Text>
              <Text style={styles.heroStatValue}>{peso(month.profit)}</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>{t("Transaksyon")}</Text>
              <Text style={styles.heroStatValue}>{month.transactions}</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>{t("Average kada araw")}</Text>
              <Text style={styles.heroStatValue}>
                {peso(activeDays.length > 0 ? month.total / activeDays.length : 0)}
              </Text>
            </View>
          </View>
          {bestDay && (
            <Text style={styles.bestDay}>
              {t("Pinakamalakas na araw: {day} ({amount})", {
                day: formatDay(bestDay.date, lang),
                amount: peso(bestDay.total),
              })}
            </Text>
          )}
        </View>

        <Text style={styles.listTitle}>{t("Bawat araw")}</Text>
      </View>
    );
  }

  if (!can("viewProfit")) return <OwnerOnly />;

  return (
    <View style={styles.screen}>
      <FlatList
        data={days}
        keyExtractor={(d) => d.date.toISOString()}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header()}
        ListEmptyComponent={<Text style={styles.empty}>{t("Wala pang benta sa panahong ito.")}</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => item.transactions > 0 && setOpenDay(item)}
            style={({ pressed }) => [styles.dayRow, pressed && styles.pressed]}
          >
            <View style={styles.dayDate}>
              <Text style={styles.dayNum}>{item.date.getDate()}</Text>
              <Text style={styles.dayWeek}>{formatDay(item.date, lang).split(",")[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              {item.transactions > 0 ? (
                <>
                  <View style={styles.dayTop}>
                    <Text style={styles.dayTotal}>{peso(item.total)}</Text>
                    <Text style={styles.dayProfit}>
                      {t("Tubo")} {peso(item.profit)}
                    </Text>
                  </View>
                  <View style={styles.dayTrack}>
                    <View
                      style={[styles.dayFill, { width: `${(item.total / maxDay) * 100}%` }]}
                    />
                  </View>
                  <Text style={styles.dayMeta}>
                    {t("{count} transaksyon", { count: item.transactions })}
                  </Text>
                </>
              ) : (
                <Text style={styles.dayMeta}>{t("Walang benta")}</Text>
              )}
            </View>
            {item.transactions > 0 && (
              <Ionicons name="chevron-forward" size={18} color={colors.border} />
            )}
          </Pressable>
        )}
      />

      {/* One day's sales */}
      <BottomSheet
        visible={openDay !== null}
        title={openDay ? formatDay(openDay.date, lang) : ""}
        onClose={() => setOpenDay(null)}
      >
        {openDay && (
          <View>
            <View style={styles.sheetStats}>
              <View style={styles.sheetStat}>
                <Text style={styles.sheetStatLabel}>{t("Benta")}</Text>
                <Text style={styles.sheetStatValue}>{peso(openDay.total)}</Text>
              </View>
              <View style={styles.sheetStat}>
                <Text style={styles.sheetStatLabel}>{t("Tubo")}</Text>
                <Text style={[styles.sheetStatValue, { color: colors.success }]}>
                  {peso(openDay.profit)}
                </Text>
              </View>
            </View>
            <View style={styles.payRow}>
              {(["cash", "gcash", "utang"] as const).map((m) => (
                <View key={m} style={[styles.payPill, { backgroundColor: pay[m].bg }]}>
                  <Text style={[styles.payPillText, { color: pay[m].fg }]}>
                    {t(PAYMENT_KEYS[m])} {peso(openDay.byPayment[m])}
                  </Text>
                </View>
              ))}
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              {openDay.sales.map((s: Sale) => (
                <View key={s.id} style={styles.saleRow}>
                  <View style={[styles.saleIcon, { backgroundColor: pay[s.payment].bg }]}>
                    <Ionicons name={pay[s.payment].icon} size={16} color={pay[s.payment].fg} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.saleItems} numberOfLines={2}>
                      {s.items.map((it) => `${it.qty} ${it.unitName} ${it.name}`).join(", ")}
                    </Text>
                    <Text style={styles.dayMeta}>
                      {formatTime(s.date)}
                      {s.customerName ? ` · ${s.customerName}` : ""}
                    </Text>
                  </View>
                  <Text style={styles.saleTotal}>{peso(s.total)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
      gap: 8,
    },
    pressed: {
      opacity: 0.7,
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
    section: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: 20,
      ...shadow,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 14,
    },
    chart: {
      flexDirection: "row",
      alignItems: "flex-end",
      height: 150,
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
    barLabelActive: {
      color: colors.success,
      fontWeight: "700",
    },
    hero: {
      backgroundColor: colors.dark,
      borderRadius: radius.lg,
      padding: 20,
    },
    monthRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    arrow: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "rgba(255,255,255,0.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    monthTitle: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "700",
    },
    heroLabel: {
      color: "#9CA3AF",
      fontSize: 13,
    },
    heroValue: {
      color: "#fff",
      fontSize: 30,
      fontWeight: "700",
      marginTop: 4,
    },
    changeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
    },
    changeText: {
      fontSize: 13,
      fontWeight: "600",
    },
    heroStats: {
      flexDirection: "row",
      gap: 8,
      marginTop: 16,
    },
    heroStat: {
      flex: 1,
      backgroundColor: "rgba(255,255,255,0.08)",
      borderRadius: radius.sm,
      padding: 10,
    },
    heroStatLabel: {
      color: "#9CA3AF",
      fontSize: 11,
    },
    heroStatValue: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
      marginTop: 2,
    },
    bestDay: {
      color: "#D1D5DB",
      fontSize: 12,
      marginTop: 12,
    },
    listTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      marginTop: 4,
    },
    empty: {
      color: colors.muted,
      textAlign: "center",
      marginTop: 20,
    },
    dayRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: 14,
      ...shadow,
    },
    dayDate: {
      width: 44,
      alignItems: "center",
    },
    dayNum: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
    },
    dayWeek: {
      fontSize: 12,
      color: colors.muted,
    },
    dayTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
    },
    dayTotal: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    dayProfit: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    dayTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.background,
      marginTop: 8,
      overflow: "hidden",
    },
    dayFill: {
      height: "100%",
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    dayMeta: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 4,
    },
    sheetStats: {
      flexDirection: "row",
      gap: 10,
    },
    sheetStat: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: radius.md,
      padding: 12,
    },
    sheetStatLabel: {
      fontSize: 12,
      color: colors.muted,
    },
    sheetStatValue: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginTop: 2,
    },
    payRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginVertical: 12,
    },
    payPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    payPillText: {
      fontSize: 12,
      fontWeight: "700",
    },
    saleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    saleIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    saleItems: {
      fontSize: 14,
      color: colors.text,
    },
    saleTotal: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
  });
