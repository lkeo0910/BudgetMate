import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, SectionTitle } from "../components/Card";
import { GradientPanel, IconBubble, PrimaryButton } from "../components/FinanceUI";
import { Screen } from "../components/Layout";
import { colors } from "../theme";

export default function LandingScreen({ navigation }) {
  const insights = [
    ["trending-up-outline", "#14b8a6", "How to Budget Better", "Practical tips to manage daily expenses and save more."],
    ["book-outline", "#2563eb", "Understanding 50/30/20", "Master the 50/30/20 rule for balanced finance."],
    ["shield-checkmark-outline", "#d97706", "Smart Saving Strategies", "Protect your future with automated habits."]
  ];

  return (
    <Screen eyebrow="BudgetMate" title="Welcome back, Vibecoders" subtitle="Here is a high-level look at your financial health today.">
      <View style={styles.heroWrap}>
        <GradientPanel colors={["#ffffff", "#ecfeff"]} style={styles.hero}>
          <View style={styles.centerIcon}>
            <IconBubble name="wallet-outline" color={colors.primary} softColor="#ccfbf1" size={28} />
          </View>
          <Text style={styles.overline}>Remaining Budget</Text>
          <Text style={styles.amount}>23,810,000 ₫</Text>
          <View style={styles.actions}>
            <PrimaryButton label="Go to Dashboard" icon="arrow-forward" onPress={() => navigation.navigate("Dashboard")} />
            <PrimaryButton label="Login" icon="sparkles-outline" variant="outline" />
          </View>
        </GradientPanel>
      </View>

      <SectionTitle title="Financial Insights" />
      {insights.map(([icon, color, title, text]) => (
        <Card key={title} style={styles.insight}>
          <View style={[styles.insightArt, { backgroundColor: color }]}>
            <Ionicons name={icon} color="rgba(255,255,255,0.72)" size={38} />
          </View>
          <View style={styles.insightCopy}>
            <Text style={styles.insightTitle}>{title}</Text>
            <Text style={styles.insightText}>{text}</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    marginHorizontal: 16,
    marginTop: 16
  },
  hero: {
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center"
  },
  centerIcon: {
    marginTop: 4
  },
  overline: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 18
  },
  amount: {
    color: colors.teal,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "900",
    marginTop: 4,
    textAlign: "center"
  },
  actions: {
    width: "100%",
    gap: 10,
    marginTop: 18
  },
  insight: {
    padding: 0,
    overflow: "hidden"
  },
  insightArt: {
    height: 96,
    alignItems: "center",
    justifyContent: "center"
  },
  insightCopy: {
    padding: 16
  },
  insightTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  insightText: {
    color: colors.muted,
    marginTop: 5,
    lineHeight: 20
  }
});
