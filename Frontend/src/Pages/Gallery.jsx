import { useEffect, useState } from "react";
import { getGallery } from "../services/galleryService";
import { getImageUrl } from "../utils/imageUrl";

const Gallery = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      setLoading(true);
      setError("");
      const items = await getGallery();
      setGalleryItems(items);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load gallery. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="page">
        <div className="card">
          <p>Loading gallery...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page">
        <div className="card">
          <p className="error">{error}</p>
          <button className="btn" onClick={loadGallery}>
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="card">
        <header className="page__header">
          <div>
            <h2>Gallery</h2>
            <p>View images and videos from school events</p>
          </div>
        </header>

        {galleryItems.length === 0 ? (
          <p>No gallery items available yet. Check back later!</p>
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
                    {new Date(item.createdAt).toLocaleDateString()}
                  </small>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;

