import axios from "axios";
import Constants from "expo-constants";
import {
  fallbackEducation,
  fallbackLeadership,
  fallbackProfile,
  fallbackProjects,
  fallbackSkills
} from "../data/fallback";

const baseURL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  "http://10.0.2.2:4000";

export const api = axios.create({
  baseURL,
  timeout: 10000
});

const fallbacks = {
  "/profile": fallbackProfile,
  "/projects": fallbackProjects,
  "/skills": fallbackSkills,
  "/education": fallbackEducation,
  "/leadership": fallbackLeadership
};

export async function getResource(path) {
  try {
    const response = await api.get(path);
    return { data: response.data, error: null, fromFallback: false };
  } catch (error) {
    return {
      data: fallbacks[path],
      error: error.response?.data?.message || error.message || "Unable to load data.",
      fromFallback: true
    };
  }
}

export async function sendContact(payload) {
  const response = await api.post("/contact", payload);
  return response.data;
}
