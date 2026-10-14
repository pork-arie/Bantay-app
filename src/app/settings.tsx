import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import OwnerOnly from "@/components/OwnerOnly";
import { PIN_LENGTH } from "@/components/LockScreen";
import { ACCENTS, BRAND, initials, radius, type Accent, type Colors } from "@/constants/theme";
import type { Language, ThemeMode } from "@/data/sample";
import { useT, type TKey } from "@/i18n";
import { daysSinceBackup, exportBackup, pickBackup } from "@/lib/backup";
import { confirm, notify } from "@/lib/confirm";
import { printUtangList } from "@/lib/receipt";
import { formatDate } from "@/store/selectors";
import { success, tap, warning } from "@/store/haptics";
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
const PIN_RE = new RegExp(`^\\d{${PIN_LENGTH}}$`);

type Styles = ReturnType<typeof createStyles>;
type IconName = keyof typeof Ionicons.glyphMap;

function Card(props: { title: string; icon: IconName; styles: Styles; colors: Colors; children: ReactNode }) {
  const { styles, colors } = props;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={props.icon} size={18} color={colors.muted} />
        <Text style={styles.cardTitle}>{props.title}</Text>
      </View>
      {props.children}
    </View>
  );
}

function Row(props: { label: string; icon: IconName; onPress: () => void; danger?: boolean; styles: Styles; colors: Colors }) {
  const { styles, colors, danger } = props;
  return (
    <Pressable onPress={props.onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      <Ionicons name={props.icon} size={18} color={danger ? colors.red : colors.text} />
      <Text style={[styles.rowText, danger && { color: colors.red }]}>{props.label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const t = useT();
  const { colors, dark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const store = useStore();
  const { settings, updateSettings, ready, staff, meta, can } = store;

  const formFromSettings = () => ({
    ownerName: settings.ownerName,
    ownerPhone: settings.ownerPhone,
    storeName: settings.storeName,
    storeAddress: settings.storeAddress,
    gcashNumber: settings.gcashNumber,
    defaultLimit: String(settings.defaultLimit),
  });
  const [form, setForm] = useState(formFromSettings);
  const [pinForm, setPinForm] = useState({ pin: "", again: "" });
  const [staffForm, setStaffForm] = useState({ name: "", pin: "" });
  const [busy, setBusy] = useState(false);

  // Saved settings load asynchronously; refill the form once they arrive.
  useEffect(() => {
    if (ready) setForm(formFromSettings());
  }, [ready, settings]);

  if (!can("settings")) return <OwnerOnly />;

  const backupDays = daysSinceBackup(meta.lastBackupAt);
  const version = Constants.expoConfig?.version ?? "1.0.0";

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
    notify(t("Na-save"), t("Nai-save ang settings."));
  }

  // ---------- Backup ----------

  async function backup() {
    setBusy(true);
    try {
      const ok = await exportBackup({
        products: store.products,
        debtors: store.debtors,
        sales: store.sales,
        settings: store.settings,
        closings: store.closings,
        staff: store.staff,
        activity: store.activity,
        meta: store.meta,
      });
      if (ok) {
        store.markBackedUp();
        success();
      } else {
        notify(t("Hindi natuloy"), t("Hindi mabuksan ang share menu sa phone na ito."));
      }
    } catch {
      notify(t("Hindi natuloy"), t("Hindi nagawa ang backup. Subukan ulit."));
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    const picked = await pickBackup();
    if (!picked.ok) {
      if (picked.reason === "invalid") {
        warning();
        notify(t("Hindi ma-restore"), t("Hindi ito Bantay backup file, o sira ang file."));
      }
      return;
    }
    const when = picked.exportedAt ? formatDate(picked.exportedAt, settings.language) : "?";
    const ok = await confirm(
      t("I-restore ang backup?"),
      t("Papalitan ng backup mula {date} ang LAHAT ng data sa phone na ito.", { date: when }),
      t("I-restore"),
      t("Kanselahin"),
    );
    if (!ok) return;
    store.restoreData(picked.data);
    success();
  }

  // ---------- Security ----------

  function savePin() {
    if (!PIN_RE.test(pinForm.pin)) {
      notify(t("Kulang"), t("Ang PIN ay {n} numero.", { n: PIN_LENGTH }));
      return;
    }
    if (pinForm.pin !== pinForm.again) {
      notify(t("Hindi magkapareho"), t("Hindi magkapareho ang dalawang PIN."));
      return;
    }
    if (staff.some((m) => m.pin === pinForm.pin)) {
      notify(t("Gamit na"), t("May staff na gumagamit ng PIN na ito."));
      return;
    }
    updateSettings({ ownerPin: pinForm.pin });
    setPinForm({ pin: "", again: "" });
    success();
    notify(t("Naka-on na ang PIN"), t("Hihingin ang PIN tuwing bubuksan ang app."));
  }

  async function removePin() {
    const ok = await confirm(
      t("Alisin ang PIN?"),
      t("Hindi na hihingin ang PIN at hindi na magagamit ng staff ang kanilang PIN."),
      t("Alisin"),
      t("Kanselahin"),
    );
    if (ok) updateSettings({ ownerPin: "" });
  }

  function addStaff() {
    const name = staffForm.name.trim();
    if (name === "" || !PIN_RE.test(staffForm.pin)) {
      notify(t("Kulang"), t("Ilagay ang pangalan at {n}-numerong PIN.", { n: PIN_LENGTH }));
      return;
    }
    if (staffForm.pin === settings.ownerPin || staff.some((m) => m.pin === staffForm.pin)) {
      notify(t("Gamit na"), t("Gamit na ang PIN na ito. Pumili ng iba."));
      return;
    }
    store.addStaff(name, staffForm.pin);
    setStaffForm({ name: "", pin: "" });
    success();
  }

  async function removeStaff(id: string, name: string) {
    const ok = await confirm(t("Alisin si {name}?", { name }), t("Hindi na siya makakapag-login."), t("Alisin"), t("Kanselahin"));
    if (ok) store.removeStaff(id);
  }

  // ---------- Data ----------

  async function startFresh() {
    const ok = await confirm(
      t("Magsimula nang walang laman?"),
      t("Buburahin ang lahat ng produkto, benta at utang. Maiiwan ang profile at settings."),
      t("Burahin"),
      t("Kanselahin"),
    );
    if (ok) store.startFresh();
  }

  async function resetSample() {
    const ok = await confirm(
      t("I-reset ang data?"),
      t("Mabubura ang lahat ng benta, utang at produkto at babalik sa sample data."),
      t("I-reset"),
      t("Kanselahin"),
    );
    if (ok) store.resetData();
  }

  async function wipe() {
    const first = await confirm(
      t("Burahin lahat ng data?"),
      t("Mabubura ang LAHAT: produkto, benta, utang, customer, staff at settings. Hindi na ito maibabalik."),
      t("Burahin"),
      t("Kanselahin"),
    );
    if (!first) return;
    const second = await confirm(t("Sigurado ka ba?"), t("Huling tanong: burahin talaga?"), t("Oo, burahin"), t("Huwag"));
    if (second) store.wipeData();
  }

  // ---------- UI helpers ----------

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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
        {field("gcashNumber", "GCash number ng tindahan", "09XX XXX XXXX", "phone-pad")}
        {field("defaultLimit", "Default na credit limit", "2000", "decimal-pad")}
        <Pressable onPress={save} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.8 }]}>
          <Text style={styles.primaryBtnText}>{t("I-save")}</Text>
        </Pressable>
      </View>

      {/* Appearance: applies right away */}
      <Card title={t("Itsura")} icon="color-palette-outline" styles={styles} colors={colors}>
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
                <Ionicons name={th.icon} size={15} color={active ? colors.text : colors.muted} />
                <Text style={[styles.segmentText, active && { color: colors.text }]}>{t(th.label)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>{t("Kulay ng app")}</Text>
        <View style={styles.swatches}>
          {(Object.keys(ACCENTS) as Accent[]).map((key) => {
            const tone = dark ? ACCENTS[key].dark : ACCENTS[key].light;
            const active = settings.accent === key;
            return (
              <Pressable
                key={key}
                onPress={() => {
                  tap();
                  updateSettings({ accent: key });
                }}
                accessibilityLabel={key}
                style={[styles.swatch, active && { borderColor: tone.primary }]}
              >
                <View style={[styles.swatchDot, { backgroundColor: tone.primary }]}>
                  {active && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
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
                <Text style={[styles.segmentText, active && { color: colors.text }]}>{lang.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Backup */}
      <Card title={t("Backup at Restore")} icon="cloud-upload-outline" styles={styles} colors={colors}>
        <View style={[styles.notice, backupDays === null || backupDays >= 7 ? styles.noticeWarn : null]}>
          <Text style={styles.noticeText}>
            {backupDays === null
              ? t("Hindi ka pa nagba-backup.")
              : t("Huling backup: {date} ({days} araw na)", {
                  date: formatDate(meta.lastBackupAt!, settings.language),
                  days: backupDays,
                })}
          </Text>
        </View>
        <Text style={styles.hint}>
          {t("Ise-save ang lahat ng data sa isang file. Ilipat ito sa ibang phone (Bluetooth/Nearby Share), SD card, o Messenger para ligtas kahit mawala ang phone. Walang internet na kailangan.")}
        </Text>
        <Pressable onPress={backup} disabled={busy} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.8 }]}>
          <Text style={styles.primaryBtnText}>{busy ? "..." : t("I-backup ngayon")}</Text>
        </Pressable>
        <Row styles={styles} colors={colors} label={t("I-restore mula sa backup file")} icon="cloud-download-outline" onPress={restore} />
        <Row
          styles={styles}
          colors={colors}
          label={t("I-print ang listahan ng utang")}
          icon="print-outline"
          onPress={() => printUtangList(store.debtors, settings, t).catch(() => {})}
        />
      </Card>

      {/* Security */}
      <Card title={t("Seguridad at Staff")} icon="shield-checkmark-outline" styles={styles} colors={colors}>
        {settings.ownerPin === "" ? (
          <>
            <Text style={styles.hint}>
              {t("Maglagay ng PIN para i-lock ang app at para makagawa ng account ang staff. Hindi makikita ng staff ang tubo, settings at activity log, at hindi sila makakapag-void.")}
            </Text>
            <View style={styles.formRow}>
              <TextInput
                value={pinForm.pin}
                onChangeText={(pin) => setPinForm({ ...pinForm, pin })}
                placeholder={t("Bagong PIN")}
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={PIN_LENGTH}
                style={[styles.input, { flex: 1, minWidth: 0 }]}
              />
              <TextInput
                value={pinForm.again}
                onChangeText={(again) => setPinForm({ ...pinForm, again })}
                placeholder={t("Ulitin")}
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={PIN_LENGTH}
                style={[styles.input, { flex: 1, minWidth: 0 }]}
              />
            </View>
            <Pressable onPress={savePin} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.8 }]}>
              <Text style={styles.primaryBtnText}>{t("I-on ang PIN lock")}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={[styles.notice, { backgroundColor: colors.successSoft }]}>
              <Text style={styles.noticeText}>{t("Naka-on ang PIN lock.")}</Text>
            </View>
            <Row styles={styles} colors={colors} label={t("Alisin ang PIN lock")} icon="lock-open-outline" onPress={removePin} danger />

            <Text style={[styles.label, { marginTop: 18 }]}>{t("Staff")}</Text>
            {staff.length === 0 && <Text style={styles.hint}>{t("Wala pang staff.")}</Text>}
            {staff.map((m) => (
              <View key={m.id} style={styles.staffRow}>
                <View style={styles.staffAvatar}>
                  <Text style={styles.staffAvatarText}>{initials(m.name)}</Text>
                </View>
                <Text style={styles.rowText}>{m.name}</Text>
                <Pressable onPress={() => removeStaff(m.id, m.name)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.red} />
                </Pressable>
              </View>
            ))}
            <View style={styles.formRow}>
              <TextInput
                value={staffForm.name}
                onChangeText={(name) => setStaffForm({ ...staffForm, name })}
                placeholder={t("Pangalan ng staff")}
                placeholderTextColor={colors.muted}
                style={[styles.input, { flex: 1, minWidth: 0 }]}
              />
              <TextInput
                value={staffForm.pin}
                onChangeText={(pin) => setStaffForm({ ...staffForm, pin })}
                placeholder="PIN"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={PIN_LENGTH}
                style={[styles.input, { width: 88 }]}
              />
            </View>
            <Pressable onPress={addStaff} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="person-add-outline" size={16} color={colors.text} />
              <Text style={styles.secondaryBtnText}>{t("Idagdag ang staff")}</Text>
            </Pressable>
          </>
        )}
      </Card>

      {/* Data */}
      <Card title={t("Data")} icon="server-outline" styles={styles} colors={colors}>
        <Row styles={styles} colors={colors} label={t("Magsimula nang walang laman")} icon="document-outline" onPress={startFresh} />
        <Row styles={styles} colors={colors} label={t("I-reset sa sample data")} icon="refresh" onPress={resetSample} />
        <Row styles={styles} colors={colors} label={t("Burahin lahat ng data")} icon="trash-outline" onPress={wipe} danger />
      </Card>

      {/* Legal */}
      <Card title={t("Legal")} icon="document-text-outline" styles={styles} colors={colors}>
        <Row styles={styles} colors={colors} label="Privacy Policy" icon="lock-closed-outline" onPress={() => router.navigate({ pathname: "/legal", params: { doc: "privacy" } })} />
        <Row styles={styles} colors={colors} label="Terms of Use" icon="reader-outline" onPress={() => router.navigate({ pathname: "/legal", params: { doc: "terms" } })} />
        <Row styles={styles} colors={colors} label="Notices & Credits" icon="information-circle-outline" onPress={() => router.navigate({ pathname: "/legal", params: { doc: "notices" } })} />
      </Card>

      <Text style={styles.version}>
        {BRAND} v{version}
      </Text>
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
      paddingBottom: 48,
      gap: 14,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    profileTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "700",
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.muted,
      marginTop: 14,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    input: {
      height: 46,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      paddingHorizontal: 14,
      fontSize: 15,
      color: colors.text,
    },
    hint: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.muted,
      marginTop: 8,
    },
    formRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
    },
    segment: {
      flexDirection: "row",
      backgroundColor: colors.background,
      borderRadius: radius.sm,
      padding: 3,
      gap: 3,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 9,
      borderRadius: 8,
    },
    segmentActive: {
      backgroundColor: colors.surface,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    segmentText: {
      fontWeight: "600",
      fontSize: 13,
      color: colors.muted,
    },
    swatches: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    swatch: {
      padding: 3,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: "transparent",
    },
    swatchDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    notice: {
      backgroundColor: colors.background,
      borderRadius: radius.sm,
      padding: 12,
      marginTop: 8,
    },
    noticeWarn: {
      backgroundColor: colors.orangeSoft,
    },
    noticeText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    rowText: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
    },
    staffRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 8,
    },
    staffAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    staffAvatarText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.sm,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 16,
      marginBottom: 4,
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
    },
    secondaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      marginTop: 10,
    },
    secondaryBtnText: {
      fontWeight: "700",
      color: colors.text,
    },
    version: {
      textAlign: "center",
      fontSize: 12,
      color: colors.muted,
      marginTop: 4,
    },
  });
