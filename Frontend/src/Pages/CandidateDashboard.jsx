import { useEffect, useState } from "react";
import { useElections } from "../context/ElectionContext";
import { useAuth } from "../context/AuthContext";
import {
  registerForElection,
  getMyRegistrations,
} from "../services/electionRegistrationService";
import { fetchElectionPosts } from "../services/electionService";

const CandidateDashboard = () => {
  const { elections, activeElectionId, selectElection } = useElections();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const candidateGrade = (user?.grade || "").trim();

  useEffect(() => {
    loadRegistrations();
  }, []);

  useEffect(() => {
    if (activeElectionId) {
      loadPosts(activeElectionId);
    }
  }, [activeElectionId]);

  const loadPosts = async (electionId) => {
    try {
      const data = await fetchElectionPosts(electionId);
      setPosts(data);
    } catch (error) {
      console.error("Failed to load posts", error);
    }
  };

  const loadRegistrations = async () => {
    try {
      const data = await getMyRegistrations();
      setRegistrations(data);
    } catch (error) {
      console.error("Failed to load registrations", error);
    }
  };

  const handleRegister = async (electionId, postId) => {
    setLoading(true);
    setMessage("");
    try {
      await registerForElection({ electionId, postId });
      setMessage("Registration submitted successfully! Awaiting admin approval.");
      await loadRegistrations();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to register for election"
      );
    } finally {
      setLoading(false);
    }
  };

  const getRegistrationStatus = (electionId, postId) => {
    const registration = registrations.find(
      (r) =>
        r.election._id === electionId && r.post._id === postId
    );
    return registration ? registration.status : null;
  };

  const hasActiveRegistrationForElection = (electionId) =>
    registrations.some(
      (r) =>
        r.election._id === electionId &&
        ["pending", "approved"].includes(r.status)
    );

  const isPostEligibleForCandidate = (post) => {
    if (!post.eligibleGrades || post.eligibleGrades.length === 0) {
      return true;
    }
    if (!candidateGrade) {
      return false;
    }
    return post.eligibleGrades.some(
      (grade) => grade.toLowerCase() === candidateGrade.toLowerCase()
    );
  };

  const eligiblePosts = posts.filter((post) => isPostEligibleForCandidate(post));
  const hasActiveRegistration = hasActiveRegistrationForElection(activeElectionId);

  return (
    <section className="page">
      <div className="page__header">
        <h2>Candidate Dashboard</h2>
        <p>Register for elections and manage your campaign</p>
      </div>

      {message && (
        <div className={`card ${message.includes("success") ? "success" : "error"}`}>
          <p>{message}</p>
        </div>
      )}

      <div className="select-group">
        <label htmlFor="election">Select Election</label>
        <select
          id="election"
          value={activeElectionId || ""}
          onChange={(e) => selectElection(e.target.value)}
        >
          <option value="">Select an election</option>
          {elections.map((election) => (
            <option key={election._id} value={election._id}>
              {election.name}
            </option>
          ))}
        </select>
      </div>

      {activeElectionId && (
        <section className="card">
          <h3>Available Posts</h3>
          {posts.length === 0 ? (
            <p>No posts available for this election yet.</p>
          ) : eligiblePosts.length === 0 ? (
            <p>No posts match your grade eligibility for this election.</p>
          ) : (
            <div className="posts-grid">
              {eligiblePosts.map((post) => {
                const status = getRegistrationStatus(activeElectionId, post._id);
                const isEligible = isPostEligibleForCandidate(post);
                const disableForRegistration = hasActiveRegistration && status === null;
                const disabled = loading || !isEligible || disableForRegistration;
                const buttonLabel = (() => {
                  if (status === "pending") return "Awaiting Approval";
                  if (status === "approved") return "Already Approved";
                  if (disableForRegistration) return "Registration In Review";
                  if (!isEligible) return "Not Eligible";
                  return loading ? "Registering..." : "Register for this Post";
                })();
                return (
                  <article key={post._id} className="card post-card">
                    <h4>{post.name}</h4>
                    <p>{post.description}</p>
                    {status === null ? (
                      <button
                        className="btn"
                        onClick={() => handleRegister(activeElectionId, post._id)}
                        disabled={disabled}
                      >
                        {buttonLabel}
                      </button>
                    ) : (
                      <div className="status-badge">
                        <span className={`status status-${status}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                        {status === "pending" && (
                          <p className="small">Awaiting admin approval</p>
                        )}
                        {status === "approved" && (
                          <p className="small">You can now create campaign posts!</p>
                        )}
                        {status === "rejected" && (
                          <p className="small">Registration was rejected</p>
                        )}
                      </div>
                    )}
                    {disableForRegistration && (
                      <p className="small muted">
                        You already have an active registration in this election. Wait for the admin decision before applying to another post.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="card">
        <h3>My Registrations</h3>
        {registrations.length === 0 ? (
          <p>You haven't registered for any elections yet.</p>
        ) : (
          <div className="registrations-list">
            {registrations.map((registration) => (
              <article key={registration._id} className="registration-item">
                <div>
                  <h4>{registration.election?.name || "Unknown Election"}</h4>
                  <p>
                    <strong>Post:</strong> {registration.post?.name || "Unknown Post"}
                  </p>
                  <p className="small">
                    Registered: {new Date(registration.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="status-badge">
                  <span className={`status status-${registration.status}`}>
                    {registration.status.charAt(0).toUpperCase() +
                      registration.status.slice(1)}
                  </span>
                  {registration.message && (
                    <p className="small">{registration.message}</p>
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

export default CandidateDashboard;

