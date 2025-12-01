import apiClient from "./api";

export const fetchCandidates = async (params = {}) => {
  const res = await apiClient.get("/candidates", { params });
  return res.data;
};

export const fetchCandidate = async (id) => {
  const res = await apiClient.get(`/candidates/${id}`);
  return res.data;
};

export const updateCandidateProfile = async (id, formData) => {
  const res = await apiClient.put(`/candidates/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const approveCandidate = async (id) => {
  const res = await apiClient.patch(`/candidates/${id}/approve`);
  return res.data;
};

export const assignCandidateToPost = async (id, payload) => {
  const res = await apiClient.post(`/candidates/${id}/assign`, payload);
  return res.data;
};

export const removeCandidateFromPost = async (id, payload) => {
  try {
    console.log("removeCandidateFromPost service called:", { id, payload });
    const res = await apiClient.post(`/candidates/${id}/remove`, payload);
    console.log("removeCandidateFromPost response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error in removeCandidateFromPost service:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    throw error;
  }
};

export const updateCandidate = async (id, formData) => {
  const res = await apiClient.put(`/candidates/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteCandidate = async (id) => {
  const res = await apiClient.delete(`/candidates/${id}`);
  return res.data;
};

export const blockCandidate = async (id) => {
  const res = await apiClient.patch(`/candidates/${id}/block`);
  return res.data;
};

export const unblockCandidate = async (id) => {
  const res = await apiClient.patch(`/candidates/${id}/unblock`);
  return res.data;
};

