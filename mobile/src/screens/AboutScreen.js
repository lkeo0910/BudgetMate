import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { Notice, Screen } from "../components/Layout";
import { useResource } from "../hooks/useResource";
import { colors } from "../theme";

export default function AboutScreen() {
  const { data: profile, loading, error, fromFallback, reload } = useResource("/profile");

  if (loading && !profile) return <LoadingState />;

  return (
    <Screen
      eyebrow="About"
      title={profile.brand_name}
      subtitle="A native mobile redesign of the inspected BudgetMate financial dashboard."
      refreshing={loading}
      onRefresh={reload}
    >
      <Notice text={fromFallback ? `Offline demo mode: ${error}` : null} />
      <Card>
        <Text style={styles.title}>Product story</Text>
        <Text style={styles.body}>{profile.summary}</Text>
      </Card>
      <Card>
        <Text style={styles.title}>Profile details</Text>
        <Detail icon="person-circle-outline" label="Username" value={profile.username} />
        <Detail icon="mail-outline" label="Email" value={profile.email} />
        <Detail icon="call-outline" label="Phone" value={profile.phone || "Not provided"} />
        <Detail icon="shield-checkmark-outline" label="Account" value="Fully Secured" />
      </Card>
      <Card>
        <Text style={styles.quote}>
          "Users who check their dashboard daily save an average of 15% more each month. Keep up the good work!"
        </Text>
      </Card>
    </Screen>
  );
}

function Detail({ icon, label, value }) {
  return (
    <View style={styles.detail}>
      <Ionicons name={icon} color={colors.primary} size={20} />
      <View style={styles.detailText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8
  },
  body: {
    color: colors.text,
    lineHeight: 22
  },
  detail: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  detailText: {
    marginLeft: 12
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  value: {
    color: colors.ink,
    fontWeight: "800",
    marginTop: 2
  },
  quote: {
    color: colors.primaryDark,
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "800"
  }
});
