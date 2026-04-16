import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: API_URL.endsWith("/api") ? API_URL : `${API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hl_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("hl_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
