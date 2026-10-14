import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import BottomSheet from "@/components/BottomSheet";
import {
  avatarTints,
  initials,
  peso,
  radius,
  shadow,
  type Colors,
} from "@/constants/theme";
import { PAYMENT_KEYS, useT } from "@/i18n";
import {
  formatStock,
  formatTime,
  isLowStock,
  isToday,
  smartTip,
  summarize,
  totalUtang,
  trend,
} from "@/store/selectors";
import { useStore } from "@/store/StoreProvider";
import { useTheme } from "@/store/useTheme";

type StatCardProps = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
  styles: ReturnType<typeof createStyles>;
  onPress?: () => void;
};

function StatCard({ label, value, icon, color, tint, styles, onPress }: StatCardProps) {
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
  const t = useT();
  const { colors, pay } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { products, sales, debtors, settings, ready, updateSettings } = useStore();
  const [setupDismissed, setSetupDismissed] = useState(false);
  const [setup, setSetup] = useState({ storeName: "", ownerName: "", gcashNumber: "" });

  const todaySales = sales.filter((s) => isToday(s.date));
  const today = summarize(todaySales);
  const lowStockItems = products
    .filter(isLowStock)
    .sort((a, b) => a.stock / a.min - b.stock / b.min);
  const week = trend(sales, "week", settings.language);
  const maxSale = Math.max(...week.map((d) => d.total), 1);
  const weekTotal = week.reduce((sum, d) => sum + d.total, 0);
  const tip = smartTip(products, sales);

  const showSetup = ready && settings.ownerName === "" && !setupDismissed;

  function finishSetup() {
    updateSettings({
      storeName: setup.storeName.trim(),
      ownerName: setup.ownerName.trim() || t("Kaibigan"),
      gcashNumber: setup.gcashNumber.trim(),
    });
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.smalltext}>{settings.storeName || t("Magandang araw,")}</Text>
          <Text style={styles.bigtext}>
            {settings.ownerName ? t("Hi, {name}!", { name: settings.ownerName }) : t("Hi!")}
          </Text>
        </View>
        <Pressable
          onPress={() => router.navigate("/(tabs)/Benta")}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          accessibilityLabel={t("Bagong benta")}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      </View>

      {/* Smart tip */}
      <View style={styles.tip}>
        <View style={styles.tipIcon}>
          <Ionicons name="bulb-outline" size={18} color={colors.gcash} />
        </View>
        <Text style={styles.tipText}>{t(tip.key, tip.vars)}</Text>
      </View>

      {/* Stat cards */}
      <View style={styles.grid}>
        <View style={styles.row}>
          <StatCard
            styles={styles}
            label={t("Benta ngayon")}
            value={peso(today.total)}
            icon="cash-outline"
            color={colors.primary}
            tint={colors.primarySoft}
            onPress={() => router.navigate("/(tabs)/Reports")}
          />
          <StatCard
            styles={styles}
            label={t("Transaksyon")}
            value={String(today.transactions)}
            icon="receipt-outline"
            color={colors.blue}
            tint={colors.blueSoft}
            onPress={() => router.navigate("/(tabs)/Reports")}
          />
        </View>
        <View style={styles.row}>
          <StatCard
            styles={styles}
            label={t("Paubos na stock")}
            value={String(lowStockItems.length)}
            icon="alert-circle-outline"
            color={colors.orange}
            tint={colors.orangeSoft}
            onPress={() => router.navigate("/(tabs)/Inventory")}
          />
          <StatCard
            styles={styles}
            label={t("Kabuuang utang")}
            value={peso(totalUtang(debtors))}
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
            <Text style={styles.sectionTitle}>{t("Benta ngayong linggo")}</Text>
            <Text style={styles.sectionSub}>{peso(weekTotal)}</Text>
          </View>
          <Ionicons name="trending-up" size={22} color={colors.primary} />
        </View>

        <View style={styles.chart}>
          {week.map((d, i) => {
            const isLast = i === week.length - 1;
            return (
              <View key={i} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(d.total / maxSale) * 100}%`,
                        backgroundColor: isLast ? colors.primary : colors.primarySoft,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, isLast && styles.barLabelToday]}>
                  {d.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Running low */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.eyebrow}>{t("BANTAYAN")}</Text>
            <Text style={styles.sectionTitle}>{t("Paubos na")}</Text>
          </View>
          <Pressable
            onPress={() => router.navigate("/(tabs)/Inventory")}
            style={({ pressed }) => [styles.lowLink, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Text style={styles.lowLinkText}>{t("Tingnan lahat")}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.red} />
          </Pressable>
        </View>

        {lowStockItems.length === 0 ? (
          <Text style={styles.sectionSub}>{t("Sapat pa ang lahat ng stock.")}</Text>
        ) : (
          lowStockItems.slice(0, 3).map((p, i, list) => {
            const tint = avatarTints[i % avatarTints.length];
            return (
              <View
                key={p.id}
                style={[styles.txRow, i < list.length - 1 && styles.txDivider]}
              >
                <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
                  <Text style={[styles.avatarText, { color: tint.fg }]}>
                    {initials(p.name)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.txMeta}>{t(p.category)}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.lowCount}>{formatStock(p)}</Text>
                  <Text style={styles.txMeta}>
                    {t("min. {min}", { min: `${p.min} ${p.unit}` })}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Today's activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{t("Aktibidad ngayon")}</Text>
            <Text style={styles.sectionSub}>{t("Pinakabagong transaksyon")}</Text>
          </View>
          <Pressable
            onPress={() => router.navigate("/transactions")}
            style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
          >
            <Text style={styles.linkText}>{t("Tingnan lahat")}</Text>
          </Pressable>
        </View>

        {todaySales.length === 0 && (
          <Text style={styles.sectionSub}>{t("Wala pang benta ngayong araw.")}</Text>
        )}
        {todaySales.slice(0, 5).map((s, i, list) => {
          const style = pay[s.payment];
          const count = s.items.reduce((sum, it) => sum + it.qty, 0);
          return (
            <View key={s.id} style={[styles.txRow, i < list.length - 1 && styles.txDivider]}>
              <View style={[styles.txIcon, { backgroundColor: style.bg }]}>
                <Ionicons name={style.icon} size={18} color={style.fg} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txName}>{s.customerName ?? t("Walk-in")}</Text>
                <Text style={styles.txMeta}>
                  {t("{count} item", { count })} · {formatTime(s.date)}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.txTotal}>{peso(s.total)}</Text>
                <Text style={[styles.txBadge, { color: style.fg }]}>
                  {t(PAYMENT_KEYS[s.payment])}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* First-launch setup */}
      <BottomSheet
        visible={showSetup}
        title={t("Maligayang pagdating! 👋")}
        onClose={() => setSetupDismissed(true)}
      >
        <Text style={styles.setupIntro}>
          {t("Ilagay ang ilang detalye ng tindahan. Mababago mo ito sa Settings.")}
        </Text>
        <Text style={styles.label}>{t("Pangalan ng tindahan")}</Text>
        <TextInput
          value={setup.storeName}
          onChangeText={(storeName) => setSetup({ ...setup, storeName })}
          placeholder="hal. Tindahan ni Aling Rosa"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Text style={styles.label}>{t("Pangalan mo")}</Text>
        <TextInput
          value={setup.ownerName}
          onChangeText={(ownerName) => setSetup({ ...setup, ownerName })}
          placeholder="hal. Rosa"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Text style={styles.label}>{t("GCash number (optional)")}</Text>
        <TextInput
          value={setup.gcashNumber}
          onChangeText={(gcashNumber) => setSetup({ ...setup, gcashNumber })}
          placeholder="09XX XXX XXXX"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <Pressable
          onPress={finishSetup}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
        >
          <Text style={styles.primaryBtnText}>{t("Simulan")}</Text>
        </Pressable>
      </BottomSheet>
    </ScrollView>
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
    tip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.gcashSoft,
      borderRadius: radius.md,
      padding: 14,
    },
    tipIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    tipText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
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
    eyebrow: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.2,
      color: colors.muted,
      marginBottom: 4,
    },
    lowLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    lowLinkText: {
      color: colors.red,
      fontWeight: "600",
      fontSize: 14,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 13,
      fontWeight: "700",
    },
    lowCount: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.red,
    },
    txBadge: {
      fontSize: 12,
      fontWeight: "600",
      marginTop: 2,
    },
    setupIntro: {
      fontSize: 14,
      color: colors.muted,
      lineHeight: 20,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
      marginTop: 14,
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
