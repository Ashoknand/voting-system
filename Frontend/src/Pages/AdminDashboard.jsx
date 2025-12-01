import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import { useElections } from "../context/ElectionContext";
import {
  fetchDashboard,
  createElection,
  toggleElection,
  deleteElection,
  createPost,
  deletePost,
} from "../services/adminService";
import {
  fetchCandidates,
  approveCandidate,
  assignCandidateToPost,
  removeCandidateFromPost,
} from "../services/candidateService";
import { fetchElectionPosts, fetchResults } from "../services/electionService";
import {
  getAllRegistrations,
  approveRegistration,
  rejectRegistration,
} from "../services/electionRegistrationService";
import {
  getAllCampaignPosts,
  approveCampaignPost,
  rejectCampaignPost,
  updateCampaignPost as adminUpdateCampaignPost,
  deleteCampaignPost as adminDeleteCampaignPost,
} from "../services/campaignPostService";
import { getImageUrl } from "../utils/imageUrl";

const AdminDashboard = () => {
  const { elections, reloadElections, activeElectionId, selectElection } =
    useElections();

  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [results, setResults] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [campaignPosts, setCampaignPosts] = useState([]);
  const [editingCampaignPost, setEditingCampaignPost] = useState(null);
  const [campaignEditForm, setCampaignEditForm] = useState({
    title: "",
    content: "",
    image: null,
  });
  const [status, setStatus] = useState("");

  const [electionForm, setElectionForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });
  const [postForm, setPostForm] = useState({
    electionId: "",
    name: "",
    description: "",
    isMandatory: true,
  });
  const [assignmentForm, setAssignmentForm] = useState({
    candidateId: "",
    electionId: "",
    postId: "",
  });

  const selectedElectionId =
    assignmentForm.electionId || postForm.electionId || activeElectionId;

  const loadDashboard = async () => {
    try {
      console.log("Loading dashboard stats...");
      const data = await fetchDashboard();
      setStats(data.totals);
      console.log("Dashboard stats loaded:", data.totals);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  const loadCandidates = async () => {
    try {
      console.log("Loading candidates...");
      const data = await fetchCandidates();
      setCandidates(data);
      console.log("Candidates loaded:", data.length);
    } catch (error) {
      console.error("Error loading candidates:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  const loadPosts = async (electionId) => {
    try {
      if (!electionId) {
        setPosts([]);
        return;
      }
      console.log("Loading posts for election:", electionId);
      const data = await fetchElectionPosts(electionId);
      setPosts(data);
      console.log("Posts loaded:", data.length);
    } catch (error) {
      console.error("Error loading posts:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        electionId
      });
      setPosts([]);
    }
  };

  const loadResults = async (electionId) => {
    try {
      if (!electionId) {
        setResults([]);
        return;
      }
      console.log("Loading results for election:", electionId);
      const data = await fetchResults(electionId);
      setResults(data);
      console.log("Results loaded:", data.length);
    } catch (error) {
      console.error("Error loading results:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        electionId
      });
      setResults([]);
    }
  };

  const loadRegistrations = async () => {
    try {
      const data = await getAllRegistrations({ status: "pending" });
      setRegistrations(data);
    } catch (error) {
      console.error("Failed to load registrations", error);
    }
  };

  const loadCampaignPosts = async () => {
    try {
      const data = await getAllCampaignPosts({ status: "pending" });
      setCampaignPosts(data);
    } catch (error) {
      console.error("Failed to load campaign posts", error);
    }
  };

  const handleApproveRegistration = async (id, message = "") => {
    try {
      console.log("handleApproveRegistration called with:", { id, message });
      await approveRegistration(id, message);
      console.log("Registration approved successfully");
      setStatus("Registration approved");
      await Promise.all([loadRegistrations(), loadCandidates()]);
      if (activeElectionId) {
        await loadPosts(activeElectionId);
      }
    } catch (error) {
      console.error("Error in handleApproveRegistration:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        id
      });
      setStatus(error.response?.data?.message || "Failed to approve registration");
    }
  };

  const handleRejectRegistration = async (id, message = "") => {
    try {
      console.log("handleRejectRegistration called with:", { id, message });
      await rejectRegistration(id, message);
      console.log("Registration rejected successfully");
      setStatus("Registration rejected");
      await loadRegistrations();
    } catch (error) {
      console.error("Error in handleRejectRegistration:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        id
      });
      setStatus(error.response?.data?.message || "Failed to reject registration");
    }
  };

  const handleApproveCampaignPost = async (id, message = "") => {
    try {
      console.log("handleApproveCampaignPost called with:", { id, message });
      await approveCampaignPost(id, message);
      console.log("Campaign post approved successfully");
      setStatus("Campaign post approved");
      await loadCampaignPosts();
    } catch (error) {
      console.error("Error in handleApproveCampaignPost:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        id
      });
      setStatus(error.response?.data?.message || "Failed to approve campaign post");
    }
  };

  const handleRejectCampaignPost = async (id, message = "") => {
    try {
      console.log("handleRejectCampaignPost called with:", { id, message });
      await rejectCampaignPost(id, message);
      console.log("Campaign post rejected successfully");
      setStatus("Campaign post rejected");
      await loadCampaignPosts();
    } catch (error) {
      console.error("Error in handleRejectCampaignPost:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        id
      });
      setStatus(error.response?.data?.message || "Failed to reject campaign post");
    }
  };

  const startEditingCampaignPost = (post) => {
    setEditingCampaignPost(post);
    setCampaignEditForm({
      title: post.title,
      content: post.content,
      image: null,
    });
  };

  const cancelEditingCampaignPost = () => {
    setEditingCampaignPost(null);
    setCampaignEditForm({
      title: "",
      content: "",
      image: null,
    });
  };

  const handleCampaignEditChange = (e) => {
    const { name, value } = e.target;
    setCampaignEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCampaignEditImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setCampaignEditForm((prev) => ({ ...prev, image: file }));
  };

  const handleUpdateCampaignPost = async (e) => {
    e.preventDefault();
    if (!editingCampaignPost) return;
    try {
      const formData = new FormData();
      formData.append("title", campaignEditForm.title);
      formData.append("content", campaignEditForm.content);
      if (campaignEditForm.image) {
        formData.append("image", campaignEditForm.image);
      }
      await adminUpdateCampaignPost(editingCampaignPost._id, formData);
      setStatus("Campaign post updated");
      cancelEditingCampaignPost();
      await loadCampaignPosts();
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to update campaign post");
    }
  };

  const handleDeleteCampaignPost = async (id) => {
    if (!window.confirm("Delete this campaign post? This cannot be undone.")) {
      return;
    }
    try {
      await adminDeleteCampaignPost(id);
      if (editingCampaignPost?._id === id) {
        cancelEditingCampaignPost();
      }
      setStatus("Campaign post deleted");
      await loadCampaignPosts();
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to delete campaign post");
    }
  };

  useEffect(() => {
    // Load data sequentially to avoid overwhelming the server
    const loadAllData = async () => {
      try {
        await loadDashboard();
        await loadCandidates();
        await loadRegistrations();
        await loadCampaignPosts();
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    };
    loadAllData();
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    if (!activeElectionId) return;
    // Load posts and results sequentially
    const loadElectionData = async () => {
      try {
        await loadPosts(activeElectionId);
        await loadResults(activeElectionId);
      } catch (error) {
        console.error("Error loading election data:", error);
      }
    };
    loadElectionData();
  }, [activeElectionId]);

  // Sync form state with active election selection
  useEffect(() => {
    if (activeElectionId) {
      // Using setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        setPostForm((prev) => ({ ...prev, electionId: activeElectionId }));
        setAssignmentForm((prev) => ({ ...prev, electionId: activeElectionId }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeElectionId]);

  const handleCreateElection = async (e) => {
    e.preventDefault();
    try {
      console.log("handleCreateElection called with form:", electionForm);
      setStatus("");
      await createElection(electionForm);
      console.log("Election created successfully");
      setElectionForm({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
      });
      await Promise.all([loadDashboard(), reloadElections()]);
      setStatus("Election created.");
    } catch (error) {
      console.error("Error in handleCreateElection:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        form: electionForm
      });
      setStatus(error.response?.data?.message || "Failed to create election");
    }
  };

  const handleToggle = async (id) => {
    try {
      console.log("handleToggle called with election id:", id);
      await toggleElection(id);
      console.log("Election toggled successfully");
      await Promise.all([loadDashboard(), reloadElections()]);
    } catch (error) {
      console.error("Error in handleToggle:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        electionId: id
      });
      setStatus(error.response?.data?.message || "Failed to toggle election");
    }
  };

  const handleDeleteElection = async (id) => {
    try {
      console.log("handleDeleteElection called with election id:", id);
      if (!window.confirm("Are you sure you want to delete this election?")) {
        console.log("Election deletion cancelled by user");
        return;
      }
      await deleteElection(id);
      console.log("Election deleted successfully");
      await Promise.all([loadDashboard(), reloadElections()]);
      setStatus("Election deleted.");
    } catch (error) {
      console.error("Error in handleDeleteElection:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        electionId: id
      });
      setStatus(error.response?.data?.message || "Failed to delete election");
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      console.log("handleCreatePost called with form:", postForm);
      if (!postForm.electionId) {
        const errorMsg = "Select an election for the post.";
        console.error("Validation failed:", errorMsg);
        setStatus(errorMsg);
        return;
      }
      await createPost(postForm);
      console.log("Post created successfully");
      setPostForm({
        electionId: postForm.electionId,
        name: "",
        description: "",
        isMandatory: true,
      });
      await loadPosts(postForm.electionId);
      setStatus("Post created.");
    } catch (error) {
      console.error("Error in handleCreatePost:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        form: postForm
      });
      setStatus(error.response?.data?.message || "Failed to create post");
    }
  };

  const handleDeletePost = async (post) => {
    if (!post?._id) {
      console.error("handleDeletePost called without valid post object:", post);
      setStatus("Unable to delete post: missing identifier.");
      return;
    }
    try {
      console.log("handleDeletePost called with post id:", post._id);
      if (!window.confirm("Are you sure you want to delete this post?")) {
        console.log("Post deletion cancelled by user");
        return;
      }
      await deletePost(post._id);
      console.log("Post deleted successfully");
      await loadPosts(post.election || postForm.electionId || activeElectionId);
      setStatus("Post deleted.");
    } catch (error) {
      console.error("Error in handleDeletePost:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        postId: post._id
      });
      if (error.response?.status === 404) {
        setPosts((prev) => prev.filter((item) => item._id !== post._id));
        setStatus("Post already removed or missing. List refreshed.");
        await loadPosts(post.election || postForm.electionId || activeElectionId);
      } else {
        setStatus(error.response?.data?.message || "Failed to delete post");
      }
    }
  };

  const handleApproveCandidate = async (id) => {
    try {
      console.log("handleApproveCandidate called with id:", id);
      await approveCandidate(id);
      console.log("Candidate approved successfully");
      await loadCandidates();
      if (selectedElectionId) {
        await loadPosts(selectedElectionId);
      }
    } catch (error) {
      console.error("Error in handleApproveCandidate:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setStatus(error.response?.data?.message || "Failed to approve candidate");
    }
  };

  const handleAssignCandidate = async (e) => {
    e.preventDefault();
    try {
      console.log("handleAssignCandidate called with form:", assignmentForm);
      if (!assignmentForm.candidateId || !assignmentForm.postId) {
        const errorMsg = "Candidate and post are required.";
        console.error("Validation failed:", errorMsg);
        setStatus(errorMsg);
        return;
      }
      console.log("Calling assignCandidateToPost API...");
      await assignCandidateToPost(assignmentForm.candidateId, {
        electionId: assignmentForm.electionId,
        postId: assignmentForm.postId,
      });
      console.log("Candidate assigned successfully");
      setStatus("Candidate assigned.");
      await loadResults(assignmentForm.electionId);
      await loadCandidates(); // Reload to show new assignment
    } catch (error) {
      console.error("Error in handleAssignCandidate:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setStatus(error.response?.data?.message || "Failed to assign candidate");
    }
  };

  const handleRemoveCandidate = async (candidateId, overrides = {}) => {
    console.log("handleRemoveCandidate called with:", { candidateId, overrides });
    const electionId = overrides.electionId || assignmentForm.electionId;
    const postId = overrides.postId || assignmentForm.postId;
    console.log("Resolved IDs:", { electionId, postId, assignmentForm });
    
    if (!postId || !electionId) {
      const errorMsg = "Election ID and Post ID are required to remove candidate.";
      console.error("Validation failed:", errorMsg, { electionId, postId });
      setStatus(errorMsg);
      return;
    }
    try {
      console.log("Calling removeCandidateFromPost API with:", { candidateId, electionId, postId });
      const response = await removeCandidateFromPost(candidateId, { electionId, postId });
      console.log("Remove API response:", response);
      setStatus("Candidate removed from ballot.");
      // Reload candidates to refresh the assignments list
      console.log("Reloading candidates and results...");
      await Promise.all([loadCandidates(), loadResults(electionId)]);
      console.log("Reload complete");
    } catch (error) {
      console.error("Error in handleRemoveCandidate:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      setStatus(error.response?.data?.message || error.message || "Failed to remove candidate from post");
    }
  };

  const sidebarSections = useMemo(
    () => [
      { label: "Metrics", path: "#metrics" },
      { label: "Elections", path: "#elections" },
      { label: "Posts", path: "#posts" },
      { label: "Candidates", path: "#candidates" },
      { label: "Election Registrations", path: "#registrations" },
      { label: "Campaign Posts", path: "#campaign-posts" },
      { label: "Results", path: "#results" },
      { label: "Gallery", path: "/admin/gallery" },
      { label: "Manage Students", path: "/admin/students" },
      { label: "Manage Candidates", path: "/admin/candidates" },
    ],
    []
  );

  return (
    <section className="page admin-grid">
      <AdminSidebar sections={sidebarSections} />
      <div className="page">
        {status && <p className="info">{status}</p>}

        <section id="metrics" className="card">
          <h3>Election Metrics</h3>
          <div className="results-grid">
            <Metric label="Active Elections" value={stats?.elections ?? 0} />
            <Metric
              label="Approved Candidates"
              value={stats?.approvedCandidates ?? 0}
            />
            <Metric label="Registered Students" value={stats?.students ?? 0} />
            <Metric label="Votes Cast" value={stats?.votes ?? 0} />
          </div>
        </section>

        <section id="elections" className="card">
          <header className="page__header">
            <div>
              <h3>Manage Elections</h3>
              <p>Create, activate, or archive elections.</p>
            </div>
          </header>
          <form className="form-grid" onSubmit={handleCreateElection}>
            <label>
              Election Name
              <input
                value={electionForm.name}
                onChange={(e) =>
                  setElectionForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={electionForm.description}
                onChange={(e) =>
                  setElectionForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Start Date
              <input
                type="datetime-local"
                value={electionForm.startDate}
                onChange={(e) =>
                  setElectionForm((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                required
              />
            </label>
            <label>
              End Date
              <input
                type="datetime-local"
                value={electionForm.endDate}
                onChange={(e) =>
                  setElectionForm((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
                required
              />
            </label>
            <button className="btn" type="submit">
              Create Election
            </button>
          </form>

          <div className="table">
            {elections.map((election) => (
              <article key={election._id} className="card">
                <header className="page__header">
                  <div>
                    <h4>{election.name}</h4>
                    <small>
                      {new Date(election.startDate).toLocaleString()} -{" "}
                      {new Date(election.endDate).toLocaleString()}
                    </small>
                  </div>
                  <div className="hero__cta">
                    <button
                      className="btn secondary"
                      onClick={() => {
                        selectElection(election._id);
                        setPostForm((prev) => ({
                          ...prev,
                          electionId: election._id,
                        }));
                        setAssignmentForm((prev) => ({
                          ...prev,
                          electionId: election._id,
                        }));
                      }}
                    >
                      Manage
                    </button>
                    <button
                      className="btn"
                      onClick={async () => {
                        try {
                          console.log("Toggle button clicked for election:", election._id);
                          await handleToggle(election._id);
                        } catch (error) {
                          console.error("Error in Toggle button onClick:", error);
                          setStatus(`Error: ${error.message || "Failed to toggle election"}`);
                        }
                      }}
                      type="button"
                    >
                      {election.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={async () => {
                        try {
                          console.log("Delete election button clicked for:", election._id);
                          await handleDeleteElection(election._id);
                        } catch (error) {
                          console.error("Error in Delete election button onClick:", error);
                          setStatus(`Error: ${error.message || "Failed to delete election"}`);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </header>
              </article>
            ))}
          </div>
        </section>

        <section id="posts" className="card">
          <h3>Posts & Ballot Layout</h3>
          <form className="form-grid" onSubmit={handleCreatePost}>
            <label>
              Election
              <select
                value={postForm.electionId}
                onChange={(e) => {
                  const value = e.target.value;
                  setPostForm((prev) => ({ ...prev, electionId: value }));
                  setAssignmentForm((prev) => ({ ...prev, electionId: value }));
                  selectElection(value);
                }}
                required
              >
                <option value="">Select election</option>
                {elections.map((election) => (
                  <option key={election._id} value={election._id}>
                    {election.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Post Name
              <input
                value={postForm.name}
                onChange={(e) =>
                  setPostForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={postForm.description}
                onChange={(e) =>
                  setPostForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Mandatory to vote?
              <select
                value={postForm.isMandatory ? "yes" : "no"}
                onChange={(e) =>
                  setPostForm((prev) => ({
                    ...prev,
                    isMandatory: e.target.value === "yes",
                  }))
                }
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <button className="btn" type="submit">
              Add Post
            </button>
          </form>

          <div className="ballot-grid">
            {posts.length === 0 && <p>No posts defined for this election.</p>}
            {posts.map((post) => (
              <article key={post._id} className="card ballot-card">
                <header className="page__header">
                  <div>
                    <h4>{post.name}</h4>
                    <p>{post.description}</p>
                  </div>
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={async () => {
                      try {
                        console.log("Delete post button clicked for:", post._id);
                        await handleDeletePost(post);
                      } catch (error) {
                        console.error("Error in Delete post button onClick:", error);
                        setStatus(`Error: ${error.message || "Failed to delete post"}`);
                      }
                    }}
                  >
                    Delete
                  </button>
                </header>
              </article>
            ))}
          </div>
        </section>

        <section id="candidates" className="card">
          <h3>Candidate Approvals & Assignments</h3>
          <form className="form-grid" onSubmit={handleAssignCandidate}>
            <label>
              Candidate
              <select
                value={assignmentForm.candidateId}
                onChange={(e) =>
                  setAssignmentForm((prev) => ({
                    ...prev,
                    candidateId: e.target.value,
                  }))
                }
              >
                <option value="">Select candidate</option>
                {candidates
                  .filter((c) => c.isApproved)
                  .map((candidate) => (
                    <option key={candidate._id} value={candidate._id}>
                      {candidate.user?.name} ({candidate.grade})
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Election
              <select
                value={assignmentForm.electionId}
                onChange={(e) => {
                  const value = e.target.value;
                  setAssignmentForm((prev) => ({ ...prev, electionId: value }));
                  selectElection(value);
                  loadPosts(value);
                }}
              >
                <option value="">Select election</option>
                {elections.map((election) => (
                  <option key={election._id} value={election._id}>
                    {election.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Post
              <select
                value={assignmentForm.postId}
                onChange={(e) =>
                  setAssignmentForm((prev) => ({
                    ...prev,
                    postId: e.target.value,
                  }))
                }
              >
                <option value="">Select post</option>
                {posts.map((post) => (
                  <option key={post._id} value={post._id}>
                    {post.name}
                  </option>
                ))}
              </select>
            </label>
            <button 
              className="btn" 
              type="submit"
              onClick={() => {
                console.log("Assign to Ballot button clicked");
                console.log("Form state:", assignmentForm);
              }}
            >
              Assign to Ballot
            </button>
          </form>

          <div className="ballot-grid">
            {candidates.map((candidate) => (
              <article key={candidate._id} className="card">
                <header className="page__header">
                  <div>
                    <h4>{candidate.user?.name}</h4>
                    <small>Grade {candidate.grade}</small>
                    <p>{candidate.manifesto}</p>
                  </div>
                  <div className="hero__cta">
                    {!candidate.isApproved && (
                      <button
                        className="btn"
                        type="button"
                        onClick={async () => {
                          try {
                            console.log("Approve button clicked for candidate:", candidate._id);
                            await handleApproveCandidate(candidate._id);
                          } catch (error) {
                            console.error("Error in Approve button onClick:", error);
                            setStatus(`Error: ${error.message || "Failed to approve candidate"}`);
                          }
                        }}
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </header>
                <div className="candidate-assignments">
                  <h4>Assigned Posts</h4>
                  {candidate.assignments?.length ? (
                    <ul className="assignment-list">
                      {candidate.assignments.map((assignment) => (
                        <li key={assignment._id}>
                          <div>
                            <strong>{assignment.post?.name}</strong>
                            <p className="small">
                              Election: {assignment.election?.name}
                            </p>
                          </div>
                          <button
                            className="btn secondary"
                            type="button"
                            onClick={async () => {
                              try {
                                console.log("Remove button clicked for assignment:", assignment);
                                console.log("Candidate ID:", candidate._id);
                                
                                if (!assignment.election?._id || !assignment.post?._id) {
                                  const errorMsg = "Cannot remove: Missing election or post information";
                                  console.error(errorMsg, { assignment });
                                  setStatus(errorMsg);
                                  return;
                                }
                                
                                console.log("Calling handleRemoveCandidate with:", {
                                  candidateId: candidate._id,
                                  electionId: assignment.election._id,
                                  postId: assignment.post._id
                                });
                                
                                await handleRemoveCandidate(candidate._id, {
                                  electionId: assignment.election._id,
                                  postId: assignment.post._id,
                                });
                              } catch (error) {
                                console.error("Error in Remove button onClick:", error);
                                console.error("Error details:", {
                                  message: error.message,
                                  stack: error.stack,
                                  assignment,
                                  candidateId: candidate._id
                                });
                                setStatus(`Error: ${error.message || "Failed to remove candidate"}`);
                              }
                            }}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="small">Not assigned to any posts yet.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="registrations" className="card">
          <h3>Pending Election Registrations</h3>
          <p>Approve or reject candidate registrations for elections</p>
          {registrations.length === 0 ? (
            <p>No pending registrations.</p>
          ) : (
            <div className="registrations-list">
              {registrations.map((registration) => (
                <article key={registration._id} className="card">
                  <header className="page__header">
                    <div>
                      <h4>{registration.candidate.user?.name}</h4>
                      <p>
                        <strong>Election:</strong> {registration.election.name}
                      </p>
                      <p>
                        <strong>Post:</strong> {registration.post.name}
                      </p>
                      <p className="small">
                        Registered: {new Date(registration.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="hero__cta">
                      <button
                        className="btn"
                        onClick={async () => {
                          try {
                            console.log("Approve registration button clicked for:", registration._id);
                            await handleApproveRegistration(registration._id);
                          } catch (error) {
                            console.error("Error in Approve registration button onClick:", error);
                            setStatus(`Error: ${error.message || "Failed to approve registration"}`);
                          }
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="btn secondary"
                        onClick={async () => {
                          try {
                            console.log("Reject registration button clicked for:", registration._id);
                            const message = prompt("Rejection reason (optional):");
                            await handleRejectRegistration(registration._id, message || "");
                          } catch (error) {
                            console.error("Error in Reject registration button onClick:", error);
                            setStatus(`Error: ${error.message || "Failed to reject registration"}`);
                          }
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </header>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="campaign-posts" className="card">
          <h3>Pending Campaign Posts</h3>
          <p>Approve, edit, or delete candidate campaign posts</p>
          {editingCampaignPost && (
            <form className="form-grid" onSubmit={handleUpdateCampaignPost}>
              <h4>Editing: {editingCampaignPost.title}</h4>
              <label>
                Title
                <input
                  name="title"
                  value={campaignEditForm.title}
                  onChange={handleCampaignEditChange}
                  required
                />
              </label>
              <label>
                Content
                <textarea
                  name="content"
                  rows={4}
                  value={campaignEditForm.content}
                  onChange={handleCampaignEditChange}
                  required
                />
              </label>
              <label>
                Replace Image
                <input type="file" accept="image/*" onChange={handleCampaignEditImageChange} />
                {campaignEditForm.image && (
                  <small style={{ color: "#0ea5e9" }}>
                    Selected: {campaignEditForm.image.name}
                  </small>
                )}
              </label>
              <div className="hero__cta">
                <button className="btn" type="submit">
                  Save Changes
                </button>
                <button className="btn secondary" type="button" onClick={cancelEditingCampaignPost}>
                  Cancel
                </button>
              </div>
            </form>
          )}
          {campaignPosts.length === 0 ? (
            <p>No pending campaign posts.</p>
          ) : (
            <div className="campaign-posts-grid">
              {campaignPosts.map((post) => (
                <article key={post._id} className="card campaign-post-card">
                  {post.imageUrl && (
                    <img
                      src={getImageUrl(post.imageUrl)}
                      alt={post.title}
                      className="campaign-post-image"
                      style={{
                        width: "100%",
                        height: "auto",
                        objectFit: "contain",
                        maxHeight: "320px",
                        borderRadius: "0.75rem",
                      }}
                      onError={(e) => {
                        console.error("Campaign post image failed to load:", post.imageUrl, post);
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML =
                          '<div style="padding: 1rem; text-align: center; color: #94a3b8;">Image failed to load</div>';
                      }}
                    />
                  )}
                  <div className="campaign-post-content">
                    <h4>{post.title}</h4>
                    <p className="election-name">
                      <strong>Election:</strong> {post.election.name}
                    </p>
                    <p className="candidate-name">
                      <strong>Candidate:</strong> {post.candidate.user?.name}
                    </p>
                    <p>{post.content}</p>
                    <p className="small">
                      Created: {new Date(post.createdAt).toLocaleString()}
                    </p>
                    <div className="hero__cta">
                      <button
                        className="btn"
                        onClick={async () => {
                          try {
                            console.log("Approve campaign post button clicked for:", post._id);
                            await handleApproveCampaignPost(post._id);
                          } catch (error) {
                            console.error("Error in Approve campaign post button onClick:", error);
                            setStatus(`Error: ${error.message || "Failed to approve campaign post"}`);
                          }
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="btn secondary"
                        onClick={async () => {
                          try {
                            console.log("Reject campaign post button clicked for:", post._id);
                            const message = prompt("Rejection reason (optional):");
                            await handleRejectCampaignPost(post._id, message || "");
                          } catch (error) {
                            console.error("Error in Reject campaign post button onClick:", error);
                            setStatus(`Error: ${error.message || "Failed to reject campaign post"}`);
                          }
                        }}
                      >
                        Reject
                      </button>
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => startEditingCampaignPost(post)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => handleDeleteCampaignPost(post._id)}
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

        <section id="results" className="card">
          <h3>Live Results</h3>
          <p>
            Summary of votes per candidate for{" "}
            {elections.find((e) => e._id === activeElectionId)?.name ||
              "selected election"}
            .
          </p>
          <div className="results-grid">
            {results.length === 0 && <p>No votes recorded yet.</p>}
            {results.map((result) => (
              <div key={result.candidateId + result.postName} className="result-card">
                {result.photoUrl ? (
                  <img src={result.photoUrl} alt={result.candidateName} />
                ) : (
                  <div className="avatar-fallback">
                    {result.candidateName.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <strong>{result.candidateName}</strong>
                  <p className="manifesto">{result.postName}</p>
                  <p>{result.votes} votes</p>
                </div>
                {result.logoUrl && (
                  <img
                    src={result.logoUrl}
                    alt={`${result.candidateName} logo`}
                    style={{ borderRadius: "0.5rem", border: "none" }}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};

const Metric = ({ label, value }) => (
  <div className="card">
    <p className="manifesto">{label}</p>
    <h2>{value}</h2>
  </div>
);

export default AdminDashboard;
