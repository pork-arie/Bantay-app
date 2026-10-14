import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, SectionList, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { PressableScale } from "@/components/motion";
import ReceiptSheet from "@/components/ReceiptSheet";
import { peso, radius, shadow, type Colors } from "@/constants/theme";
import type { PaymentMethod, Sale } from "@/data/sample";
import { PAYMENT_KEYS, useT, type TKey } from "@/i18n";
import { receiptLabel } from "@/lib/receipt";
import { formatDay, startOfDay } from "@/store/selectors";
import { useStore } from "@/store/StoreProvider";
import { useTheme } from "@/store/useTheme";

type Range = "today" | "yesterday" | "7" | "30" | "all";

const RANGES: { key: Range; label: TKey }[] = [
  { key: "today", label: "Ngayon" },
  { key: "yesterday", label: "Kahapon" },
  { key: "7", label: "7 araw" },
  { key: "30", label: "30 araw" },
  { key: "all", label: "Lahat" },
];
const PAYMENTS: (PaymentMethod | "all")[] = ["all", "cash", "gcash", "utang"];
const DAY_MS = 24 * 60 * 60 * 1000;

/** Chevron that turns to point down when its group is open. */
function Chevron({ open, color }: { open: boolean; color: string }) {
  const turn = useSharedValue(open ? 90 : 0);
  useEffect(() => {
    turn.value = withTiming(open ? 90 : 0, { duration: 200 });
  }, [open, turn]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));
  return (
    <Animated.View style={style}>
      <Ionicons name="chevron-forward" size={18} color={color} />
    </Animated.View>
  );
}

function inRange(sale: Sale, range: Range) {
  const t = new Date(sale.date).getTime();
  const today = startOfDay().getTime();
  switch (range) {
    case "today":
      return t >= today;
    case "yesterday":
      return t >= today - DAY_MS && t < today;
    case "7":
      return t >= today - 6 * DAY_MS;
    case "30":
      return t >= today - 29 * DAY_MS;
    default:
      return true;
  }
}

