import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { radius, type Colors } from "@/constants/theme";
import { LAST_UPDATED, NOTICES, PRIVACY, TERMS, type LegalDoc } from "@/legal/content";
import { useTheme } from "@/store/useTheme";

const DOCS: Record<"privacy" | "terms" | "notices", LegalDoc> = {
  privacy: PRIVACY,
  terms: TERMS,
  notices: NOTICES,
};
type DocKey = keyof typeof DOCS;

/** Privacy Policy, Terms of Use and credits. Open a tab directly with ?doc=terms. */
export default function LegalScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ doc?: DocKey }>();
  const [doc, setDoc] = useState<DocKey>(params.doc && params.doc in DOCS ? params.doc : "privacy");
  const current = DOCS[doc];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.segment}>
        {(Object.keys(DOCS) as DocKey[]).map((key) => (
          <Pressable
            key={key}
            onPress={() => setDoc(key)}
            style={[styles.segmentBtn, doc === key && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, doc === key && styles.segmentTextActive]} numberOfLines={1}>
              {DOCS[key].title.split(" ")[0]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.title}>{current.title}</Text>
      <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>{current.summary}</Text>
      </View>

      {current.sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text style={styles.heading}>{section.heading}</Text>
          {section.body.map((paragraph, i) => (
            <Text key={i} style={styles.body}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
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
    },
    segment: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: 4,
      gap: 4,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
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
    segmentTextActive: {
      color: "#fff",
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
    },
    updated: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 4,
    },
    summary: {
      backgroundColor: colors.primarySoft,
      borderRadius: radius.md,
      padding: 14,
      marginTop: 16,
    },
    summaryText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.text,
    },
    section: {
      marginTop: 20,
      gap: 6,
    },
    heading: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    body: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.text,
    },
  });
