import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import BottomSheet from "@/components/BottomSheet";
import { FadeIn, GrowBar, PressableScale, useCountUp } from "@/components/motion";
import {
  avatarTints,
  initials,
  peso,
  radius,
  shadow,
  type Colors,
} from "@/constants/theme";
import { LANGUAGES, PAYMENT_KEYS, useT } from "@/i18n";
import { daysSinceBackup } from "@/lib/backup";
import { notify } from "@/lib/confirm";
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
    <PressableScale onPress={onPress} disabled={!onPress} style={styles.card}>
      <View style={[styles.cardIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </PressableScale>
  );
}

export default function Index() {
  const router = useRouter();
  const t = useT();
  const { colors, pay } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    products,
    sales,
    debtors,
    settings,
    ready,
    updateSettings,
    meta,
    activity,
    acceptTerms,
    startFresh,
    can,
    session,
    storageError,
  } = useStore();
  const isOwner = can("settings");
  // Staff don't see profit or inventory, so their cards open the transaction list instead.
  const salesLink = can("viewProfit") ? "/(tabs)/Reports" : "/transactions";
  const [setupDismissed, setSetupDismissed] = useState(false);
  const [setup, setSetup] = useState({ storeName: "", ownerName: "", gcashNumber: "" });
  const [agreed, setAgreed] = useState(false);
  const [withSample, setWithSample] = useState(true);

  // Coming back from reading the Terms/Privacy pages: show the setup again.
  useFocusEffect(
    useCallback(() => {
      setSetupDismissed(false);
    }, []),
  );

  const todaySales = sales.filter((s) => !s.voided && isToday(s.date));
  const today = summarize(todaySales);
  const lowStockItems = products
    .filter(isLowStock)
    .sort((a, b) => a.stock / a.min - b.stock / b.min);
  const week = trend(sales, "week", settings.language);
  const maxSale = Math.max(...week.map((d) => d.total), 1);
  const weekTotal = week.reduce((sum, d) => sum + d.total, 0);
  const tip = smartTip(products, sales);
  const salesShown = useCountUp(today.total);
  const utangShown = useCountUp(totalUtang(debtors));

  const showSetup =
    ready && isOwner && (settings.ownerName === "" || !meta.acceptedTermsAt) && !setupDismissed;
  // Only nag about backups once the store is really being used.
  const backupDays = daysSinceBackup(meta.lastBackupAt);
  const showBackupReminder =
    can("backup") && activity.some((a) => a.kind === "sale") && (backupDays === null || backupDays >= 7);

  function finishSetup() {
    if (!agreed) {
      notify(t("Kailangan ang pagsang-ayon"), t("Basahin at sang-ayunan ang Terms of Use at Privacy Policy para magpatuloy."));
      return;
    }
    updateSettings({
      storeName: setup.storeName.trim() || settings.storeName,
      ownerName: setup.ownerName.trim() || settings.ownerName || t("Kaibigan"),
      gcashNumber: setup.gcashNumber.trim() || settings.gcashNumber,
    });
    acceptTerms();
    if (!withSample) startFresh();
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
            {session?.name ? t("Hi, {name}!", { name: session.name }) : t("Hi!")}
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
      <FadeIn index={1} style={styles.tip}>
        <View style={styles.tipIcon}>
          <Ionicons name="bulb-outline" size={18} color={colors.gcash} />
        </View>
        <Text style={styles.tipText}>{t(tip.key, tip.vars)}</Text>
      </FadeIn>

      {storageError && (
        <Pressable onPress={() => router.navigate("/settings")} style={styles.errorCard}>
          <Ionicons name="alert-circle" size={20} color={colors.red} />
          <View style={{ flex: 1 }}>
            <Text style={styles.backupTitle}>{t("Hindi mabasa ang naka-save na data")}</Text>
            <Text style={styles.backupText}>
              {t("Hindi namin ito binura. I-restore mula sa backup sa Settings.")}
            </Text>
          </View>
        </Pressable>
      )}

      {showBackupReminder && (
        <Pressable
          onPress={() => router.navigate("/settings")}
          style={({ pressed }) => [styles.backupCard, pressed && styles.pressed]}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={colors.orange} />
          <View style={{ flex: 1 }}>
            <Text style={styles.backupTitle}>
              {backupDays === null
                ? t("Hindi ka pa nagba-backup")
                : t("{days} araw na mula sa huling backup", { days: backupDays })}
            </Text>
            <Text style={styles.backupText}>{t("I-backup para hindi mawala ang data kung masira o mawala ang phone.")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      )}

      {/* Stat cards */}
      <FadeIn index={2} style={styles.grid}>
        <View style={styles.row}>
          <StatCard
            styles={styles}
            label={t("Benta ngayon")}
            value={peso(salesShown)}
            icon="cash-outline"
            color={colors.primary}
            tint={colors.primarySoft}
            onPress={() => router.navigate(salesLink)}
          />
          <StatCard
            styles={styles}
            label={t("Transaksyon")}
            value={String(today.transactions)}
            icon="receipt-outline"
            color={colors.blue}
            tint={colors.blueSoft}
            onPress={() => router.navigate(salesLink)}
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
            onPress={can("inventory") ? () => router.navigate("/(tabs)/Inventory") : undefined}
          />
          <StatCard
            styles={styles}
            label={t("Kabuuang utang")}
            value={peso(utangShown)}
            icon="people-outline"
            color={colors.red}
            tint={colors.redSoft}
            onPress={() => router.navigate("/(tabs)/Utang")}
          />
        </View>
      </FadeIn>

      {/* Weekly sales graph */}
      <FadeIn index={3} style={styles.section}>
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
                  <GrowBar
                    percent={(d.total / maxSale) * 100}
                    color={isLast ? colors.primary : colors.primarySoft}
                    delay={i * 50}
                    style={styles.bar}
                  />
                </View>
                <Text style={[styles.barLabel, isLast && styles.barLabelToday]}>
                  {d.label}
                </Text>
              </View>
            );
          })}
        </View>
      </FadeIn>

      {/* Running low */}
      <FadeIn index={4} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.eyebrow}>{t("BANTAYAN")}</Text>
            <Text style={styles.sectionTitle}>{t("Paubos na")}</Text>
          </View>
          {can("inventory") && (
            <Pressable
              onPress={() => router.navigate("/(tabs)/Inventory")}
              style={({ pressed }) => [styles.lowLink, pressed && styles.pressed]}
              hitSlop={8}
            >
              <Text style={styles.lowLinkText}>{t("Tingnan lahat")}</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.red} />
            </Pressable>
          )}
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
      </FadeIn>

      {/* Today's activity */}
      <FadeIn index={5} style={styles.section}>
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
      </FadeIn>

      {/* First-launch setup */}
      <BottomSheet
        visible={showSetup}
        title={t("Maligayang pagdating! 👋")}
        onClose={() => setSetupDismissed(true)}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.langRow}>
            {LANGUAGES.map((lang) => {
              const active = settings.language === lang.key;
              return (
                <Pressable
                  key={lang.key}
                  onPress={() => updateSettings({ language: lang.key })}
                  style={[styles.langChip, active && styles.langChipActive]}
                >
                  <Text style={[styles.langText, active && styles.langTextActive]}>{lang.label}</Text>
                </Pressable>
              );
            })}
          </View>
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

          <Text style={styles.label}>{t("Paano magsisimula?")}</Text>
          <View style={styles.choiceRow}>
            {[
              { key: true, label: t("May sample data"), hint: t("Para masubukan muna") },
              { key: false, label: t("Walang laman"), hint: t("Para sa totoong tindahan") },
            ].map((c) => (
              <Pressable
                key={String(c.key)}
                onPress={() => setWithSample(c.key)}
                style={[styles.choice, withSample === c.key && styles.choiceActive]}
              >
                <Text style={[styles.choiceTitle, withSample === c.key && { color: colors.primary }]}>{c.label}</Text>
                <Text style={styles.choiceHint}>{c.hint}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={() => setAgreed(!agreed)} style={styles.agreeRow}>
            <Ionicons
              name={agreed ? "checkbox" : "square-outline"}
              size={22}
              color={agreed ? colors.primary : colors.muted}
            />
            <Text style={styles.agreeText}>
              {t("Nabasa ko at sumasang-ayon ako sa")}{" "}
              <Text
                style={styles.link}
                onPress={() => {
                  setSetupDismissed(true);
                  router.navigate({ pathname: "/legal", params: { doc: "terms" } });
                }}
              >
                Terms of Use
              </Text>{" "}
              {t("at")}{" "}
              <Text
                style={styles.link}
                onPress={() => {
                  setSetupDismissed(true);
                  router.navigate({ pathname: "/legal", params: { doc: "privacy" } });
                }}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </Pressable>

          <Pressable
            onPress={finishSetup}
            style={({ pressed }) => [styles.primaryBtn, !agreed && { opacity: 0.5 }, pressed && styles.pressed]}
          >
            <Text style={styles.primaryBtnText}>{t("Simulan")}</Text>
          </Pressable>
        </ScrollView>
      </BottomSheet>
    </ScrollView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    langRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 14,
    },
    langChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
    },
    langChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    langText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    langTextActive: {
      color: "#fff",
    },
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
    backupCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.orangeSoft,
      borderRadius: radius.md,
      padding: 14,
    },
    errorCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.redSoft,
      borderRadius: radius.md,
      padding: 14,
    },
    backupTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    backupText: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    choiceRow: {
      flexDirection: "row",
      gap: 10,
    },
    choice: {
      flex: 1,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      padding: 12,
    },
    choiceActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    choiceTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    choiceHint: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    agreeRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginTop: 18,
    },
    agreeText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      color: colors.text,
    },
    link: {
      color: colors.primary,
      fontWeight: "700",
      textDecorationLine: "underline",
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
