import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { Card } from "./Card";

export function MetricGrid({ metrics = [] }) {
  return (
    <View style={styles.grid}>
      {metrics.map((metric) => (
        <Card key={metric.label} style={styles.metricCard}>
          <Text style={styles.metricLabel}>{metric.label}</Text>
          <Text style={styles.metricValue}>{metric.value}</Text>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    marginTop: 4
  },
  metricCard: {
    width: "50%",
    marginHorizontal: 0,
    borderRadius: 16,
    shadowOpacity: 0.05
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  metricValue: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 8
  }
});
