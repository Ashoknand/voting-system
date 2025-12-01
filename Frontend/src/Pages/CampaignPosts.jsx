import { useEffect, useState } from "react";
import { useElections } from "../context/ElectionContext";
import { useAuth } from "../context/AuthContext";
import {
  createCampaignPost,
  getMyCampaignPosts,
  updateCampaignPost,
  deleteCampaignPost,
} from "../services/campaignPostService";
import { getMyRegistrations } from "../services/electionRegistrationService";
import { getImageUrl } from "../utils/imageUrl";

const CampaignPosts = () => {
  const { elections, activeElectionId, selectElection } = useElections();
  const { user } = useAuth();
  const [campaignPosts, setCampaignPosts] = useState([]);
  const [approvedRegistrations, setApprovedRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingPost, setEditingPost] = useState(null);

  const [form, setForm] = useState({
    electionId: "",
    title: "",
    content: "",
    image: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeElectionId) {
      setForm((prev) => ({ ...prev, electionId: activeElectionId }));
      loadCampaignPosts();
    }
  }, [activeElectionId]);

  const loadData = async () => {
    try {
      const [posts, registrations] = await Promise.all([
        getMyCampaignPosts(),
        getMyRegistrations(),
      ]);
      setCampaignPosts(posts);
      setApprovedRegistrations(
        registrations.filter((r) => r.status === "approved")
      );
    } catch (error) {
      console.error("Failed to load data", error);
    }
  };

  const loadCampaignPosts = async () => {
    try {
      const data = await getMyCampaignPosts();
      setCampaignPosts(data);
    } catch (error) {
      console.error("Failed to load campaign posts", error);
    }
  };

  const canCreatePost = (electionId) => {
    return approvedRegistrations.some(
      (r) => r.election._id === electionId && r.status === "approved"
    );
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm((prev) => ({ ...prev, image: files[0] || null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.electionId || !form.title || !form.content) {
      setMessage("Please fill in all required fields");
      return;
    }

    if (!canCreatePost(form.electionId)) {
      setMessage("You must be approved for this election before creating campaign posts");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("electionId", form.electionId);
      formData.append("title", form.title);
      formData.append("content", form.content);
      if (form.image) {
        formData.append("image", form.image);
      }

      if (editingPost) {
        await updateCampaignPost(editingPost._id, formData);
        setMessage("Campaign post updated successfully!");
      } else {
        await createCampaignPost(formData);
        setMessage("Campaign post created successfully! Awaiting admin approval.");
      }

      setForm({
        electionId: activeElectionId || "",
        title: "",
        content: "",
        image: null,
      });
      setEditingPost(null);
      await loadCampaignPosts();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save campaign post");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post) => {
    // Allow editing pending and approved posts (but not rejected)
    if (post.status === "rejected") {
      setMessage("Cannot edit rejected campaign posts");
      return;
    }
    setEditingPost(post);
    setForm({
      electionId: post.election._id,
      title: post.title,
      content: post.content,
      image: null,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campaign post?")) {
      return;
    }

    try {
      await deleteCampaignPost(id);
      setMessage("Campaign post deleted");
      await loadCampaignPosts();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete campaign post");
    }
  };

  const filteredPosts = activeElectionId
    ? campaignPosts.filter((p) => p.election._id === activeElectionId)
    : campaignPosts;

  return (
    <section className="page">
      <div className="page__header">
        <h2>Campaign Posts</h2>
        <p>Create and manage your campaign posts</p>
      </div>

      {message && (
        <div className={`card ${message.includes("success") ? "success" : "error"}`}>
          <p>{message}</p>
        </div>
      )}

      <div className="select-group">
        <label htmlFor="election">Filter by Election</label>
        <select
          id="election"
          value={activeElectionId || ""}
          onChange={(e) => selectElection(e.target.value)}
        >
          <option value="">All Elections</option>
          {elections.map((election) => (
            <option key={election._id} value={election._id}>
              {election.name}
            </option>
          ))}
        </select>
      </div>

      <section className="card">
        <h3>{editingPost ? "Edit Campaign Post" : "Create New Campaign Post"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="electionId">Election *</label>
            <select
              id="electionId"
              name="electionId"
              value={form.electionId}
              onChange={handleChange}
              required
            >
              <option value="">Select an election</option>
              {elections
                .filter((e) => canCreatePost(e._id))
                .map((election) => (
                  <option key={election._id} value={election._id}>
                    {election.name}
                  </option>
                ))}
            </select>
            {form.electionId && !canCreatePost(form.electionId) && (
              <p className="error-text">
                You must be approved for this election to create campaign posts
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Enter campaign post title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              name="content"
              value={form.content}
              onChange={handleChange}
              required
              rows="6"
              placeholder="Enter your campaign message"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Image (optional)</label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={loading}>
              {loading
                ? "Saving..."
                : editingPost
                ? "Update Post"
                : "Create Post"}
            </button>
            {editingPost && (
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setEditingPost(null);
                  setForm({
                    electionId: activeElectionId || "",
                    title: "",
                    content: "",
                    image: null,
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <h3>My Campaign Posts</h3>
        {filteredPosts.length === 0 ? (
          <p>No campaign posts yet.</p>
        ) : (
          <div
            className="campaign-posts-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {filteredPosts.map((post) => (
              <article key={post._id} className="campaign-post-card">
                {post.imageUrl && (
                  <img
                    src={getImageUrl(post.imageUrl)}
                    alt={post.title}
                    className="campaign-post-image"
                    style={{
                      width: "100%",
                      height: "auto",
                      objectFit: "contain",
                      maxHeight: "300px",
                      borderRadius: "0.75rem",
                    }}
                    onError={(e) => {
                      console.error(
                        "Campaign post image failed to load:",
                        getImageUrl(post.imageUrl),
                        post
                      );
                      e.target.style.display = "none";
                      e.target.parentElement.innerHTML =
                        '<div style="padding: 1rem; text-align: center; color: #94a3b8;">Image failed to load<br/><small style="font-size: 0.75rem;">URL: ' +
                        getImageUrl(post.imageUrl) +
                        "</small></div>";
                    }}
                  />
                )}
                <div className="campaign-post-content">
                  <h4>{post.title}</h4>
                  <p className="election-name">{post.election.name}</p>
                  <p>{post.content}</p>
                  <div className="campaign-post-footer">
                    <span className={`status status-${post.status}`}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                    <div className="campaign-post-actions">
                      {(post.status === "pending" || post.status === "approved") && (
                        <>
                          <button
                            className="btn small"
                            onClick={() => handleEdit(post)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn small danger"
                            onClick={() => handleDelete(post._id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {post.message && (
                    <p className="small review-message">{post.message}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
};

export default CampaignPosts;

