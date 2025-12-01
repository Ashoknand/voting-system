import apiClient from "./api";

export const getProfile = async () => {
  const res = await apiClient.get("/profile");
  return res.data;
};

export const updateProfile = async (formData) => {
  const res = await apiClient.put("/profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

