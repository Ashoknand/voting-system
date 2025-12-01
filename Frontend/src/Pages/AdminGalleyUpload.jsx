import { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import {
  getAllGallery,
  uploadGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} from "../services/galleryService";
import { getImageUrl } from "../utils/imageUrl";

const AdminGalleryUpload = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file: null,
  });

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const items = await getAllGallery();
      setGalleryItems(items);
    } catch (err) {
      setStatus("Failed to load gallery items");
      console.error("Error loading gallery:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setStatus("File size must be less than 50MB");
        return;
      }
      setFormData((prev) => ({ ...prev, file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");

    if (!formData.file && !editingItem) {
      setStatus("Please select a file to upload");
      return;
    }

    if (!formData.title.trim()) {
      setStatus("Title is required");
      return;
    }

    try {
      setLoading(true);
      console.log("Submitting gallery item:", { editingItem: editingItem?._id, formData });

      if (editingItem) {
        // Update existing item
        const updateFormData = new FormData();
        updateFormData.append("title", formData.title);
        updateFormData.append("description", formData.description);
        updateFormData.append("isActive", editingItem.isActive);
        
        // Include file if a new one is selected
        if (formData.file) {
          updateFormData.append("file", formData.file);
          console.log("Including new file in update");
        }

        await updateGalleryItem(editingItem._id, updateFormData);
        console.log("Gallery item updated successfully");
        setStatus("Gallery item updated successfully");
      } else {
        // Upload new item
        const uploadFormData = new FormData();
        uploadFormData.append("file", formData.file);
        uploadFormData.append("title", formData.title);
        uploadFormData.append("description", formData.description);

        await uploadGalleryItem(uploadFormData);
        console.log("Gallery item uploaded successfully");
        setStatus("Gallery item uploaded successfully");
      }

      setFormData({ title: "", description: "", file: null });
      setEditingItem(null);
      await loadGallery();
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setStatus(
        err.response?.data?.message || "Failed to process gallery item"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      file: null,
    });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setFormData({ title: "", description: "", file: null });
  };

  const handleToggleActive = async (item) => {
    try {
      console.log("Toggling active status for gallery item:", item._id);
      await updateGalleryItem(item._id, { isActive: !item.isActive });
      console.log("Gallery item status updated successfully");
      await loadGallery();
      setStatus("Gallery item status updated");
    } catch (err) {
      console.error("Error updating gallery item status:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setStatus(err.response?.data?.message || "Failed to update gallery item status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this gallery item? This action cannot be undone and will also delete the file from the server.")) {
      console.log("Delete cancelled by user");
      return;
    }

    try {
      console.log("Deleting gallery item:", id);
      await deleteGalleryItem(id);
      console.log("Gallery item deleted successfully");
      await loadGallery();
      setStatus("Gallery item deleted successfully");
    } catch (err) {
      console.error("Error deleting gallery item:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setStatus(err.response?.data?.message || "Failed to delete gallery item");
    }
  };

  const sidebarSections = [
    { label: "Upload", path: "#upload" },
    { label: "Manage", path: "#manage" },
  ];

  return (
    <section className="page admin-grid">
      <AdminSidebar sections={sidebarSections} />
      <div className="page">
        {status && (
          <p className={status.includes("Failed") ? "error" : "info"}>
            {status}
          </p>
        )}

        <section id="upload" className="card">
          <h3>{editingItem ? "Edit Gallery Item" : "Upload Gallery Item"}</h3>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Title *
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
                placeholder="Enter title"
              />
            </label>
            <label>
              Description
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter description (optional)"
                rows="3"
              />
            </label>
            <label>
              {editingItem ? "Replace File (Image or Video)" : "File (Image or Video) *"}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                required={!editingItem}
              />
              <small style={{ color: "#64748b", marginTop: "0.25rem" }}>
                {editingItem 
                  ? "Leave empty to keep current file. Select a new file to replace it."
                  : "Supported: Images (JPEG, PNG, WebP, GIF) and Videos (MP4, WebM, OGG, MOV). Max size: 50MB"}
              </small>
              {editingItem && formData.file && (
                <small style={{ color: "#10b981", marginTop: "0.25rem", display: "block" }}>
                  New file selected: {formData.file.name}
                </small>
              )}
            </label>
            <div className="hero__cta">
              <button className="btn" type="submit" disabled={loading}>
                {loading
                  ? "Processing..."
                  : editingItem
                  ? "Update Item"
                  : "Upload Item"}
              </button>
              {editingItem && (
                <button
                  className="btn secondary"
                  type="button"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section id="manage" className="card">
          <h3>Manage Gallery Items</h3>
          {loading && galleryItems.length === 0 ? (
            <p>Loading gallery items...</p>
          ) : galleryItems.length === 0 ? (
            <p>No gallery items yet. Upload your first item above.</p>
          ) : (
            <div className="gallery-grid">
              {galleryItems.map((item, index) => (
                <article key={item._id} className="card gallery-item">
                  <div className="gallery-item__media">
                    {item.fileType === "image" ? (
                      <img 
                        src={getImageUrl(item.fileUrl)}
                        alt={item.title}
                        loading={index < 6 ? "eager" : "lazy"}
                        onError={(e) => {
                          console.error("Image failed to load:", getImageUrl(item.fileUrl), item);
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML =
                            '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; padding: 1rem; text-align: center;">Image failed to load<br/><small style="font-size: 0.75rem;">URL: ' + getImageUrl(item.fileUrl) + '</small></div>';
                        }}
                      />
                    ) : (
                      <video
                        src={getImageUrl(item.fileUrl)}
                        controls
                        preload="metadata"
                        onError={(e) => {
                          console.error("Video failed to load:", getImageUrl(item.fileUrl), item);
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML =
                            '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; padding: 1rem; text-align: center;">Video failed to load<br/><small style="font-size: 0.75rem;">URL: ' + getImageUrl(item.fileUrl) + '</small></div>';
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                  <div className="gallery-item__content">
                    <h4>{item.title}</h4>
                    {item.description && <p>{item.description}</p>}
                    <small>
                      Type: {item.fileType} | Uploaded:{" "}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </small>
                    <div className="hero__cta" style={{ marginTop: "0.75rem" }}>
                      <button
                        className="btn secondary"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className={`btn ${item.isActive ? "secondary" : ""}`}
                        onClick={() => handleToggleActive(item)}
                      >
                        {item.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        className="btn secondary"
                        onClick={() => handleDelete(item._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
};

export default AdminGalleryUpload;

