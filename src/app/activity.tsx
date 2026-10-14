import { useMemo, useState } from "react";
import { Pressable, ScrollView, SectionList, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import OwnerOnly from "@/components/OwnerOnly";
import { radius, type Colors } from "@/constants/theme";
import type { ActivityEntry, ActivityKind } from "@/data/sample";
import { useT, type TKey } from "@/i18n";
import { formatDay } from "@/store/selectors";
import { useStore } from "@/store/StoreProvider";
import { useTheme } from "@/store/useTheme";

const KIND_INFO: Record<ActivityKind, { label: TKey; icon: keyof typeof Ionicons.glyphMap }> = {
  sale: { label: "Benta", icon: "cart-outline" },
  void: { label: "Na-void", icon: "close-circle-outline" },
  restock: { label: "Restock", icon: "cube-outline" },
  product: { label: "Produkto", icon: "pricetag-outline" },
  utang: { label: "Utang", icon: "time-outline" },
  bayad: { label: "Bayad", icon: "cash-outline" },
  closing: { label: "Pagsara ng araw", icon: "lock-closed-outline" },
  backup: { label: "Backup", icon: "cloud-upload-outline" },
  restore: { label: "Restore", icon: "cloud-download-outline" },
  settings: { label: "Settings", icon: "settings-outline" },
  login: { label: "Pag-login", icon: "person-outline" },
  wipe: { label: "Binura ang data", icon: "trash-outline" },
};

type Filter = "all" | "void" | "sale" | "stock" | "money" | "login";
const FILTERS: { key: Filter; label: TKey; kinds?: ActivityKind[] }[] = [
  { key: "all", label: "Lahat" },
  { key: "void", label: "Na-void", kinds: ["void"] },
  { key: "sale", label: "Benta", kinds: ["sale"] },
  { key: "stock", label: "Stock", kinds: ["restock", "product"] },
  { key: "money", label: "Utang", kinds: ["utang", "bayad", "closing"] },
  { key: "login", label: "Pag-login", kinds: ["login", "settings", "backup", "restore", "wipe"] },
];

/** Who did what and when: the owner's view of everything that happened in the app. */
export default function ActivityScreen() {
  const t = useT();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { activity, settings, can } = useStore();
  const [filter, setFilter] = useState<Filter>("all");

  const sections = useMemo(() => {
    const kinds = FILTERS.find((f) => f.key === filter)?.kinds;
    const groups: { title: string; data: ActivityEntry[] }[] = [];
    for (const entry of activity) {
      if (kinds && !kinds.includes(entry.kind)) continue;
      const title = formatDay(new Date(entry.date), settings.language);
      const last = groups[groups.length - 1];
      if (last && last.title === title) last.data.push(entry);
      else groups.push({ title, data: [entry] });
    }
    return groups;
  }, [activity, filter, settings.language]);

  if (!can("activity")) return <OwnerOnly />;

  return (
    <View style={styles.screen}>
      <SectionList
        sections={sections}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.content}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 6 }}>
            <View>
              <Text style={styles.title}>{t("Activity log")}</Text>
              <Text style={styles.subtitle}>{t("Sino ang gumawa ng ano, at kailan")}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {FILTERS.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={[styles.chip, filter === f.key && styles.chipActive]}
                >
                  <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{t(f.label)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{t("Wala pang naitalang aktibidad.")}</Text>}
        renderSectionHeader={({ section }) => <Text style={styles.day}>{section.title}</Text>}
        renderItem={({ item }) => {
          const info = KIND_INFO[item.kind];
          const isVoid = item.kind === "void";
          return (
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: isVoid ? colors.redSoft : colors.background }]}>
                <Ionicons name={info.icon} size={16} color={isVoid ? colors.red : colors.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>
                  {t(info.label)}
                  {item.text ? <Text style={styles.text}> · {item.text}</Text> : null}
                </Text>
                <Text style={styles.meta}>
                  {item.who} ·{" "}
                  {new Date(item.date).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}
                </Text>
              </View>
            </View>
          );
        }}
      />
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
    chips: {
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
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
    chipTextActive: {
      color: "#fff",
    },
    day: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.muted,
      marginTop: 16,
      marginBottom: 4,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: radius.md,
      marginTop: 6,
    },
    icon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    text: {
      fontWeight: "400",
      color: colors.text,
    },
    meta: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    empty: {
      color: colors.muted,
      textAlign: "center",
      marginTop: 24,
    },
  });
