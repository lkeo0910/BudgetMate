import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { Notice, Screen } from "../components/Layout";
import { useResource } from "../hooks/useResource";
import { colors } from "../theme";

export default function LeadershipScreen() {
  const { data: leadership, loading, error, fromFallback, reload } = useResource("/leadership");

  if (loading && !leadership) return <LoadingState label="Loading leadership..." />;

  return (
    <Screen
      eyebrow="Leadership"
      title="Product leadership"
      subtitle="The inspected site’s main responsibilities translated into mobile-friendly impact cards."
      refreshing={loading}
      onRefresh={reload}
    >
      <Notice text={fromFallback ? `Offline demo mode: ${error}` : null} />
      {leadership.map((item) => (
        <Card key={item.id}>
          <View style={styles.header}>
            <View style={styles.icon}>
              <Ionicons name="trophy" color={colors.orange} size={23} />
            </View>
            <View style={styles.heading}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.organization} • {item.period}</Text>
            </View>
          </View>
          <Text style={styles.description}>{item.description}</Text>
          {(item.impact || []).map((impact) => (
            <View key={impact} style={styles.impact}>
              <Ionicons name="flash" color={colors.primary} size={16} />
              <Text style={styles.impactText}>{impact}</Text>
            </View>
          ))}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center"
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#ffedd5",
    alignItems: "center",
    justifyContent: "center"
  },
  heading: {
    flex: 1,
    marginLeft: 12
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  meta: {
    color: colors.muted,
    marginTop: 2,
    fontWeight: "700"
  },
  description: {
    color: colors.text,
    lineHeight: 21,
    marginVertical: 14
  },
  impact: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7
  },
  impactText: {
    color: colors.text,
    marginLeft: 8,
    flex: 1,
    fontWeight: "700"
  }
});
