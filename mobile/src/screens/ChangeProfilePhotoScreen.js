import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Card, EmptyState } from "../components/Card";
import { Screen } from "../components/Layout";
import { getCurrentUser, resolveMediaUrl, uploadProfilePhoto } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

export default function ChangeProfilePhotoScreen() {
  const auth = useAuth();
  const [user, setUser] = useState(auth?.user || null);
  const [consent, setConsent] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setUser(await getCurrentUser(auth.access_token));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not load profile photo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function choosePhoto() {
    setError("");
    setSuccess("");
    if (!consent) {
      setError("Confirm consent before opening your photo library.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library permission was not granted.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri || !asset?.base64) {
      setError("Could not read the selected image. Try another photo.");
      return;
    }
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      setError("Choose an image that is 5MB or smaller.");
      return;
    }
    setSelected({
      uri: asset.uri,
      base64: asset.base64,
      mimeType: asset.mimeType || "image/jpeg",
      filename: asset.fileName || "profile-photo.jpg"
    });
  }

  async function savePhoto() {
    setError("");
    setSuccess("");
    if (!selected) {
      setError("Choose a photo before saving.");
      return;
    }

    setSaving(true);
    try {
      const updated = await uploadProfilePhoto(auth.access_token, {
        image_base64: selected.base64,
        mime_type: selected.mimeType,
        filename: selected.filename
      });
      setUser(updated);
      setSelected(null);
      setSuccess("Profile photo saved.");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not save profile photo.");
    } finally {
      setSaving(false);
    }
  }

  const currentPhoto = selected?.uri || resolveMediaUrl(user?.avatar_url);
  const initials = (user?.username || "BM").slice(0, 2).toUpperCase();

  return (
    <Screen eyebrow="Profile" title="Change Profile Photo" refreshing={loading} onRefresh={load}>
      {!!error && <EmptyState title="Photo update needs attention" message={error} />}
      <Card>
        <Text style={styles.cardTitle}>Profile Photo</Text>
        <Text style={styles.help}>Choose an image, preview it, then save it to your account.</Text>

        <View style={styles.previewWrap}>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : currentPhoto ? (
            <Image source={{ uri: currentPhoto }} style={styles.preview} />
          ) : (
            <View style={styles.previewFallback}>
              <Text style={styles.previewInitials}>{initials}</Text>
            </View>
          )}
        </View>

        <Pressable style={styles.consentRow} onPress={() => setConsent((current) => !current)}>
          <View style={[styles.checkbox, consent && styles.checkboxActive]}>
            {consent && <Ionicons name="checkmark" color={colors.surface} size={14} />}
          </View>
          <Text style={styles.consentText}>I allow BudgetMate to open my photo library so I can choose a profile image.</Text>
        </Pressable>

        {!!success && <Text style={styles.success}>{success}</Text>}

        <View style={styles.actions}>
          <Pressable style={[styles.secondaryButton, !consent && styles.disabled]} disabled={!consent || saving} onPress={choosePhoto}>
            <Ionicons name="image-outline" color={colors.ink} size={18} />
            <Text style={styles.secondaryText}>Choose Photo</Text>
          </Pressable>
          <Pressable style={[styles.primaryButton, (!selected || saving) && styles.disabled]} disabled={!selected || saving} onPress={savePhoto}>
            <Ionicons name="cloud-upload-outline" color={colors.surface} size={18} />
            <Text style={styles.primaryText}>{saving ? "Saving..." : "Save Photo"}</Text>
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  help: { color: colors.muted, lineHeight: 20, marginTop: 6, fontWeight: "700" },
  previewWrap: { alignSelf: "center", width: 148, height: 148, borderRadius: 44, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginTop: 18, overflow: "hidden" },
  preview: { width: "100%", height: "100%" },
  previewFallback: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
  previewInitials: { color: colors.surface, fontSize: 38, fontWeight: "900" },
  consentRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 18, borderRadius: 12, borderWidth: 1, borderColor: "#bfdbfe", backgroundColor: "#eff6ff", padding: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkboxActive: { backgroundColor: colors.primary },
  consentText: { flex: 1, color: colors.primaryDark, fontWeight: "800", lineHeight: 19 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  secondaryButton: { flexGrow: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 12 },
  secondaryText: { color: colors.ink, fontWeight: "900" },
  primaryButton: { flexGrow: 1, minHeight: 48, borderRadius: 12, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 12 },
  primaryText: { color: colors.surface, fontWeight: "900" },
  disabled: { opacity: 0.55 },
  success: { color: colors.success, fontWeight: "800", marginTop: 12 }
});
