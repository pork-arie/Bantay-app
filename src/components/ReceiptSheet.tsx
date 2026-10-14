import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import BottomSheet from "@/components/BottomSheet";
import { peso, radius, type Colors } from "@/constants/theme";
import type { Sale } from "@/data/sample";
import { PAYMENT_KEYS, useT, type TKey } from "@/i18n";
import { printReceipt, receiptDateTime, receiptLabel, shareReceipt } from "@/lib/receipt";
import { warning } from "@/store/haptics";
import { useStore } from "@/store/StoreProvider";
import { useTheme } from "@/store/useTheme";

type Props = {
  sale: Sale | null;
  onClose: () => void;
  /** Show the big check mark (right after checkout). */
  justSold?: boolean;
  /** Optional main button, e.g. "New sale". */
  primaryLabel?: string;
  onPrimary?: () => void;
};

const VOID_REASONS: TKey[] = ["Mali ang item o presyo", "Ibinalik ng customer", "Nadoble ang benta"];

/** A sale's full receipt with Print and Share buttons, and Void for mistakes. */
export default function ReceiptSheet({ sale: opened, onClose, justSold, primaryLabel, onPrimary }: Props) {
  const t = useT();
  const { colors, pay } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { settings, sales, can, voidSale } = useStore();
  const [busy, setBusy] = useState<"print" | "share" | null>(null);
  const [voiding, setVoiding] = useState(false);
  const [reason, setReason] = useState("");
  const [ownerPin, setOwnerPin] = useState("");
  // Read the live copy so the sheet updates right after a void.
  const sale = opened ? (sales.find((s) => s.id === opened.id) ?? opened) : null;
  // Staff need the owner's PIN to void; the owner (or a store without a PIN) does not.
  const needsPin = !can("voidSale");

  function close() {
    setVoiding(false);
    setReason("");
    setOwnerPin("");
    onClose();
  }

  function confirmVoid() {
    if (!sale) return;
    if (reason.trim() === "") {
      warning();
      Alert.alert(t("Kulang"), t("Ilagay kung bakit ivo-void."));
      return;
    }
    if (needsPin && ownerPin !== settings.ownerPin) {
      warning();
      Alert.alert(t("Mali ang PIN"), t("PIN ng may-ari ang kailangan para mag-void."));
      return;
    }
    voidSale(sale.id, reason.trim());
    setVoiding(false);
    setReason("");
    setOwnerPin("");
  }

  async function run(kind: "print" | "share") {
    if (!sale) return;
    setBusy(kind);
    try {
      if (kind === "print") await printReceipt(sale, settings, t);
      else await shareReceipt(sale, settings, t);
    } catch {
      Alert.alert(t("Hindi natuloy"), t("Hindi na-print o na-share ang resibo. Subukan ulit."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <BottomSheet
      visible={sale !== null}
      title={sale ? `${t("Resibo")} ${receiptLabel(sale)}` : ""}
      onClose={close}
    >
      {sale && (
        <ScrollView keyboardShouldPersistTaps="handled">
          {sale.voided && (
            <View style={styles.voidBanner}>
              <Text style={styles.voidTitle}>{t("NA-VOID")}</Text>
              <Text style={styles.voidText}>
                {sale.voided.reason} · {sale.voided.by} ·{" "}
                {new Date(sale.voided.date).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
              </Text>
            </View>
          )}
          {justSold && !sale.voided && (
            <View style={styles.check}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            </View>
          )}
          <View style={styles.paper}>
            <Text style={styles.store}>{settings.storeName || "Bantay Store"}</Text>
            <Text style={styles.meta}>{receiptDateTime(sale, settings)}</Text>
            <View style={[styles.payPill, { backgroundColor: pay[sale.payment].bg }]}>
              <Ionicons name={pay[sale.payment].icon} size={14} color={pay[sale.payment].fg} />
              <Text style={[styles.payText, { color: pay[sale.payment].fg }]}>
                {t(PAYMENT_KEYS[sale.payment])}
              </Text>
            </View>

            <View style={styles.divider} />
            {sale.items.map((it) => (
              <View key={`${it.productId}:${it.unit}`} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.item}>{it.name}</Text>
                  <Text style={styles.itemMeta}>
                    {it.qty} {it.unitName} × {peso(it.price)}
                  </Text>
                </View>
                <Text style={styles.item}>{peso(it.price * it.qty)}</Text>
              </View>
            ))}
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.total}>{t("Kabuuan")}</Text>
              <Text style={styles.total}>{peso(sale.total)}</Text>
            </View>
            {sale.cashReceived !== undefined && (
              <>
                <View style={styles.row}>
                  <Text style={styles.itemMeta}>{t("Natanggap")}</Text>
                  <Text style={styles.itemMeta}>{peso(sale.cashReceived)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.strong}>{t("Sukli")}</Text>
                  <Text style={[styles.strong, { color: colors.success }]}>
                    {peso(sale.cashReceived - sale.total)}
                  </Text>
                </View>
              </>
            )}
            {sale.gcashRef && (
              <View style={styles.row}>
                <Text style={styles.itemMeta}>GCash Ref</Text>
                <Text style={styles.strong}>{sale.gcashRef}</Text>
              </View>
            )}
            {sale.customerName && (
              <View style={styles.row}>
                <Text style={styles.itemMeta}>{t("Inilista kay")}</Text>
                <Text style={styles.strong}>{sale.customerName}</Text>
              </View>
            )}
            {sale.by && (
              <View style={styles.row}>
                <Text style={styles.itemMeta}>{t("Nagbenta")}</Text>
                <Text style={styles.itemMeta}>{sale.by}</Text>
              </View>
            )}
            <Text style={styles.disclaimer}>{t("Hindi ito opisyal na resibo (BIR).")}</Text>
          </View>

          <View style={styles.buttons}>
            <Pressable onPress={() => run("print")} disabled={busy !== null} style={styles.secondary}>
              {busy === "print" ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Ionicons name="print-outline" size={18} color={colors.text} />
              )}
              <Text style={styles.secondaryText}>{t("I-print")}</Text>
            </Pressable>
            <Pressable onPress={() => run("share")} disabled={busy !== null} style={styles.secondary}>
              {busy === "share" ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Ionicons name="share-outline" size={18} color={colors.text} />
              )}
              <Text style={styles.secondaryText}>{t("I-share")}</Text>
            </Pressable>
          </View>
          {primaryLabel && onPrimary && (
            <Pressable onPress={onPrimary} style={styles.primary}>
              <Text style={styles.primaryText}>{primaryLabel}</Text>
            </Pressable>
          )}

          {!sale.voided &&
            (voiding ? (
              <View style={styles.voidForm}>
                <Text style={styles.voidFormTitle}>{t("I-void ang benta")}</Text>
                <Text style={styles.itemMeta}>
                  {t("Ibabalik ang mga item sa stock at hindi na ito bibilangin sa benta.")}
                </Text>
                <View style={styles.reasons}>
                  {VOID_REASONS.map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => setReason(t(r))}
                      style={[styles.reasonChip, reason === t(r) && styles.reasonChipActive]}
                    >
                      <Text style={[styles.reasonText, reason === t(r) && { color: "#fff" }]}>{t(r)}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder={t("Dahilan")}
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
                {needsPin && (
                  <TextInput
                    value={ownerPin}
                    onChangeText={setOwnerPin}
                    placeholder={t("PIN ng may-ari")}
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={4}
                    style={[styles.input, { marginTop: 8 }]}
                  />
                )}
                <View style={styles.buttons}>
                  <Pressable onPress={() => setVoiding(false)} style={styles.secondary}>
                    <Text style={styles.secondaryText}>{t("Kanselahin")}</Text>
                  </Pressable>
                  <Pressable onPress={confirmVoid} style={[styles.secondary, styles.voidConfirm]}>
                    <Text style={[styles.secondaryText, { color: "#fff" }]}>{t("I-void")}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => setVoiding(true)} style={styles.voidLink}>
                <Ionicons name="close-circle-outline" size={16} color={colors.red} />
                <Text style={styles.voidLinkText}>{t("I-void ang benta")}</Text>
              </Pressable>
            ))}
        </ScrollView>
      )}
    </BottomSheet>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    voidBanner: {
      backgroundColor: colors.redSoft,
      borderRadius: radius.md,
      padding: 12,
      marginBottom: 10,
    },
    voidTitle: {
      color: colors.red,
      fontWeight: "800",
      letterSpacing: 1,
    },
    voidText: {
      color: colors.text,
      fontSize: 13,
      marginTop: 2,
    },
    disclaimer: {
      fontSize: 11,
      color: colors.muted,
      textAlign: "center",
      marginTop: 8,
    },
    voidLink: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 14,
    },
    voidLinkText: {
      color: colors.red,
      fontWeight: "600",
    },
    voidForm: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      marginTop: 14,
      paddingTop: 14,
      gap: 6,
    },
    voidFormTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.red,
    },
    reasons: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginVertical: 6,
    },
    reasonChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reasonChipActive: {
      backgroundColor: colors.red,
      borderColor: colors.red,
    },
    reasonText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
    },
    input: {
      height: 44,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      fontSize: 15,
      color: colors.text,
    },
    voidConfirm: {
      backgroundColor: colors.red,
      borderColor: colors.red,
    },
    check: {
      alignItems: "center",
      marginBottom: 8,
    },
    paper: {
      backgroundColor: colors.background,
      borderRadius: radius.md,
      padding: 16,
      gap: 6,
    },
    store: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },
    meta: {
      fontSize: 12,
      color: colors.muted,
      textAlign: "center",
    },
    itemMeta: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 1,
    },
    payPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "center",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 2,
    },
    payText: {
      fontSize: 12,
      fontWeight: "700",
    },
    divider: {
      borderTopWidth: 1,
      borderStyle: "dashed",
      borderTopColor: colors.border,
      marginVertical: 6,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    item: {
      fontSize: 14,
      color: colors.text,
    },
    total: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    strong: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    buttons: {
      flexDirection: "row",
      gap: 10,
      marginTop: 14,
    },
    secondary: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
    },
    secondaryText: {
      fontWeight: "700",
      color: colors.text,
    },
    primary: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 10,
      marginBottom: 6,
    },
    primaryText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
  });
