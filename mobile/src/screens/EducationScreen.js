import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { Notice, Screen } from "../components/Layout";
import { useResource } from "../hooks/useResource";
import { colors } from "../theme";

export default function EducationScreen() {
  const { data: education, loading, error, fromFallback, reload } = useResource("/education");

  if (loading && !education) return <LoadingState label="Loading education..." />;

  return (
    <Screen
      eyebrow="Education"
      title="Learning timeline"
      subtitle="BudgetMate knowledge areas framed for a mobile portfolio-style app."
      refreshing={loading}
      onRefresh={reload}
    >
      <Notice text={fromFallback ? `Offline demo mode: ${error}` : null} />
      {education.map((item) => (
        <Card key={item.id}>
          <Text style={styles.period}>{item.period}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.institution}>{item.institution}</Text>
          <Text style={styles.description}>{item.description}</Text>
          {(item.highlights || []).map((highlight) => (
            <View key={highlight} style={styles.bullet}>
              <Ionicons name="checkmark-circle" color={colors.teal} size={18} />
              <Text style={styles.bulletText}>{highlight}</Text>
            </View>
          ))}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  period: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4
  },
  institution: {
    color: colors.muted,
    fontWeight: "800",
    marginTop: 4
  },
  description: {
    color: colors.text,
    lineHeight: 21,
    marginVertical: 12
  },
  bullet: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6
  },
  bulletText: {
    color: colors.text,
    marginLeft: 8,
    fontWeight: "700"
  }
});
