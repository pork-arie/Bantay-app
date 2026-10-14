import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import BottomSheet from "@/components/BottomSheet";
import { peso, radius, type Colors } from "@/constants/theme";
import type { Sale } from "@/data/sample";
import { PAYMENT_KEYS, useT } from "@/i18n";
import { printReceipt, receiptDateTime, receiptLabel, shareReceipt } from "@/lib/receipt";
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

/** A sale's full receipt with Print and Share buttons. */
export default function ReceiptSheet({ sale, onClose, justSold, primaryLabel, onPrimary }: Props) {
  const t = useT();
  const { colors, pay } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { settings } = useStore();
  const [busy, setBusy] = useState<"print" | "share" | null>(null);

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
      onClose={onClose}
    >
      {sale && (
        <ScrollView>
          {justSold && (
            <View style={styles.check}>
              <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
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
                  <Text style={[styles.strong, { color: colors.primary }]}>
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
        </ScrollView>
      )}
    </BottomSheet>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
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
