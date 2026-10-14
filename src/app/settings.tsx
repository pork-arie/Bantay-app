import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { BRAND, initials, radius, shadow, type Colors } from "@/constants/theme";
import type { Language, ThemeMode } from "@/data/sample";
import { useT, type TKey } from "@/i18n";
import { success, tap } from "@/store/haptics";
import { useStore } from "@/store/StoreProvider";
import { useTheme } from "@/store/useTheme";

const THEMES: { key: ThemeMode; label: TKey; icon: "phone-portrait-outline" | "sunny-outline" | "moon-outline" }[] = [
  { key: "system", label: "Sundan ang phone", icon: "phone-portrait-outline" },
  { key: "light", label: "Maliwanag", icon: "sunny-outline" },
  { key: "dark", label: "Madilim", icon: "moon-outline" },
];
const LANGUAGES: { key: Language; label: string }[] = [
  { key: "fil", label: "Filipino" },
  { key: "en", label: "English" },
];

export default function SettingsScreen() {
  const t = useT();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { settings, updateSettings, resetData, ready } = useStore();

  const formFromSettings = () => ({
    ownerName: settings.ownerName,
    ownerPhone: settings.ownerPhone,
    storeName: settings.storeName,
    storeAddress: settings.storeAddress,
    gcashNumber: settings.gcashNumber,
    defaultLimit: String(settings.defaultLimit),
  });
  const [form, setForm] = useState(formFromSettings);

  // Saved settings load asynchronously; refill the form once they arrive.
  useEffect(() => {
    if (ready) setForm(formFromSettings());
  }, [ready, settings]);

  function save() {
    updateSettings({
      ownerName: form.ownerName.trim(),
      ownerPhone: form.ownerPhone.trim(),
      storeName: form.storeName.trim(),
      storeAddress: form.storeAddress.trim(),
      gcashNumber: form.gcashNumber.trim(),
      defaultLimit: parseFloat(form.defaultLimit) || 0,
    });
    success();
    Alert.alert(t("Na-save"), t("Nai-save ang settings."));
  }

  function confirmReset() {
    Alert.alert(
      t("I-reset ang data?"),
      t("Mabubura ang lahat ng benta, utang at produkto at babalik sa sample data."),
      [
        { text: t("Kanselahin"), style: "cancel" },
        { text: t("I-reset"), style: "destructive", onPress: resetData },
      ],
    );
  }

  function field(
    key: keyof typeof form,
    label: TKey,
    placeholder: string,
    keyboardType: "default" | "phone-pad" | "decimal-pad" = "default",
  ) {
    return (
      <>
        <Text style={styles.label}>{t(label)}</Text>
        <TextInput
          value={form[key]}
          onChangeText={(value) => setForm({ ...form, [key]: value })}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
          style={styles.input}
        />
      </>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Profile */}
      <View style={styles.card}>
        <View style={styles.profileTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(form.ownerName || BRAND)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{t("Profile")}</Text>
            <Text style={styles.hint}>{t("Lalabas ito sa resibo at sa mga paalala.")}</Text>
          </View>
        </View>
        {field("ownerName", "Pangalan mo", "hal. Rosa")}
        {field("ownerPhone", "Cellphone mo", "09XX XXX XXXX", "phone-pad")}
        {field("storeName", "Pangalan ng tindahan", "hal. Tindahan ni Aling Rosa")}
        {field("storeAddress", "Address ng tindahan", "hal. Brgy. 5, Tacloban City")}
      </View>

      {/* GCash */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: colors.gcashSoft }]}>
            <Ionicons name="phone-portrait-outline" size={16} color={colors.gcash} />
          </View>
          <Text style={styles.cardTitle}>GCash</Text>
        </View>
        {field("gcashNumber", "GCash number ng tindahan", "09XX XXX XXXX", "phone-pad")}
        <Text style={styles.hint}>
          {t("Ipinapakita ito sa customer kapag GCash ang bayad sa Benta.")}
        </Text>
      </View>

      {/* Utang */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("Utang")}</Text>
        {field("defaultLimit", "Default na credit limit", "2000", "decimal-pad")}
        <Text style={styles.hint}>
          {t("Ginagamit para sa bagong customer. Magbababala ang Benta kapag lalampas dito.")}
        </Text>
      </View>

      <Pressable
        onPress={save}
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
      >
        <Text style={styles.primaryBtnText}>{t("I-save")}</Text>
      </Pressable>

      {/* Appearance: applies right away, no save needed */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("Itsura")}</Text>
        <Text style={styles.label}>{t("Tema")}</Text>
        <View style={styles.segment}>
          {THEMES.map((th) => {
            const active = settings.themeMode === th.key;
            return (
              <Pressable
                key={th.key}
                onPress={() => {
                  tap();
                  updateSettings({ themeMode: th.key });
                }}
                style={[styles.segmentBtn, active && styles.segmentActive]}
              >
                <Ionicons name={th.icon} size={16} color={active ? "#fff" : colors.muted} />
                <Text style={[styles.segmentText, active && { color: "#fff" }]}>
                  {t(th.label)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>{t("Wika")}</Text>
        <View style={styles.segment}>
          {LANGUAGES.map((lang) => {
            const active = settings.language === lang.key;
            return (
              <Pressable
                key={lang.key}
                onPress={() => {
                  tap();
                  updateSettings({ language: lang.key });
                }}
                style={[styles.segmentBtn, active && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, active && { color: "#fff" }]}>{lang.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable onPress={confirmReset} style={styles.resetBtn}>
        <Ionicons name="refresh" size={16} color={colors.red} />
        <Text style={styles.resetText}>{t("I-reset sa sample data")}</Text>
      </Pressable>
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
      gap: 16,
    },
    pressed: {
      opacity: 0.7,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: 20,
      ...shadow,
    },
    profileTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "700",
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    badge: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
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
    hint: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 6,
    },
    segment: {
      flexDirection: "row",
      backgroundColor: colors.background,
      borderRadius: radius.md,
      padding: 4,
      gap: 4,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
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
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 16,
      alignItems: "center",
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
    resetBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
    },
    resetText: {
      color: colors.red,
      fontWeight: "600",
    },
  });
