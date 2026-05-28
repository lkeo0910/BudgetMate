import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme";

export function IconBubble({ name, color = colors.primary, softColor, size = 22 }) {
  return (
    <View style={[styles.iconBubble, { backgroundColor: softColor || `${color}14` }]}>
      <Ionicons name={name} color={color} size={size} />
    </View>
  );
}

export function PrimaryButton({ label, icon, onPress, variant = "solid" }) {
  return (
    <Pressable onPress={onPress} style={[styles.button, variant === "outline" && styles.buttonOutline]}>
      <Text style={[styles.buttonText, variant === "outline" && styles.buttonOutlineText]}>{label}</Text>
      {!!icon && <Ionicons name={icon} color={variant === "outline" ? colors.ink : colors.surface} size={17} />}
    </Pressable>
  );
}

export function MetricCard({ label, value, icon, color = colors.primary }) {
  return (
    <View style={styles.metricCard}>
      <IconBubble name={icon} color={color} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export function ProgressBar({ progress, color = colors.primary }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(Math.max(progress, 0), 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

export function GradientPanel({ children, colors: gradientColors = ["#14b8a6", "#059669"], style }) {
  return <LinearGradient colors={gradientColors} style={[styles.gradientPanel, style]}>{children}</LinearGradient>;
}

const styles = StyleSheet.create({
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  button: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  buttonOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  buttonText: {
    color: colors.surface,
    fontWeight: "900"
  },
  buttonOutlineText: {
    color: colors.ink
  },
  metricCard: {
    flex: 1,
    minWidth: "47%",
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 12
  },
  metricValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    overflow: "hidden"
  },
  progressFill: {
    height: 8,
    borderRadius: 999
  },
  gradientPanel: {
    borderRadius: 22,
    padding: 18,
    overflow: "hidden"
  }
});
