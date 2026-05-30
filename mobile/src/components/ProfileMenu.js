import React, { useCallback, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { colors } from "../theme";
import { useAuth } from "../context/AuthContext";
import { getCurrentUser, resolveMediaUrl } from "../api/client";

function initialsFor(username) {
  return (username || "BM").slice(0, 2).toUpperCase();
}

export default function ProfileMenu() {
  const auth = useAuth();
  const navigation = useNavigation();
  const user = auth?.user;
  const [currentUser, setCurrentUser] = useState(user || null);
  const [open, setOpen] = useState(false);
  const avatarUri = resolveMediaUrl(currentUser?.avatar_url);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (auth?.access_token) {
        getCurrentUser(auth.access_token)
          .then((data) => {
            if (active) setCurrentUser(data);
          })
          .catch(() => {});
      }
      return () => {
        active = false;
      };
    }, [auth?.access_token])
  );

  function go(route) {
    setOpen(false);
    navigation.navigate(route);
  }

  return (
    <>
      <Pressable accessibilityLabel="Open profile menu" style={styles.avatarButton} onPress={() => setOpen(true)}>
        {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initialsFor(currentUser?.username || user?.username)}</Text>}
      </Pressable>

      {open ? <Modal animationType="fade" transparent visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.panel}>
            <View style={styles.header}>
              <View>
                <Text style={styles.heading}>Account</Text>
                <Text style={styles.subheading}>{currentUser?.username || user?.username || "BudgetMate"}</Text>
              </View>
              <Pressable style={styles.iconButton} onPress={() => setOpen(false)}>
                <Ionicons name="close" color={colors.ink} size={21} />
              </Pressable>
            </View>

            <View style={styles.card}>
              <Pressable style={styles.menuRow} onPress={() => go("Profile")}>
                <Ionicons name="person-outline" color={colors.primary} size={20} />
                <Text style={styles.menuText}>Profile Details</Text>
              </Pressable>
              <Pressable style={styles.menuRow} onPress={() => go("ChangeProfilePhoto")}>
                <Ionicons name="camera-outline" color={colors.primary} size={20} />
                <Text style={styles.menuText}>Profile Photo</Text>
              </Pressable>
              <Pressable style={styles.menuRow} onPress={() => go("Accounts")}>
                <Ionicons name="business-outline" color={colors.primary} size={20} />
                <Text style={styles.menuText}>Accounts Overview</Text>
              </Pressable>
            </View>

            <Pressable style={styles.logoutButton} onPress={auth?.logout}>
              <Ionicons name="log-out-outline" color={colors.rose} size={19} />
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>
        </View>
      </Modal> : null}
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
    justifyContent: "center",
    overflow: "hidden"
  },
  avatarImage: { width: "100%", height: "100%" },
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
  menuRow: {
    minHeight: 52,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12
  },
  menuText: {
    color: colors.ink,
    fontWeight: "900"
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
