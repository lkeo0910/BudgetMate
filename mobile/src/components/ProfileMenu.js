import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { useAuth } from "../context/AuthContext";

function initialsFor(username) {
  return (username || "BM").slice(0, 2).toUpperCase();
}

export default function ProfileMenu() {
  const auth = useAuth();
  const user = auth?.user;
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.avatarButton} onPress={() => setOpen(true)}>
        <Text style={styles.avatarText}>{initialsFor(user?.username)}</Text>
      </Pressable>

      <Modal animationType="fade" transparent visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.panel}>
            <View style={styles.header}>
              <View>
                <Text style={styles.heading}>Settings</Text>
                <Text style={styles.subheading}>Manage your account preferences and budget configurations.</Text>
              </View>
              <Pressable style={styles.iconButton} onPress={() => setOpen(false)}>
                <Ionicons name="close" color={colors.ink} size={21} />
              </Pressable>
            </View>

            <View style={styles.tabs}>
              <View style={[styles.tab, styles.activeTab]}>
                <Ionicons name="settings-outline" color={colors.primary} size={18} />
                <Text style={styles.activeTabText}>General Preferences</Text>
              </View>
              <View style={styles.tab}>
                <Ionicons name="lock-closed-outline" color="#7f94b6" size={18} />
                <Text style={styles.tabText}>Security & Privacy</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>General Preferences</Text>
              <Text style={styles.cardSubtitle}>Manage your profile and basic settings.</Text>

              <View style={styles.profileRow}>
                <View style={styles.largeAvatar}>
                  <Text style={styles.largeAvatarText}>{initialsFor(user?.username)}</Text>
                </View>
                <View style={styles.profileCopy}>
                  <Text style={styles.label}>Profile Photo</Text>
                  <Pressable style={styles.uploadButton}>
                    <Text style={styles.uploadText}>Upload Photo</Text>
                  </Pressable>
                  <Text style={styles.helpText}>PNG, JPG or GIF (max. 2MB)</Text>
                </View>
              </View>

              <View style={styles.preference}>
                <View style={styles.preferenceLabel}>
                  <Ionicons name="globe-outline" color="#7f94b6" size={18} />
                  <Text style={styles.label}>Preferred Currency</Text>
                </View>
                <View style={styles.selectBox}>
                  <Text style={styles.selectText}>Vietnamese Dong (₫)</Text>
                  <Ionicons name="chevron-down" color="#8a99ad" size={18} />
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable style={styles.saveButton} onPress={() => setOpen(false)}>
                  <Text style={styles.saveText}>Save Changes</Text>
                </Pressable>
                <Pressable style={styles.cancelButton} onPress={() => setOpen(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </View>
            </View>

            <Pressable style={styles.logoutButton} onPress={auth?.logout}>
              <Ionicons name="log-out-outline" color={colors.rose} size={19} />
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#e6fffb",
    borderWidth: 1,
    borderColor: "#99f6e4",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: { color: colors.primary, fontWeight: "900" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.25)",
    padding: 16,
    justifyContent: "center"
  },
  panel: {
    maxHeight: "92%",
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border
  },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  heading: { color: colors.ink, fontSize: 30, fontWeight: "900" },
  subheading: { color: "#55708f", fontSize: 14, lineHeight: 20, marginTop: 4 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border
  },
  tabs: {
    marginTop: 18,
    padding: 8,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6
  },
  tab: { minHeight: 48, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14 },
  activeTab: { backgroundColor: "#ecfdf5", borderWidth: 1, borderColor: "#ccfbf1" },
  activeTabText: { color: colors.primary, fontWeight: "900" },
  tabText: { color: "#40516a", fontWeight: "800" },
  card: {
    marginTop: 16,
    padding: 18,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardTitle: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  cardSubtitle: { color: "#55708f", marginTop: 4, fontWeight: "700" },
  profileRow: { flexDirection: "row", alignItems: "center", marginTop: 24, gap: 16 },
  largeAvatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#ccfbf1",
    alignItems: "center",
    justifyContent: "center"
  },
  largeAvatarText: { color: colors.primary, fontSize: 22, fontWeight: "900" },
  profileCopy: { flex: 1 },
  label: { color: "#26364d", fontWeight: "900" },
  uploadButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
    paddingHorizontal: 14
  },
  uploadText: { color: "#26364d", fontWeight: "900" },
  helpText: { color: "#8a9bb5", fontSize: 11, fontWeight: "800", marginTop: 7 },
  preference: { marginTop: 28 },
  preferenceLabel: { flexDirection: "row", alignItems: "center", gap: 9 },
  selectBox: {
    marginTop: 10,
    minHeight: 42,
    maxWidth: 240,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  selectText: { color: "#26364d", fontWeight: "900" },
  actions: {
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#edf2f7",
    flexDirection: "row",
    alignItems: "center",
    gap: 18
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    paddingHorizontal: 28
  },
  saveText: { color: colors.surface, fontWeight: "900" },
  cancelButton: { minHeight: 48, justifyContent: "center", paddingHorizontal: 10 },
  cancelText: { color: "#8a99ad", fontWeight: "900" },
  logoutButton: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#fecdd3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  logoutText: { color: colors.rose, fontWeight: "900" }
});
