import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { registerPushToken, unregisterPushToken } from "../api/client";

const STORED_PUSH_TOKEN_KEY = "budgetmate.pushToken";

export async function requestNotificationPermission() {
  // Future-ready placeholder: connect Expo Notifications, FCM, or APNs here.
  // The app currently runs safely on web/local development without requesting native push permission.
  return { granted: false, reason: "Push notifications are not connected in this build." };
}

export async function registerDeviceToken(authToken, deviceToken) {
  if (!authToken || !deviceToken) return null;
  const platform = Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web";
  const saved = await registerPushToken(authToken, { device_token: deviceToken, platform });
  await AsyncStorage.setItem(STORED_PUSH_TOKEN_KEY, deviceToken);
  return saved;
}

export async function unregisterDeviceToken(authToken, deviceToken) {
  if (!authToken || !deviceToken) return null;
  const result = await unregisterPushToken(authToken, deviceToken);
  await AsyncStorage.removeItem(STORED_PUSH_TOKEN_KEY);
  return result;
}

export async function unregisterStoredDeviceToken(authToken) {
  const storedToken = await AsyncStorage.getItem(STORED_PUSH_TOKEN_KEY);
  if (!storedToken) return null;
  return unregisterDeviceToken(authToken, storedToken);
}
