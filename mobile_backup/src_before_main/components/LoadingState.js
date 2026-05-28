import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export function LoadingState({ label = "Loading BudgetMate..." }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 28,
    alignItems: "center"
  },
  text: {
    marginTop: 10,
    color: colors.muted,
    fontWeight: "700"
  }
});
