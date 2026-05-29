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
  "http://127.0.0.1:8000/api/v1";

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

export async function loginUser(payload) {
  const response = await api.post("/auth/login", payload);
  return response.data;
}

export async function registerUser(payload) {
  const response = await api.post("/auth/register", payload);
  return response.data;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function createTransaction(token, payload) {
  const response = await api.post("/transactions/", payload, { headers: authHeaders(token) });
  return response.data;
}

export async function updateTransaction(token, transactionId, payload) {
  const response = await api.put(`/transactions/${transactionId}`, payload, { headers: authHeaders(token) });
  return response.data;
}

export async function deleteTransaction(token, transactionId) {
  const response = await api.delete(`/transactions/${transactionId}`, { headers: authHeaders(token) });
  return response.data;
}

export async function createCategory(token, payload) {
  const response = await api.post("/users/categories", payload, { headers: authHeaders(token) });
  return response.data;
}

export async function updateCategory(token, categoryId, payload) {
  const response = await api.put(`/users/categories/${categoryId}`, payload, { headers: authHeaders(token) });
  return response.data;
}

export async function deleteCategory(token, categoryId) {
  const response = await api.delete(`/users/categories/${categoryId}`, { headers: authHeaders(token) });
  return response.data;
}
