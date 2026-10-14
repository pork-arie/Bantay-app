import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import BottomSheet from "@/components/BottomSheet";
import { avatarTints, initials, peso, radius, shadow, type Colors } from "@/constants/theme";
import type { Debtor } from "@/data/sample";
import { useT } from "@/i18n";
import { printUtangList } from "@/lib/receipt";
import { success, warning } from "@/store/haptics";
import { balanceOf, formatDate, totalUtang } from "@/store/selectors";
import { useStore } from "@/store/StoreProvider";
import { useTheme } from "@/store/useTheme";

type Filter = "Lahat" | "May utang" | "Bayad na";
type Action = "bayad" | "utang" | null;

const FILTERS: Filter[] = ["May utang", "Bayad na", "Lahat"];

export default function Utang() {
  const t = useT();
  const { colors, pay } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { debtors, settings, addDebtor, addLedgerEntry } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("May utang");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [action, setAction] = useState<Action>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<"cash" | "gcash">("cash");
  const [adding, setAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", amount: "", limit: "" });

  const selected = debtors.find((d) => d.id === selectedId) ?? null;
  const total = totalUtang(debtors);
  const withBalance = debtors.filter((d) => balanceOf(d) > 0).length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return debtors
      .filter((d) => {
        const bal = balanceOf(d);
        const matchesFilter =
          filter === "Lahat" || (filter === "May utang" ? bal > 0 : bal <= 0);
        return matchesFilter && (q === "" || d.name.toLowerCase().includes(q));
      })
      .sort((a, b) => balanceOf(b) - balanceOf(a));
  }, [debtors, search, filter]);

  function openDetail(d: Debtor) {
    setSelectedId(d.id);
    setAction(null);
    setAmount("");
    setNote("");
    setMethod("cash");
  }

  function saveAction(d: Debtor) {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      warning();
      Alert.alert(t("Kulang"), t("Ilagay ang halaga."));
      return;
    }
    if (action === "bayad" && value > balanceOf(d)) {
      warning();
      Alert.alert(t("Sobra"), t("Ang utang ni {name} ay {amount} lang.", { name: d.name, amount: peso(balanceOf(d)) }));
      return;
    }
    addLedgerEntry(d.id, {
      type: action!,
      amount: value,
      method: action === "bayad" ? method : undefined,
      note: note.trim() || undefined,
    });
    success();
    setAction(null);
    setAmount("");
    setNote("");
  }

  function remind(d: Debtor) {
    Share.share({
      message:
        t("Hi {name}! Paalala lang po sa inyong utang sa {store} na {amount}.", {
          name: d.name,
          store: settings.storeName || t("tindahan"),
          amount: peso(balanceOf(d)),
        }) +
        (settings.gcashNumber
          ? " " + t("Puwede rin pong magbayad sa GCash: {number}.", { number: settings.gcashNumber })
          : "") +
        " " +
        t("Salamat po! 🙏"),
    });
  }

  function saveCustomer() {
    const name = newCustomer.name.trim();
    if (name === "") {
      Alert.alert(t("Kulang"), t("Ilagay ang pangalan ng customer."));
      return;
    }
    addDebtor({
      name,
      phone: newCustomer.phone.trim() || undefined,
      limit: parseFloat(newCustomer.limit) || settings.defaultLimit,
      amount: parseFloat(newCustomer.amount) || 0,
    });
    success();
    setAdding(false);
    setNewCustomer({ name: "", phone: "", amount: "", limit: "" });
  }

  function renderItem({ item }: { item: Debtor }) {
    const bal = balanceOf(item);
    const tint = avatarTints[item.name.charCodeAt(0) % avatarTints.length];
    const last = item.entries[0];

    return (
      <Pressable
        onPress={() => openDetail(item)}
        style={({ pressed }) => [styles.item, pressed && styles.pressed]}
      >
        <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
          <Text style={[styles.avatarText, { color: tint.fg }]}>{initials(item.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemMeta}>
            {last
              ? `${last.type === "bayad" ? t("Huling bayad") : t("Huling utang")} · ${formatDate(last.date, settings.language)}`
              : t("Walang record")}
          </Text>
        </View>
        {bal > 0 ? (
          <Text style={styles.itemBalance}>{peso(bal)}</Text>
        ) : (
          <View style={styles.paidPill}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.paidText}>{t("Bayad na")}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.border} />
      </Pressable>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={visible}
        keyExtractor={(d) => d.id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 4 }}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{t("Utang")}</Text>
                <Text style={styles.subtitle}>{t("Listahan ng mga may utang")}</Text>
              </View>
              <Pressable
                onPress={() => printUtangList(debtors, settings, t).catch(() => {})}
                style={({ pressed }) => [styles.printBtn, pressed && styles.pressed]}
                accessibilityLabel={t("I-print ang listahan ng utang")}
              >
                <Ionicons name="print-outline" size={20} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Ionicons name="wallet-outline" size={22} color="#fff" />
              </View>
              <Text style={styles.heroLabel}>{t("Kabuuang utang")}</Text>
              <Text style={styles.heroValue}>{peso(total)}</Text>
              <Text style={styles.heroSub}>
                {t("{count} customer ang may balanse pa", { count: withBalance })}
              </Text>
            </View>

            <View style={styles.search}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t("Hanapin ang customer...")}
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
              />
            </View>

            <View style={styles.segment}>
              {FILTERS.map((f) => {
                const active = f === filter;
                return (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[styles.segmentBtn, active && styles.segmentActive]}
                  >
                    <Text style={[styles.segmentText, active && { color: "#fff" }]}>{t(f)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="happy-outline" size={40} color={colors.border} />
            <Text style={styles.emptyText}>{t("Walang customer dito")}</Text>
          </View>
        }
      />

      <Pressable
        onPress={() => setAdding(true)}
        style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
        accessibilityLabel={t("Magdagdag ng customer")}
      >
        <Ionicons name="person-add" size={22} color="#fff" />
      </Pressable>

      {/* Customer detail */}
      <BottomSheet
        visible={selected !== null}
        title={selected?.name ?? ""}
        onClose={() => setSelectedId(null)}
      >
        {selected && (
          <View>
            {selected.phone && (
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={14} color={colors.muted} />
                <Text style={styles.itemMeta}>{selected.phone}</Text>
              </View>
            )}
            <View style={styles.balanceBox}>
              <Text style={styles.balanceLabel}>{t("Natitirang balanse")}</Text>
              <Text
                style={[
                  styles.balanceValue,
                  balanceOf(selected) <= 0 && { color: colors.success },
                ]}
              >
                {peso(balanceOf(selected))}
              </Text>
              <View style={styles.limitTrack}>
                <View
                  style={[
                    styles.limitFill,
                    {
                      width: `${Math.min(Math.max(balanceOf(selected) / selected.limit, 0), 1) * 100}%`,
                      backgroundColor:
                        balanceOf(selected) > selected.limit ? colors.red : colors.orange,
                    },
                  ]}
                />
              </View>
              <Text style={styles.limitText}>
                {balanceOf(selected) > selected.limit
                  ? t("Lampas na sa limit na {limit}", { limit: peso(selected.limit) })
                  : t("Limit: {limit}", { limit: peso(selected.limit) })}
              </Text>
            </View>

            {action === null ? (
              <View style={styles.actions}>
                <Pressable
                  onPress={() => setAction("bayad")}
                  disabled={balanceOf(selected) <= 0}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.success },
                    balanceOf(selected) <= 0 && { opacity: 0.4 },
                  ]}
                >
                  <Ionicons name="cash-outline" size={18} color="#fff" />
                  <Text style={[styles.actionText, { color: "#fff" }]}>{t("Bayad")}</Text>
                </Pressable>
                <Pressable
                  onPress={() => setAction("utang")}
                  style={[styles.actionBtn, { backgroundColor: colors.orangeSoft }]}
                >
                  <Ionicons name="add-circle-outline" size={18} color={colors.orange} />
                  <Text style={[styles.actionText, { color: colors.orange }]}>{t("Utang")}</Text>
                </Pressable>
                <Pressable
                  onPress={() => remind(selected)}
                  disabled={balanceOf(selected) <= 0}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.blueSoft },
                    balanceOf(selected) <= 0 && { opacity: 0.4 },
                  ]}
                >
                  <Ionicons name="paper-plane-outline" size={18} color={colors.blue} />
                  <Text style={[styles.actionText, { color: colors.blue }]}>{t("Paalala")}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.actionForm}>
                <Text style={styles.label}>
                  {action === "bayad" ? t("Halaga ng bayad") : t("Halaga ng dagdag na utang")}
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="₱0.00"
                  placeholderTextColor={colors.muted}
                  keyboardType="decimal-pad"
                  autoFocus
                  style={styles.input}
                />
                {action === "bayad" ? (
                  <View>
                    <Pressable
                      onPress={() => setAmount(String(balanceOf(selected)))}
                      style={styles.fullPay}
                    >
                      <Text style={styles.fullPayText}>
                        {t("Bayad lahat ({amount})", { amount: peso(balanceOf(selected)) })}
                      </Text>
                    </Pressable>
                    <Text style={styles.label}>{t("Paano nagbayad?")}</Text>
                    <View style={styles.methodRow}>
                      {(["cash", "gcash"] as const).map((m) => {
                        const active = method === m;
                        const style = pay[m];
                        return (
                          <Pressable
                            key={m}
                            onPress={() => setMethod(m)}
                            style={[
                              styles.methodBtn,
                              active && { backgroundColor: style.fg, borderColor: style.fg },
                            ]}
                          >
                            <Ionicons
                              name={style.icon}
                              size={16}
                              color={active ? "#fff" : style.fg}
                            />
                            <Text
                              style={[styles.methodText, { color: active ? "#fff" : colors.text }]}
                            >
                              {m === "cash" ? "Cash" : "GCash"}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder={t("Note (hal. 2 kilong bigas)")}
                    placeholderTextColor={colors.muted}
                    style={[styles.input, { marginTop: 10 }]}
                  />
                )}
                <View style={styles.formButtons}>
                  <Pressable onPress={() => setAction(null)} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>{t("Kanselahin")}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => saveAction(selected)}
                    style={[
                      styles.saveBtn,
                      action === "utang" && { backgroundColor: colors.orange },
                    ]}
                  >
                    <Text style={styles.saveText}>{t("I-save")}</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <Text style={styles.label}>{t("Kasaysayan")}</Text>
            <ScrollView style={{ maxHeight: 220 }}>
              {selected.entries.map((e, i) => {
                const isPay = e.type !== "utang";
                const isVoid = e.type === "void";
                return (
                  <View
                    key={e.id}
                    style={[
                      styles.entry,
                      i < selected.entries.length - 1 && styles.entryDivider,
                    ]}
                  >
                    <View
                      style={[
                        styles.entryIcon,
                        { backgroundColor: isPay ? colors.successSoft : colors.orangeSoft },
                      ]}
                    >
                      <Ionicons
                        name={isPay ? "arrow-down" : "arrow-up"}
                        size={14}
                        color={isPay ? colors.success : colors.orange}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryTitle}>
                        {isVoid
                          ? t("Na-void na benta")
                          : isPay
                            ? `${t("Bayad")}${e.method === "gcash" ? " · GCash" : ""}`
                            : t("Utang")}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {formatDate(e.date, settings.language)}
                        {e.note ? ` · ${e.note}` : ""}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.entryAmount,
                        { color: isPay ? colors.success : colors.text },
                      ]}
                    >
                      {isPay ? "−" : "+"}
                      {peso(e.amount)}
                    </Text>
                  </View>
                );
              })}
              {selected.entries.length === 0 && (
                <Text style={styles.emptyText}>{t("Wala pang record.")}</Text>
              )}
            </ScrollView>
          </View>
        )}
      </BottomSheet>

      {/* New customer */}
      <BottomSheet visible={adding} title={t("Bagong customer")} onClose={() => setAdding(false)}>
        <Text style={styles.label}>{t("Pangalan")}</Text>
        <TextInput
          value={newCustomer.name}
          onChangeText={(name) => setNewCustomer({ ...newCustomer, name })}
          placeholder="hal. Aling Rosa"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Text style={styles.label}>{t("Cellphone (optional)")}</Text>
        <TextInput
          value={newCustomer.phone}
          onChangeText={(phone) => setNewCustomer({ ...newCustomer, phone })}
          placeholder="09XX XXX XXXX"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <View style={styles.formRowFields}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t("Unang utang")}</Text>
            <TextInput
              value={newCustomer.amount}
              onChangeText={(amount) => setNewCustomer({ ...newCustomer, amount })}
              placeholder="₱0.00"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t("Credit limit")}</Text>
            <TextInput
              value={newCustomer.limit}
              onChangeText={(limit) => setNewCustomer({ ...newCustomer, limit })}
              placeholder={String(settings.defaultLimit)}
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
        </View>
        <Pressable
          onPress={saveCustomer}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
        >
          <Text style={styles.saveText}>{t("Idagdag ang customer")}</Text>
        </Pressable>
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
    paddingBottom: 100,
    gap: 10,
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  printBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    backgroundColor: colors.dark,
    borderRadius: radius.lg,
    padding: 20,
    ...shadow,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(248,113,113,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },
  heroValue: {
    color: "#FCA5A5",
    fontSize: 30,
    fontWeight: "700",
    marginTop: 2,
  },
  heroSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 6,
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
    fontSize: 15,
    color: colors.text,
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
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    ...shadow,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  itemBalance: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.red,
  },
  paidPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "600",
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -6,
    marginBottom: 12,
  },
  balanceBox: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: 16,
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.red,
    marginTop: 4,
  },
  limitTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: 12,
    overflow: "hidden",
  },
  limitFill: {
    height: "100%",
    borderRadius: 3,
  },
  limitText: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 6,
  },
  methodRow: {
    flexDirection: "row",
    gap: 8,
  },
  methodBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodText: {
    fontWeight: "700",
    fontSize: 14,
  },
  formRowFields: {
    flexDirection: "row",
    gap: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
  },
  actionForm: {
    marginTop: 2,
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
  fullPay: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  fullPayText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },
  formButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  cancelText: {
    fontWeight: "600",
    color: colors.muted,
  },
  saveBtn: {
    flex: 2,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  saveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  entryDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  entryIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  entryAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
});
