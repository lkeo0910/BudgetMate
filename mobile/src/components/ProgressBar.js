import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../theme";

export function ProgressBar({ value, color = colors.primary }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.max(0, Math.min(value, 100))}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 99,
    backgroundColor: "#e5e7eb",
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    borderRadius: 99
  }
});
