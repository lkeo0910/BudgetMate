import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, EmptyState } from "../components/Card";
import { Screen } from "../components/Layout";
import { getCurrentUser } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

export default function ProfileScreen() {
  const auth = useAuth();
  const [user, setUser] = useState(auth?.user || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getCurrentUser(auth.access_token);
      setUser(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const initials = (user?.username || "BM").slice(0, 2).toUpperCase();

  return (
    <Screen eyebrow="Profile" title="Profile" refreshing={loading} onRefresh={load}>
      {!!error && <EmptyState title="Could not load profile" message={error} />}
      {loading && !user ? (
        <Card><ActivityIndicator color={colors.primary} /></Card>
      ) : (
        <>
          <Card style={styles.hero}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.username}>{user?.username}</Text>
            <Text style={styles.meta}>Joined March 2024 • Verified Account</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>Premium Member</Text>
              <Text style={[styles.badge, styles.activeBadge]}>Active Session</Text>
            </View>
            <Pressable style={styles.logoutButton} onPress={auth.logout}>
              <Ionicons name="log-out-outline" color={colors.surface} size={18} />
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </Card>

          <Card>
            <Text style={styles.cardTitle}>Profile Details</Text>
            <Detail icon="person-outline" label="Username" value={user?.username || "Not provided"} />
            <Detail icon="mail-outline" label="Email Address" value={user?.email || "Not provided"} />
            <Detail icon="call-outline" label="Phone Number" value={user?.phone_number || "Not provided"} />
            <Detail icon="shield-checkmark-outline" label="Account Status" value="Fully Secured" />
          </Card>

          <Card style={styles.tipCard}>
            <Text style={styles.cardTitle}>Budget Tip</Text>
            <Text style={styles.tipText}>Users who check their dashboard daily tend to catch overspending sooner. Keep the habit simple and frequent.</Text>
          </Card>
        </>
      )}
    </Screen>
  );
}

function Detail({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} color={colors.primary} size={18} />
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center" },
  avatar: { width: 96, height: 96, borderRadius: 30, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.surface, fontWeight: "900", fontSize: 30 },
  username: { color: colors.ink, fontSize: 25, fontWeight: "900", marginTop: 14 },
  meta: { color: colors.muted, marginTop: 6, fontWeight: "700", textAlign: "center" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 14 },
  badge: { color: colors.primary, backgroundColor: "#ecfeff", borderColor: "#99f6e4", borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, fontWeight: "900", fontSize: 12 },
  activeBadge: { color: colors.success, backgroundColor: "#ecfdf5", borderColor: "#86efac" },
  logoutButton: { marginTop: 16, minHeight: 46, borderRadius: 12, backgroundColor: colors.ink, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 18 },
  logoutText: { color: colors.surface, fontWeight: "900" },
  cardTitle: { color: colors.ink, fontSize: 19, fontWeight: "900", marginBottom: 8 },
  detailRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailCopy: { flex: 1 },
  detailLabel: { color: colors.muted, fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  detailValue: { color: colors.ink, fontWeight: "900", marginTop: 3 },
  tipCard: { backgroundColor: "#f5f3ff", borderColor: "#ddd6fe" },
  tipText: { color: colors.text, lineHeight: 21, fontWeight: "700" }
});
