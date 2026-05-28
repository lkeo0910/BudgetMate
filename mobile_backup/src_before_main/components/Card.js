import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colors, shadow, spacing } from "../theme";

export function Card({ children, style }) {
  const fade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true })
    ]).start();
  }, [fade, translateY]);

  return (
    <Animated.View style={[styles.card, style, { opacity: fade, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

export function SectionTitle({ title, action }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function EmptyState({ title, message }) {
  return (
    <Card>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.page,
    marginTop: 16,
    padding: spacing.card,
    borderRadius: spacing.radius,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow
  },
  sectionRow: {
    marginHorizontal: spacing.page,
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900"
  },
  emptyTitle: {
    color: colors.ink,
    fontWeight: "900",
    fontSize: 18
  },
  emptyText: {
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20
  }
});
