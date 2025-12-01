import apiClient from "./api";

export const registerForElection = async (payload) => {
  const res = await apiClient.post("/election-registrations", payload);
  return res.data;
};

export const getMyRegistrations = async () => {
  const res = await apiClient.get("/election-registrations/my");
  return res.data;
};

export const getAllRegistrations = async (params = {}) => {
  const res = await apiClient.get("/election-registrations", { params });
  return res.data;
};

export const approveRegistration = async (id, message = "") => {
  const res = await apiClient.patch(`/election-registrations/${id}/approve`, {
    message,
  });
  return res.data;
};

export const rejectRegistration = async (id, message = "") => {
  const res = await apiClient.patch(`/election-registrations/${id}/reject`, {
    message,
  });
  return res.data;
};

