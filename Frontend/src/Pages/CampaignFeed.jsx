import { useCallback, useEffect, useState } from "react";
import { useElections } from "../context/ElectionContext";
import { getApprovedCampaignPosts } from "../services/campaignPostService";
import { getImageUrl } from "../utils/imageUrl";

const CampaignFeed = () => {
  const { elections, activeElectionId, selectElection } = useElections();
  const [campaignPosts, setCampaignPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCampaignPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeElectionId ? { electionId: activeElectionId } : {};
      const data = await getApprovedCampaignPosts(params);
      setCampaignPosts(data);
    } catch (error) {
      console.error("Failed to load campaign posts", error);
    } finally {
      setLoading(false);
    }
  }, [activeElectionId]);

  useEffect(() => {
    loadCampaignPosts();
  }, [loadCampaignPosts]);

  const filteredPosts = campaignPosts;

  return (
    <section className="page">
      <div className="page__header">
        <h2>Campaign Feed</h2>
        <p>View approved campaign posts from candidates</p>
      </div>

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

      {loading ? (
        <p>Loading campaign posts...</p>
      ) : filteredPosts.length === 0 ? (
        <div className="card">
          <p>No campaign posts available yet.</p>
        </div>
      ) : (
        <div className="campaign-posts-grid">
          {filteredPosts.map((post) => (
            <article key={post._id} className="card campaign-post-card">
              {post.imageUrl && (
                <div className="campaign-post-image-wrapper">
                  <img
                    src={getImageUrl(post.imageUrl)}
                    alt={post.title}
                    className="campaign-post-image"
                    loading="lazy"
                    onError={(e) => {
                      console.error(
                        "Campaign feed image failed to load:",
                        post.imageUrl,
                        post
                      );
                      e.target.style.display = "none";
                      const wrapper = e.target.closest(
                        ".campaign-post-image-wrapper"
                      );
                      if (wrapper) {
                        wrapper.classList.add("campaign-post-image-wrapper--error");
                        wrapper.setAttribute("data-fallback", "true");
                      }
                    }}
                  />
                  <span className="campaign-post-image-fallback">
                    Image failed to load
                  </span>
                </div>
              )}
              <div className="campaign-post-content">
                <h3>{post.title}</h3>
                <p className="election-name">
                  <strong>Election:</strong> {post.election.name}
                </p>
                <p className="candidate-name">
                  <strong>Candidate:</strong> {post.candidate.user?.name}
                </p>
                <p>{post.content}</p>
                <p className="small">
                  Posted: {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default CampaignFeed;

