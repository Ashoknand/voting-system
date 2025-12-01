import apiClient from "./api";

export const fetchDashboard = async () => {
  const res = await apiClient.get("/admin/dashboard");
  return res.data;
};

export const createElection = async (payload) => {
  const res = await apiClient.post("/admin/elections", payload);
  return res.data;
};

export const updateElection = async (id, payload) => {
  const res = await apiClient.put(`/admin/elections/${id}`, payload);
  return res.data;
};

export const toggleElection = async (id) => {
  const res = await apiClient.patch(`/admin/elections/${id}/toggle`);
  return res.data;
};

export const deleteElection = async (id) => {
  const res = await apiClient.delete(`/admin/elections/${id}`);
  return res.data;
};

export const createPost = async (payload) => {
  const res = await apiClient.post("/admin/posts", payload);
  return res.data;
};

export const updatePost = async (id, payload) => {
  const res = await apiClient.put(`/admin/posts/${id}`, payload);
  return res.data;
};

export const deletePost = async (id) => {
  const res = await apiClient.delete(`/admin/posts/${id}`);
  return res.data;
};

export const issueTokenForStudent = async (studentId, electionId) => {
  const res = await apiClient.post(`/admin/students/${studentId}/token`, {
    electionId,
  });
  return res.data;
};

