import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { Notice, Screen } from "../components/Layout";
import { ProgressBar } from "../components/ProgressBar";
import { useResource } from "../hooks/useResource";
import { colors } from "../theme";

export default function SkillsScreen() {
  const { data: skills, loading, error, fromFallback, reload } = useResource("/skills");

  if (loading && !skills) return <LoadingState label="Loading skills..." />;

  return (
    <Screen
      eyebrow="Skills"
      title="What BudgetMate does well"
      subtitle="Core product abilities redesigned as tappable native cards."
      refreshing={loading}
      onRefresh={reload}
    >
      <Notice text={fromFallback ? `Offline demo mode: ${error}` : null} />
      {skills.map((skill) => (
        <Card key={skill.id}>
          <View style={styles.row}>
            <View>
              <Text style={styles.category}>{skill.category}</Text>
              <Text style={styles.name}>{skill.name}</Text>
            </View>
            <Text style={styles.level}>{skill.level}%</Text>
          </View>
          <Text style={styles.description}>{skill.description}</Text>
          <ProgressBar value={skill.level} color={skill.level > 90 ? colors.teal : colors.primary} />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  category: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  name: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 3
  },
  level: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  description: {
    color: colors.text,
    lineHeight: 21,
    marginVertical: 12
  }
});
