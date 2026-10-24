import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "do_token";
const USER_KEY = "do_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user || null));
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function extractError(error) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong"
  );
}

/* ---------- Auth ---------- */
export const authApi = {
  register: (payload) => client.post("/auth/register", payload),
  login: (payload) => client.post("/auth/login", payload),
  me: () => client.get("/auth/me")
};

/* ---------- Datasets ---------- */
export const datasetApi = {
  list: () => client.get("/datasets"),
  get: (datasetId) => client.get(`/datasets/${datasetId}`),
  create: (formData) =>
    client.post("/datasets", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  remove: (datasetId) => client.delete(`/datasets/${datasetId}`)
};

/* ---------- Versions ---------- */
export const versionApi = {
  list: (datasetId) => client.get(`/datasets/${datasetId}/versions`),
  get: (datasetId, versionId) =>
    client.get(`/datasets/${datasetId}/versions/${versionId}`),
  create: (datasetId, formData) =>
    client.post(`/datasets/${datasetId}/versions`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
};

/* ---------- Provenance ---------- */
export const provenanceApi = {
  list: (datasetId) => client.get(`/datasets/${datasetId}/provenance`)
};

/* ---------- Blockchain ---------- */
export const blockchainApi = {
  history: (datasetId) => client.get(`/datasets/${datasetId}/blockchain`),
  latest: (datasetId) => client.get(`/datasets/${datasetId}/blockchain/latest`),
  transaction: (txHash) => client.get(`/blockchain/transaction/${txHash}`)
};

/* ---------- Verify ---------- */
export const verifyApi = {
  stored: (datasetId, versionId) =>
    client.post(`/datasets/${datasetId}/versions/${versionId}/verify`),
  file: (datasetId, versionId, formData) =>
    client.post(
      `/datasets/${datasetId}/versions/${versionId}/verify-file`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    )
};

export default client;