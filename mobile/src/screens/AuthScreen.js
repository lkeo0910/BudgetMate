import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme";

export default function AuthScreen({ onAuthenticated }) {
  const [form, setForm] = useState({
    username: "",
    password: ""
  });
  const [remember, setRemember] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  function submit() {
    onAuthenticated?.({
      username: form.username.trim() || "demo_user",
      email: "demo@budgetmate.com"
    });
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.root}>
      <LinearGradient colors={["#ffffff", "#f4f8fc"]} style={styles.background}>
        <View style={styles.brand}>
          <LinearGradient colors={["#536da8", "#e25b5f"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logo}>
            <Ionicons name="lock-closed-outline" color={colors.surface} size={27} />
          </LinearGradient>
          <Text style={styles.name}>BudgetMate</Text>
          <Text style={styles.tagline}>Smart Financial Management</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your BudgetMate account</Text>

          <Field
            icon="person-outline"
            label="Username"
            placeholder="johndoe"
            value={form.username}
            autoCapitalize="none"
            onChangeText={(username) => setForm((current) => ({ ...current, username }))}
          />

          <View style={styles.passwordLabelRow}>
            <Text style={styles.label}>Password</Text>
            <Pressable>
              <Text style={styles.forgot}>Forgot password?</Text>
            </Pressable>
          </View>
          <Field
            icon="lock-closed-outline"
            placeholder="••••••••"
            value={form.password}
            secureTextEntry={!passwordVisible}
            onChangeText={(password) => setForm((current) => ({ ...current, password }))}
            right={
              <Pressable onPress={() => setPasswordVisible((current) => !current)}>
                <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} color="#7b7f87" size={21} />
              </Pressable>
            }
          /> 

          <Pressable style={styles.rememberRow} onPress={() => setRemember((current) => !current)}>
            <View style={[styles.checkbox, remember && styles.checkboxActive]}>
              {remember && <Ionicons name="checkmark" color={colors.surface} size={14} />}
            </View>
            <Text style={styles.rememberText}>Remember this session</Text>
          </Pressable>

          <Pressable style={styles.primaryButton} onPress={submit}>
            <Text style={styles.primaryText}>Sign In</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>New to BudgetMate?</Text>
            <View style={styles.divider} />
          </View>

          <Text style={styles.createText}>
            Create an account <Text style={styles.createLink}>here</Text>
          </Text>
        </View>

        <Text style={styles.footer}>© 2026 BudgetMate. All rights reserved.</Text>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

function Field({ icon, label, right, placeholder, ...props }) {
  return (
    <View style={styles.field}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrap}>
        <Ionicons name={icon} color={colors.muted} size={19} />
        <TextInput {...props} placeholder={placeholder} placeholderTextColor="#7d8490" style={styles.input} />
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  background: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 30,
    justifyContent: "center"
  },
  brand: {
    alignItems: "center",
    marginBottom: 34
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 13,
    backgroundColor: "#9aa9cf",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4f5f99",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7
  },
  name: {
    color: "#020617",
    fontSize: 27,
    fontWeight: "900",
    marginTop: 18
  },
  tagline: {
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
    maxWidth: 310,
    fontSize: 16,
    fontWeight: "500"
  },
  panel: {
    width: "100%",
    maxWidth: 492,
    alignSelf: "center",
    borderRadius: 17,
    paddingHorizontal: 36,
    paddingTop: 38,
    paddingBottom: 34,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.13,
    shadowRadius: 26,
    elevation: 9
  },
  title: {
    color: "#020617",
    fontSize: 24,
    fontWeight: "900"
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 16,
    marginTop: 7,
    marginBottom: 32
  },
  field: {
    marginBottom: 24
  },
  label: {
    color: "#020617",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8
  },
  passwordLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  forgot: {
    color: "#315da8",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8
  },
  inputWrap: {
    minHeight: 52,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#e2e5ea",
    backgroundColor: "#f0f0f1",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14
  },
  input: {
    flex: 1,
    color: "#111827",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 52
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#61779d",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  checkboxActive: {
    backgroundColor: "#9aa9cf",
    borderColor: "#9aa9cf"
  },
  rememberText: {
    color: "#020617",
    fontSize: 15
  },
  primaryButton: {
    height: 39,
    borderRadius: 7,
    backgroundColor: "#a9b7dc",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 38
  },
  primaryText: {
    color: colors.surface,
    fontWeight: "900",
    fontSize: 15
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 36
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb"
  },
  dividerText: {
    color: "#6b7280",
    marginHorizontal: 10,
    fontSize: 13
  },
  createText: {
    color: "#6b7280",
    textAlign: "center",
    fontSize: 14
  },
  createLink: {
    color: "#1d4f8f",
    fontWeight: "900"
  },
  footer: {
    color: "#6b7280",
    textAlign: "center",
    marginTop: 28,
    fontSize: 13
  }
});
