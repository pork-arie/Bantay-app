import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import BottomSheet from "@/components/BottomSheet";
import { peso, radius, shadow, type Colors } from "@/constants/theme";
import { saleItem, type SellUnit } from "@/data/sample";
import { useT } from "@/i18n";
import { forecast, weekdayName } from "@/store/selectors";
import { useStore } from "@/store/StoreProvider";
import { useTheme } from "@/store/useTheme";

/** Sales/profit forecast plus a "how much will I earn if I sell..." calculator. */
export default function ForecastCard() {
  const t = useT();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { sales, products, settings } = useStore();
  const f = useMemo(() => forecast(sales), [sales]);

  const [calcOpen, setCalcOpen] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [unit, setUnit] = useState<SellUnit>("tingi");
  const [qty, setQty] = useState("10");

  const product = products.find((p) => p.id === productId) ?? products[0];
  const sellUnit: SellUnit = unit === "pack" && product?.pack ? "pack" : "tingi";
  const quantity = Math.max(parseInt(qty, 10) || 0, 0);
  const item = product ? saleItem(product, sellUnit, quantity) : null;
  const revenue = item ? item.price * quantity : 0;
  const cost = item ? item.cost * quantity : 0;
  const profit = revenue - cost;
  const maxQty = product ? Math.floor(product.stock / (item?.pieces ?? 1)) : 0;

  // If every piece currently in stock were sold tingi.
  const allStock = products.reduce(
    (acc, p) => ({ revenue: acc.revenue + p.price * p.stock, profit: acc.profit + (p.price - p.cost) * p.stock }),
    { revenue: 0, profit: 0 },
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Ionicons name="sparkles-outline" size={18} color={colors.gcash} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("Hula ng kita")}</Text>
          <Text style={styles.sub}>{t("Batay sa benta nitong nakaraang 4 na linggo")}</Text>
        </View>
      </View>

      {f.hasData ? (
        <>
          <View style={styles.row}>
            <View style={styles.box}>
              <Text style={styles.boxLabel}>{t("Susunod na 7 araw")}</Text>
              <Text style={styles.boxValue}>{peso(f.next7.sales)}</Text>
              <Text style={styles.boxProfit}>
                {t("Tubo")} ~{peso(f.next7.profit)}
              </Text>
            </View>
            <View style={styles.box}>
              <Text style={styles.boxLabel}>{t("Susunod na 30 araw")}</Text>
              <Text style={styles.boxValue}>{peso(f.next30.sales)}</Text>
              <Text style={styles.boxProfit}>
                {t("Tubo")} ~{peso(f.next30.profit)}
              </Text>
            </View>
          </View>

          <View style={styles.monthBox}>
            <Text style={styles.boxLabel}>{t("Tantiyang benta ngayong buwan")}</Text>
            <Text style={styles.monthValue}>{peso(f.month.sales)}</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(f.month.soFar / Math.max(f.month.sales, 1), 1) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.sub}>
              {t("{soFar} na ang nabenta · tubo ~{profit}", {
                soFar: peso(f.month.soFar),
                profit: peso(f.month.profit),
              })}
            </Text>
          </View>

          <View style={styles.insights}>
            {f.trendPct !== null && (
              <View style={styles.insight}>
                <Ionicons
                  name={f.trendPct >= 0 ? "trending-up" : "trending-down"}
                  size={16}
                  color={f.trendPct >= 0 ? colors.success : colors.red}
                />
                <Text style={styles.insightText}>
                  {f.trendPct >= 0
                    ? t("Tumaas ng {pct}% ang benta nitong 2 linggo.", { pct: f.trendPct.toFixed(1) })
                    : t("Bumaba ng {pct}% ang benta nitong 2 linggo.", {
                        pct: Math.abs(f.trendPct).toFixed(1),
                      })}
                </Text>
              </View>
            )}
            <View style={styles.insight}>
              <Ionicons name="calendar-outline" size={16} color={colors.orange} />
              <Text style={styles.insightText}>
                {t("Pinakamalakas tuwing {day} (~{amount}). Siguraduhing puno ang stock.", {
                  day: weekdayName(f.bestDay, settings.language),
                  amount: peso(f.weekdayAvg[f.bestDay]),
                })}
              </Text>
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.sub}>{t("Kailangan ng ilang araw ng benta para makagawa ng hula.")}</Text>
      )}

      <Pressable
        onPress={() => setCalcOpen(true)}
        style={({ pressed }) => [styles.calcBtn, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name="calculator-outline" size={18} color="#fff" />
        <Text style={styles.calcBtnText}>{t("Kalkulador ng kita")}</Text>
      </Pressable>

      {/* Calculator */}
      <BottomSheet
        visible={calcOpen}
        title={t("Kalkulador ng kita")}
        onClose={() => setCalcOpen(false)}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t("Kung mabenta ko ang...")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {products.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setProductId(p.id)}
                style={[styles.chip, p.id === product?.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, p.id === product?.id && { color: "#fff" }]}>{p.name}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {product?.pack && (
            <View style={styles.unitRow}>
              {(["tingi", "pack"] as const).map((u) => (
                <Pressable
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[styles.unitBtn, sellUnit === u && styles.unitBtnActive]}
                >
                  <Text style={[styles.unitText, sellUnit === u && { color: "#fff" }]}>
                    {u === "tingi" ? `${t("Tingi")} (${product.unit})` : product.pack!.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.label}>{t("Ilan?")}</Text>
          <View style={styles.qtyRow}>
            <Pressable
              onPress={() => setQty(String(Math.max(quantity - 1, 0)))}
              style={styles.stepBtn}
            >
              <Ionicons name="remove" size={18} color={colors.text} />
            </Pressable>
            <TextInput
              value={qty}
              onChangeText={setQty}
              keyboardType="number-pad"
              style={styles.qtyInput}
            />
            <Pressable onPress={() => setQty(String(quantity + 1))} style={styles.stepBtn}>
              <Ionicons name="add" size={18} color={colors.text} />
            </Pressable>
            <Pressable onPress={() => setQty(String(maxQty))} style={styles.allBtn}>
              <Text style={styles.allText}>{t("Lahat ng stock ({count})", { count: maxQty })}</Text>
            </Pressable>
          </View>

          <View style={styles.resultBox}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("Benta")}</Text>
              <Text style={styles.resultValue}>{peso(revenue)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("Puhunan")}</Text>
              <Text style={styles.resultValue}>− {peso(cost)}</Text>
            </View>
            <View style={[styles.resultRow, styles.resultTotal]}>
              <Text style={styles.resultBig}>{t("Kikitain mo")}</Text>
              <Text style={[styles.resultBig, { color: colors.success }]}>{peso(profit)}</Text>
            </View>
            {revenue > 0 && (
              <Text style={styles.sub}>
                {t("{pct}% ng benta ay tubo", { pct: ((profit / revenue) * 100).toFixed(1) })}
              </Text>
            )}
          </View>

          <View style={styles.allStock}>
            <Ionicons name="cube-outline" size={18} color={colors.gcash} />
            <Text style={styles.insightText}>
              {t("Kung maubos ang lahat ng paninda mo ngayon: benta {revenue}, tubo {profit}.", {
                revenue: peso(allStock.revenue),
                profit: peso(allStock.profit),
              })}
            </Text>
          </View>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    section: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: 20,
      gap: 12,
      ...shadow,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.gcashSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
    },
    sub: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    row: {
      flexDirection: "row",
      gap: 10,
    },
    box: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: radius.md,
      padding: 14,
    },
    boxLabel: {
      fontSize: 12,
      color: colors.muted,
    },
    boxValue: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginTop: 4,
    },
    boxProfit: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.success,
      marginTop: 2,
    },
    monthBox: {
      backgroundColor: colors.background,
      borderRadius: radius.md,
      padding: 14,
    },
    monthValue: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      marginTop: 4,
    },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      marginTop: 10,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    insights: {
      gap: 8,
    },
    insight: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    insightText: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
    },
    calcBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.gcash,
      borderRadius: radius.md,
      paddingVertical: 14,
    },
    calcBtnText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 15,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
      marginTop: 14,
      marginBottom: 8,
    },
    chips: {
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.dark,
      borderColor: colors.dark,
    },
    chipText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
    },
    unitRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
    },
    unitBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: radius.sm,
      backgroundColor: colors.background,
    },
    unitBtnActive: {
      backgroundColor: colors.primary,
    },
    unitText: {
      fontWeight: "700",
      color: colors.text,
    },
    qtyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    stepBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    qtyInput: {
      width: 70,
      height: 42,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      textAlign: "center",
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    allBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 11,
      borderRadius: radius.sm,
      backgroundColor: colors.primarySoft,
    },
    allText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    resultBox: {
      backgroundColor: colors.background,
      borderRadius: radius.md,
      padding: 16,
      marginTop: 16,
      gap: 6,
    },
    resultRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    resultLabel: {
      fontSize: 14,
      color: colors.muted,
    },
    resultValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    resultTotal: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: 10,
      marginTop: 4,
    },
    resultBig: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    allStock: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      backgroundColor: colors.gcashSoft,
      borderRadius: radius.md,
      padding: 12,
      marginTop: 12,
      marginBottom: 8,
    },
  });
