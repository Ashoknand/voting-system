import apiClient from "./api";

// Get gallery items (for students)
export const getGallery = async () => {
  const res = await apiClient.get("/gallery");
  return res.data;
};

// Get all gallery items (for admin)
export const getAllGallery = async () => {
  const res = await apiClient.get("/gallery/admin/all");
  return res.data;
};

// Upload gallery item
export const uploadGalleryItem = async (formData) => {
  const res = await apiClient.post("/gallery/admin/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Update gallery item
export const updateGalleryItem = async (id, formData) => {
  const res = await apiClient.put(`/gallery/admin/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Delete gallery item
export const deleteGalleryItem = async (id) => {
  const res = await apiClient.delete(`/gallery/admin/${id}`);
  return res.data;
};

