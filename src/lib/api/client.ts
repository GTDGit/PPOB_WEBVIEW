import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gateway.ppob.id";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token will be set from auth context
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token via bridge
      if (typeof window !== "undefined" && "PPOBBridge" in window) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newToken = (window as any).PPOBBridge.refreshToken();
          if (newToken) {
            setAuthToken(newToken);
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return apiClient.request(error.config);
          }
        } catch {
          // Bridge failed, let error propagate
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
