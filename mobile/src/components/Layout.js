import React from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ProfileMenu from "./ProfileMenu";
import { colors, spacing } from "../theme";

export function Screen({ eyebrow, title, children, refreshing, onRefresh, right }) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined
      }
    >
      <LinearGradient colors={["#ffffff", "#f0fdfa"]} style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandText}>BM</Text>
          </View>
          <View style={styles.headerCopy}>
            {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
            <Text style={styles.title}>{title}</Text>
          </View>
          {right || <ProfileMenu />}
        </View>
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
    paddingTop: 54,
    paddingHorizontal: spacing.page,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  brandText: {
    color: colors.surface,
    fontWeight: "900",
    fontSize: 13
  },
  headerCopy: {
    flex: 1
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 3
  },
  title: {
    color: colors.ink,
    fontSize: 25,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12
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
