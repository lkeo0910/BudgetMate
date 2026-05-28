import React from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing } from "../theme";

export function Screen({ eyebrow, title, subtitle, children, refreshing, onRefresh }) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined
      }
    >
      <LinearGradient colors={["#eff6ff", "#f8fafc"]} style={styles.header}>
        {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </LinearGradient>
      {children}
    </ScrollView>
  );
}

export function Notice({ text }) {
  if (!text) return null;
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    paddingBottom: 28
  },
  header: {
    paddingTop: 58,
    paddingHorizontal: spacing.page,
    paddingBottom: 24,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 8
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8
  },
  notice: {
    marginHorizontal: spacing.page,
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff"
  },
  noticeText: {
    color: colors.primaryDark,
    fontSize: 13,
    lineHeight: 18
  }
});
