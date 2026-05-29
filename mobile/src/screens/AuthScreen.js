import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { loginUser, registerUser } from "../api/client";
import { colors } from "../theme";

const initialLogin = { username: "", password: "" };
const initialRegister = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone_number: "",
  avatar_url: ""
};

function getAuthErrorMessage(err, fallback) {
  const detail = err.response?.data?.detail || err.response?.data?.message;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }
  if (Array.isArray(detail)) {
    const list = detail.map((item) => item.msg).filter(Boolean).join(" ");
    if (list) return list;
  }

  const url = err.config?.baseURL ? `${err.config.baseURL}${err.config.url || ""}` : err.config?.url;
  const status = err.response?.status;
  const base = err.message || fallback;

  if (status && url) {
    return `${base} (${status} ${url})`;
  }
  if (url) {
    return `${base} (${url})`;
  }
  return base;
}

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [remember, setRemember] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isRegister = mode === "register";

  async function submitLogin() {
    setError("");
    if (!loginForm.username.trim() || !loginForm.password) {
      setError("Enter your username and password.");
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser({
        username: loginForm.username.trim(),
        password: loginForm.password
      });
      onAuthenticated?.(result);
    } catch (err) {
      setError(getAuthErrorMessage(err, "Could not sign in. Check your username and password."));
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister() {
    setError("");
    if (!registerForm.username.trim()) {
      setError("Username is required.");
      return;
    }
    if (registerForm.username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!registerForm.email.trim() || !registerForm.email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,72}$/.test(registerForm.password)) {
      setError("Password must be 8+ characters with a letter, number, and special character.");
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser({
        username: registerForm.username.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        phone_number: registerForm.phone_number.trim() || null,
        avatar_url: registerForm.avatar_url.trim() || null,
        profile_avatar: registerForm.avatar_url.trim() || null
      });
      if (result?.access_token) {
        onAuthenticated?.(result);
      } else {
        setMode("login");
        setLoginForm((current) => ({ ...current, username: registerForm.username.trim() }));
        setError(result?.message || "Account created. Sign in to continue.");
      }
    } catch (err) {
      setError(getAuthErrorMessage(err, "Could not create account. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.root}>
      <LinearGradient colors={["#ffffff", "#f4f8fc"]} style={[styles.background, isRegister && styles.registerBackground]}>
        <Brand />
        {isRegister ? (
          <RegisterCard
            form={registerForm}
            setForm={setRegisterForm}
            error={error}
            loading={loading}
            passwordVisible={passwordVisible}
            setPasswordVisible={setPasswordVisible}
            confirmVisible={confirmVisible}
            setConfirmVisible={setConfirmVisible}
            onSubmit={submitRegister}
            onSwitch={() => {
              setError("");
              setMode("login");
            }}
          />
        ) : (
          <LoginCard
            form={loginForm}
            setForm={setLoginForm}
            remember={remember}
            setRemember={setRemember}
            error={error}
            loading={loading}
            passwordVisible={passwordVisible}
            setPasswordVisible={setPasswordVisible}
            onSubmit={submitLogin}
            onSwitch={() => {
              setError("");
              setMode("register");
            }}
          />
        )}
        <Text style={styles.footer}>© 2026 BudgetMate. All rights reserved.</Text>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

function Brand() {
  return (
    <View style={styles.brand}>
      <LinearGradient colors={["#536da8", "#e25b5f"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logo}>
        <Ionicons name="lock-closed-outline" color={colors.surface} size={27} />
      </LinearGradient>
      <Text style={styles.name}>BudgetMate</Text>
      <Text style={styles.tagline}>Smart Financial Management</Text>
    </View>
  );
}

function LoginCard({ form, setForm, remember, setRemember, error, loading, passwordVisible, setPasswordVisible, onSubmit, onSwitch }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to your BudgetMate account</Text>

      <Field icon="person-outline" label="Username" placeholder="johndoe" value={form.username} autoCapitalize="none" onChangeText={(username) => setForm((current) => ({ ...current, username }))} />

      <View style={styles.passwordLabelRow}>
        <Text style={styles.label}>Password</Text>
        <Pressable><Text style={styles.forgot}>Forgot password?</Text></Pressable>
      </View>
      <Field
        icon="lock-closed-outline"
        placeholder="••••••••"
        value={form.password}
        secureTextEntry={!passwordVisible}
        onChangeText={(password) => setForm((current) => ({ ...current, password }))}
        right={<EyeButton visible={passwordVisible} onPress={() => setPasswordVisible((current) => !current)} />}
      />

      <Pressable style={styles.rememberRow} onPress={() => setRemember((current) => !current)}>
        <View style={[styles.checkbox, remember && styles.checkboxActive]}>
          {remember && <Ionicons name="checkmark" color={colors.surface} size={14} />}
        </View>
        <Text style={styles.rememberText}>Remember this session</Text>
      </Pressable>

      <ErrorText text={error} />
      <SubmitButton label="Sign In" loading={loading} onPress={onSubmit} />

      <Divider text="New to BudgetMate?" />
      <Pressable onPress={onSwitch}>
        <Text style={styles.createText}>Create an account <Text style={styles.createLink}>here</Text></Text>
      </Pressable>
    </View>
  );
}

function RegisterCard({ form, setForm, error, loading, passwordVisible, setPasswordVisible, confirmVisible, setConfirmVisible, onSubmit, onSwitch }) {
  return (
    <View style={[styles.panel, styles.registerPanel]}>
      <Text style={styles.title}>Create an Account</Text>
      <Text style={styles.subtitle}>Join BudgetMate to start tracking</Text>

      <Field icon="person-outline" label="Username" placeholder="johndoe" value={form.username} autoCapitalize="none" onChangeText={(username) => setForm((current) => ({ ...current, username }))} />
      <Field icon="mail-outline" label="Email Address" placeholder="you@example.com" value={form.email} keyboardType="email-address" autoCapitalize="none" onChangeText={(email) => setForm((current) => ({ ...current, email }))} />

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <Field icon="lock-closed-outline" label="Password" placeholder="••••••••" value={form.password} secureTextEntry={!passwordVisible} onChangeText={(password) => setForm((current) => ({ ...current, password }))} right={<EyeButton visible={passwordVisible} onPress={() => setPasswordVisible((current) => !current)} />} />
        </View>
        <View style={styles.column}>
          <Field icon="lock-closed-outline" label="Confirm Password" placeholder="••••••••" value={form.confirmPassword} secureTextEntry={!confirmVisible} onChangeText={(confirmPassword) => setForm((current) => ({ ...current, confirmPassword }))} right={<EyeButton visible={confirmVisible} onPress={() => setConfirmVisible((current) => !current)} />} />
        </View>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <Field icon="call-outline" label="Phone Number (Optional)" placeholder="+1234567890" value={form.phone_number} keyboardType="phone-pad" onChangeText={(phone_number) => setForm((current) => ({ ...current, phone_number }))} />
        </View>
        <View style={styles.column}>
          <Field icon="image-outline" label="Avatar URL (Optional)" placeholder="https://..." value={form.avatar_url} autoCapitalize="none" onChangeText={(avatar_url) => setForm((current) => ({ ...current, avatar_url }))} />
        </View>
      </View>

      <ErrorText text={error} />
      <SubmitButton label="Sign Up" loading={loading} onPress={onSubmit} register />

      <Divider text="Already have an account?" />
      <Pressable onPress={onSwitch}>
        <Text style={styles.createText}><Text style={styles.createLink}>Sign In here</Text></Text>
      </Pressable>
    </View>
  );
}

function Field({ icon, label, right, placeholder, ...props }) {
  return (
    <View style={styles.field}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrap}>
        <Ionicons name={icon} color="#81848b" size={21} />
        <TextInput {...props} placeholder={placeholder} placeholderTextColor="#7d8490" style={styles.input} />
        {right}
      </View>
    </View>
  );
}

function EyeButton({ visible, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} color="#7b7f87" size={21} />
    </Pressable>
  );
}

function ErrorText({ text }) {
  if (!text) return null;
  return <Text style={styles.error}>{text}</Text>;
}

function SubmitButton({ label, loading, onPress }) {
  return (
    <Pressable style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryText}>{label}</Text>}
    </Pressable>
  );
}

function Divider({ text }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.divider} />
      <Text style={styles.dividerText}>{text}</Text>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  background: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 30,
    justifyContent: "center"
  },
  registerBackground: {
    paddingTop: 26,
    paddingBottom: 20
  },
  brand: { alignItems: "center", marginBottom: 34 },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4f5f99",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7
  },
  name: { color: "#020617", fontSize: 27, fontWeight: "900", marginTop: 18 },
  tagline: { color: "#6b7280", textAlign: "center", marginTop: 8, maxWidth: 310, fontSize: 16, fontWeight: "500" },
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
  registerPanel: {
    maxWidth: 492
  },
  title: { color: "#020617", fontSize: 24, fontWeight: "900" },
  subtitle: { color: "#6b7280", fontSize: 16, marginTop: 7, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { color: "#020617", fontSize: 16, fontWeight: "500", marginBottom: 8 },
  passwordLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  forgot: { color: "#315da8", fontSize: 13, fontWeight: "500", marginBottom: 8 },
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
  input: { flex: 1, color: "#111827", fontSize: 16, fontWeight: "500", marginLeft: 12 },
  twoColumn: {
    flexDirection: Platform.OS === "web" ? "row" : "column",
    gap: Platform.OS === "web" ? 18 : 0
  },
  column: {
    flex: 1
  },
  rememberRow: { flexDirection: "row", alignItems: "center", marginTop: 2, marginBottom: 28 },
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
  checkboxActive: { backgroundColor: "#9aa9cf", borderColor: "#9aa9cf" },
  rememberText: { color: "#020617", fontSize: 15 },
  error: {
    color: "#dc2626",
    fontWeight: "700",
    marginBottom: 12,
    lineHeight: 19
  },
  primaryButton: {
    height: 41,
    borderRadius: 7,
    backgroundColor: "#4b67b4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 38
  },
  primaryButtonDisabled: {
    opacity: 0.7
  },
  primaryText: { color: colors.surface, fontWeight: "900", fontSize: 15 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 34 },
  divider: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dividerText: { color: "#6b7280", marginHorizontal: 10, fontSize: 13 },
  createText: { color: "#6b7280", textAlign: "center", fontSize: 14 },
  createLink: { color: "#1d4f8f", fontWeight: "900" },
  footer: { color: "#6b7280", textAlign: "center", marginTop: 28, fontSize: 13 }
});
