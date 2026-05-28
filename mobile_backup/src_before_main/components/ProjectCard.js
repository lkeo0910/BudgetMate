import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { Card } from "./Card";

export function ProjectCard({ project }) {
  return (
    <Card>
      <View style={styles.topRow}>
        <View style={[styles.icon, { backgroundColor: `${project.accent || colors.primary}20` }]}>
          <Ionicons name="analytics" color={project.accent || colors.primary} size={22} />
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{project.title}</Text>
          <Text style={styles.subtitle}>{project.subtitle}</Text>
        </View>
      </View>
      <Text style={styles.description}>{project.description}</Text>
      <View style={styles.statsRow}>
        {(project.stats || []).map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>
      {!!project.link_url && (
        <Pressable style={styles.linkButton} onPress={() => Linking.openURL(project.link_url)}>
          <Text style={styles.linkText}>{project.link_label || "Open project"}</Text>
          <Ionicons name="open-outline" color={colors.surface} size={18} />
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  titleWrap: {
    flex: 1,
    marginLeft: 12
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    marginTop: 2,
    fontWeight: "700"
  },
  description: {
    color: colors.text,
    lineHeight: 21,
    marginTop: 14
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14
  },
  stat: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.background
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  statValue: {
    color: colors.ink,
    fontWeight: "900",
    marginTop: 4
  },
  linkButton: {
    marginTop: 16,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  linkText: {
    color: colors.surface,
    fontWeight: "900"
  }
});