/** Every sale with its receipt number and exact time, for checking "did I pay?" questions. */
export default function TransactionsScreen() {
  const t = useT();
  const { colors, pay } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { sales, settings } = useStore();
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<Range>("7");
  const [payment, setPayment] = useState<PaymentMethod | "all">("all");
  const [open, setOpen] = useState<Sale | null>(null);
  // Days the user opened or closed; untouched days use the default (newest open).
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^#/, "");
    return sales.filter((s) => {
      if (!inRange(s, range)) return false;
      if (payment !== "all" && s.payment !== payment) return false;
      if (q === "") return true;
      return (
        receiptLabel(s).toLowerCase().includes(q) ||
        (s.customerName ?? "").toLowerCase().includes(q) ||
        (s.gcashRef ?? "").toLowerCase().includes(q) ||
        s.items.some((it) => it.name.toLowerCase().includes(q))
      );
    });
  }, [sales, search, range, payment]);

  // Group by day, newest first (sales are already sorted newest first).
  const groups = useMemo(() => {
    const groups: { title: string; total: number; data: Sale[] }[] = [];
    for (const s of filtered) {
      const title = formatDay(new Date(s.date), settings.language);
      const last = groups[groups.length - 1];
      const amount = s.voided ? 0 : s.total;
      if (last && last.title === title) {
        last.data.push(s);
        last.total += amount;
      } else {
        groups.push({ title, total: amount, data: [s] });
      }
    }
    return groups;
  }, [filtered, settings.language]);

  const searching = search.trim() !== "";
  const isOpen = (title: string, index: number) => searching || (toggled[title] ?? index === 0);
  // A closed day keeps its header but hides its rows, like a dropdown.
  const sections = groups.map((g, i) => ({
    ...g,
    count: g.data.length,
    open: isOpen(g.title, i),
    data: isOpen(g.title, i) ? g.data : [],
  }));

  const total = filtered.reduce((sum, s) => sum + (s.voided ? 0 : s.total), 0);

  const header = (
    <View style={{ gap: 12, marginBottom: 8 }}>
      <View>
        <Text style={styles.title}>{t("Mga transaksyon")}</Text>
        <Text style={styles.subtitle}>{t("Lahat ng benta na may oras at numero ng resibo")}</Text>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t("Resibo #, customer, produkto o GCash ref")}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
        {search !== "" && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {RANGES.map((r) => (
          <Pressable
            key={r.key}
            onPress={() => setRange(r.key)}
            style={[styles.chip, range === r.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, range === r.key && styles.chipTextActive]}>{t(r.label)}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {PAYMENTS.map((m) => {
          const active = payment === m;
          const fg = m === "all" ? colors.text : pay[m].fg;
          return (
            <Pressable
              key={m}
              onPress={() => setPayment(m)}
              style={[styles.chip, active && { backgroundColor: fg, borderColor: fg }]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {m === "all" ? t("Lahat ng bayad") : t(PAYMENT_KEYS[m])}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {t("{count} transaksyon", { count: filtered.length })}
        </Text>
        <Text style={styles.summaryTotal}>{peso(total)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <SectionList
        sections={sections}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        initialNumToRender={20}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={40} color={colors.border} />
            <Text style={styles.emptyText}>{t("Walang transaksyong tugma")}</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <PressableScale
            onPress={() => setToggled({ ...toggled, [section.title]: !section.open })}
            style={[styles.dayHeader, section.open && styles.dayHeaderOpen]}
            accessibilityRole="button"
            accessibilityState={{ expanded: section.open }}
          >
            <Chevron open={section.open} color={colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.dayTitle}>{section.title}</Text>
              <Text style={styles.dayCount}>{t("{count} transaksyon", { count: section.count })}</Text>
            </View>
            <Text style={styles.dayTotal}>{peso(section.total)}</Text>
          </PressableScale>
        )}
        renderItem={({ item }) => {
          const style = pay[item.payment];
          return (
            <Animated.View entering={FadeInDown.duration(220)} layout={LinearTransition}>
            <Pressable
              onPress={() => setOpen(item)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            >
              <View style={styles.time}>
                <Text style={styles.timeText}>
                  {new Date(item.date).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}
                </Text>
                <Text style={styles.receiptNo}>{receiptLabel(item)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.items} numberOfLines={2}>
                  {item.items.map((it) => `${it.qty} ${it.unitName} ${it.name}`).join(", ")}
                </Text>
                <View style={styles.tags}>
                  <View style={[styles.badge, { backgroundColor: style.bg }]}>
                    <Text style={[styles.badgeText, { color: style.fg }]}>{t(PAYMENT_KEYS[item.payment])}</Text>
                  </View>
                  {item.voided && (
                    <View style={[styles.badge, { backgroundColor: colors.redSoft }]}>
                      <Text style={[styles.badgeText, { color: colors.red }]}>{t("NA-VOID")}</Text>
                    </View>
                  )}
                  {item.customerName && <Text style={styles.customer}>{item.customerName}</Text>}
                </View>
              </View>
              <Text style={[styles.total, item.voided && styles.voidedTotal]}>{peso(item.total)}</Text>
            </Pressable>
            </Animated.View>
          );
        }}
      />

      <ReceiptSheet sale={open} onClose={() => setOpen(null)} />
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
    search: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      height: 46,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
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
    summary: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.dark,
      borderRadius: radius.md,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    summaryText: {
      color: "#D1D5DB",
      fontSize: 13,
    },
    summaryTotal: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "700",
    },
    dayHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginTop: 8,
    },
    dayHeaderOpen: {
      borderColor: colors.primary,
    },
    dayCount: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 1,
    },
    dayTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    dayTotal: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.muted,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: 12,
      ...shadow,
    },
    time: {
      width: 70,
    },
    timeText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    receiptNo: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 2,
    },
    items: {
      fontSize: 13,
      color: colors.text,
    },
    tags: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "700",
    },
    customer: {
      fontSize: 12,
      color: colors.muted,
    },
    total: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    voidedTotal: {
      textDecorationLine: "line-through",
      color: colors.muted,
    },
    empty: {
      alignItems: "center",
      paddingTop: 40,
      gap: 8,
    },
    emptyText: {
      color: colors.muted,
      fontSize: 14,
    },
  });
