import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, shadow } from "@/constants/theme";
import { success } from "@/store/haptics";
import { useStore } from "@/store/StoreProvider";

export default function SettingsScreen() {
  const { settings, updateSettings, resetData, ready } = useStore();
  const [form, setForm] = useState({
    storeName: settings.storeName,
    ownerName: settings.ownerName,
    gcashNumber: settings.gcashNumber,
    defaultLimit: String(settings.defaultLimit),
  });

  // Saved settings load asynchronously; refill the form once they arrive.
  useEffect(() => {
    if (ready) {
      setForm({
        storeName: settings.storeName,
        ownerName: settings.ownerName,
        gcashNumber: settings.gcashNumber,
        defaultLimit: String(settings.defaultLimit),
      });
    }
  }, [ready, settings]);

  function save() {
    updateSettings({
      storeName: form.storeName.trim(),
      ownerName: form.ownerName.trim(),
      gcashNumber: form.gcashNumber.trim(),
      defaultLimit: parseFloat(form.defaultLimit) || 0,
    });
    success();
    Alert.alert("Na-save", "Nai-save ang settings.");
  }

  function confirmReset() {
    Alert.alert(
      "I-reset ang data?",
      "Mabubura ang lahat ng benta, utang at produkto at babalik sa sample data.",
      [
        { text: "Kanselahin", style: "cancel" },
        { text: "I-reset", style: "destructive", onPress: resetData },
      ],
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tindahan</Text>
        <Text style={styles.label}>Pangalan ng tindahan</Text>
        <TextInput
          value={form.storeName}
          onChangeText={(storeName) => setForm({ ...form, storeName })}
          placeholder="hal. Tindahan ni Aling Rosa"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Text style={styles.label}>Pangalan mo</Text>
        <TextInput
          value={form.ownerName}
          onChangeText={(ownerName) => setForm({ ...form, ownerName })}
          placeholder="hal. Rosa"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: colors.gcashSoft }]}>
            <Ionicons name="phone-portrait-outline" size={16} color={colors.gcash} />
          </View>
          <Text style={styles.cardTitle}>GCash</Text>
        </View>
        <Text style={styles.label}>GCash number ng tindahan</Text>
        <TextInput
          value={form.gcashNumber}
          onChangeText={(gcashNumber) => setForm({ ...form, gcashNumber })}
          placeholder="09XX XXX XXXX"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <Text style={styles.hint}>
          Ipinapakita ito sa customer kapag GCash ang bayad sa Benta.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Utang</Text>
        <Text style={styles.label}>Default na credit limit</Text>
        <TextInput
          value={form.defaultLimit}
          onChangeText={(defaultLimit) => setForm({ ...form, defaultLimit })}
          placeholder="2000"
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          style={styles.input}
        />
        <Text style={styles.hint}>
          Ginagamit para sa bagong customer. Magbababala ang Benta kapag lalampas dito.
        </Text>
      </View>

      <Pressable
        onPress={save}
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
      >
        <Text style={styles.primaryBtnText}>I-save</Text>
      </Pressable>

      <Pressable onPress={confirmReset} style={styles.resetBtn}>
        <Ionicons name="refresh" size={16} color={colors.red} />
        <Text style={styles.resetText}>I-reset sa sample data</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    marginTop: 8,
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
