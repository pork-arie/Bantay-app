import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { BRAND, type Colors } from "@/constants/theme";
import { useT } from "@/i18n";
import { tap, warning } from "@/store/haptics";
import { useStore } from "@/store/StoreProvider";
import { useTheme } from "@/store/useTheme";

export const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

/** Shown on start (and after "Lock") when the owner has set a PIN. */
export default function LockScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { login, settings } = useStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  function press(key: string) {
    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= PIN_LENGTH) return;
    tap();
    const next = pin + key;
    setError(false);
    setPin(next);
    if (next.length === PIN_LENGTH) {
      if (!login(next)) {
        warning();
        setError(true);
        shake.value = withSequence(
          withTiming(-12, { duration: 50 }),
          withTiming(12, { duration: 50 }),
          withTiming(-8, { duration: 50 }),
          withTiming(8, { duration: 50 }),
          withTiming(0, { duration: 50 }),
        );
        setTimeout(() => setPin(""), 250);
      }
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.top}>
        <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.logo}>
          <Ionicons name="storefront" size={28} color="#fff" />
        </Animated.View>
        <Text style={styles.brand}>{BRAND}</Text>
        {settings.storeName !== "" && <Text style={styles.store}>{settings.storeName}</Text>}
        <Text style={styles.prompt}>{t("Ilagay ang iyong PIN")}</Text>
        <Animated.View style={[styles.dots, shakeStyle]}>
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <View key={i} style={styles.dot}>
              {i < pin.length && (
                <Animated.View
                  entering={ZoomIn.duration(150)}
                  style={[styles.dotFill, { backgroundColor: error ? colors.red : colors.primary }]}
                />
              )}
            </View>
          ))}
        </Animated.View>
        <Text style={[styles.error, !error && { opacity: 0 }]}>{t("Mali ang PIN. Subukan ulit.")}</Text>
      </View>

      <Animated.View entering={FadeIn.duration(400)} style={styles.pad}>
        {KEYS.map((key, i) =>
          key === "" ? (
            <View key={i} style={styles.key} />
          ) : (
            <Pressable
              key={i}
              onPress={() => press(key)}
              style={({ pressed }) => [styles.key, pressed && { backgroundColor: colors.border }]}
              accessibilityLabel={key === "del" ? t("Burahin") : key}
            >
              {key === "del" ? (
                <Ionicons name="backspace-outline" size={26} color={colors.text} />
              ) : (
                <Text style={styles.keyText}>{key}</Text>
              )}
            </Pressable>
          ),
        )}
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: "space-between",
      alignItems: "center",
    },
    top: {
      alignItems: "center",
      gap: 6,
    },
    logo: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    brand: {
      fontSize: 26,
      fontWeight: "800",
      color: colors.text,
    },
    store: {
      fontSize: 14,
      color: colors.muted,
    },
    prompt: {
      fontSize: 15,
      color: colors.text,
      marginTop: 28,
    },
    dots: {
      flexDirection: "row",
      gap: 16,
      marginTop: 16,
    },
    dot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    dotFill: {
      width: 16,
      height: 16,
      borderRadius: 8,
    },
    error: {
      color: colors.red,
      fontSize: 13,
      marginTop: 12,
    },
    pad: {
      flexDirection: "row",
      flexWrap: "wrap",
      width: 288,
      justifyContent: "space-between",
      rowGap: 14,
    },
    key: {
      width: 84,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    keyText: {
      fontSize: 28,
      fontWeight: "500",
      color: colors.text,
    },
  });
