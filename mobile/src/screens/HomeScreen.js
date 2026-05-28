import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Card, SectionTitle } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { MetricGrid } from "../components/MetricGrid";
import { Notice, Screen } from "../components/Layout";
import { useResource } from "../hooks/useResource";
import { colors } from "../theme";

export default function HomeScreen() {
  const { data: profile, loading, error, fromFallback, reload } = useResource("/profile");

  if (loading && !profile) return <LoadingState />;

  return (
    <Screen
      eyebrow={profile.brand_name}
      title="Smart money, calmer days"
      subtitle={profile.tagline}
      refreshing={loading}
      onRefresh={reload}
    >
      <Notice text={fromFallback ? `Using built-in demo data because the API is unavailable: ${error}` : null} />
      <Card style={styles.hero}>
        <LinearGradient colors={[colors.primary, colors.teal]} style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.avatar_initials}</Text>
        </LinearGradient>
        <View style={styles.heroText}>
          <Text style={styles.name}>{profile.owner_name}</Text>
          <Text style={styles.meta}>{profile.joined_label} • {profile.status_label}</Text>
        </View>
      </Card>

      <MetricGrid metrics={profile.hero_metrics || []} />

      <SectionTitle title="Today" />
      <Card>
        <View style={styles.insightRow}>
          <View style={styles.insightIcon}>
            <Ionicons name="trending-up" color={colors.success} size={22} />
          </View>
          <View style={styles.insightText}>
            <Text style={styles.insightTitle}>Budget health score: 100</Text>
            <Text style={styles.body}>
              Healthy cash flow, steady budgets, and bills are under control. BudgetMate expects 164.149.000 ₫ by month end.
            </Text>
          </View>
        </View>
      </Card>
      <Card>
        <Text style={styles.insightTitle}>Smart insights</Text>
        <Text style={styles.body}>Groceries spending is up 42% versus the previous period.</Text>
        <Text style={styles.body}>You are on track to save 7.330.000 ₫ this period.</Text>
        <Text style={styles.body}>Reducing rent could free up 650.000 ₫ this period.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center"
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: "900"
  },
  heroText: {
    flex: 1,
    marginLeft: 14
  },
  name: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900"
  },
  meta: {
    color: colors.muted,
    marginTop: 4,
    fontWeight: "700"
  },
  insightRow: {
    flexDirection: "row"
  },
  insightIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center"
  },
  insightText: {
    flex: 1,
    marginLeft: 12
  },
  insightTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 6
  },
  body: {
    color: colors.text,
    lineHeight: 21,
    marginTop: 4
  }
});
