import apiClient from "./api";

export const registerStudent = async (payload) => {
  const res = await apiClient.post("/auth/students/register", payload);
  return res.data;
};

export const registerCandidate = async (payload) => {
  const res = await apiClient.post("/auth/candidates/register", payload);
  return res.data;
};

export const login = async (payload) => {
  const res = await apiClient.post("/auth/login", payload);
  return res.data;
};

export const getProfile = async () => {
  const res = await apiClient.get("/auth/me");
  return res.data.user;
};

