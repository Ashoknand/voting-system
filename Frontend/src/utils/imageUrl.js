import { API_BASE_URL } from "../services/api";

/**
 * Constructs the full URL for an uploaded file
 * @param {string} fileUrl - The file URL from the database (e.g., "/uploads/gallery-123.jpg")
 * @returns {string} - Full URL to the file
 */
export const getImageUrl = (fileUrl) => {
  if (!fileUrl) return "";
  
  // If fileUrl already starts with http, return as is
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }
  
  // Remove /api from API_BASE_URL to get base server URL
  const baseUrl = API_BASE_URL.replace("/api", "");
  
  // Ensure fileUrl starts with /
  const normalizedFileUrl = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  
  return `${baseUrl}${normalizedFileUrl}`;
};

