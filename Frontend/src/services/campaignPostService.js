import apiClient from "./api";

export const createCampaignPost = async (formData) => {
  const res = await apiClient.post("/campaign-posts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getMyCampaignPosts = async () => {
  const res = await apiClient.get("/campaign-posts/my");
  return res.data;
};

export const getApprovedCampaignPosts = async (params = {}) => {
  const res = await apiClient.get("/campaign-posts/approved", { params });
  return res.data;
};

export const getAllCampaignPosts = async (params = {}) => {
  const res = await apiClient.get("/campaign-posts", { params });
  return res.data;
};

export const approveCampaignPost = async (id, message = "") => {
  const res = await apiClient.patch(`/campaign-posts/${id}/approve`, {
    message,
  });
  return res.data;
};

export const rejectCampaignPost = async (id, message = "") => {
  const res = await apiClient.patch(`/campaign-posts/${id}/reject`, {
    message,
  });
  return res.data;
};

export const updateCampaignPost = async (id, formData) => {
  const res = await apiClient.put(`/campaign-posts/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteCampaignPost = async (id) => {
  const res = await apiClient.delete(`/campaign-posts/${id}`);
  return res.data;
};

