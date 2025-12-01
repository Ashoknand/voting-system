import { useCallback, useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import {
  fetchCandidates,
  updateCandidate,
  deleteCandidate,
  blockCandidate,
  unblockCandidate,
  approveCandidate,
} from "../services/candidateService";

const AdminCandidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState("all"); // all, blocked, active, approved, pending
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    grade: "",
    manifesto: "",
  });

  const loadCandidates = useCallback(async () => {
    try {
      console.log("Loading candidates with filter:", filter);
      setLoading(true);
      const params = {};
      if (filter === "approved") params.approved = "true";
      else if (filter === "pending") params.approved = "false";
      
      const data = await fetchCandidates(params);
      // Filter by blocked status on frontend if needed
      let filteredData = data;
      if (filter === "blocked") {
        filteredData = data.filter((c) => c.user?.isBlocked);
      } else if (filter === "active") {
        filteredData = data.filter((c) => !c.user?.isBlocked);
      }
      setCandidates(filteredData);
      console.log("Candidates loaded:", filteredData.length);
    } catch (error) {
      console.error("Error loading candidates:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setStatus(error.response?.data?.message || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleEdit = (candidate) => {
    console.log("Edit candidate clicked:", candidate._id);
    setEditingId(candidate._id);
    setEditForm({
      name: candidate.user?.name || "",
      username: candidate.user?.username || "",
      grade: candidate.grade || "",
      manifesto: candidate.manifesto || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", username: "", grade: "", manifesto: "" });
  };

  const handleSaveEdit = async (id) => {
    try {
      console.log("Saving candidate edit:", id, editForm);
      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("username", editForm.username);
      formData.append("grade", editForm.grade);
      formData.append("manifesto", editForm.manifesto);
      
      await updateCandidate(id, formData);
      console.log("Candidate updated successfully");
      setStatus("Candidate updated successfully");
      setEditingId(null);
      setEditForm({ name: "", username: "", grade: "", manifesto: "" });
      await loadCandidates();
    } catch (error) {
      console.error("Error updating candidate:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setStatus(error.response?.data?.message || "Failed to update candidate");
    }
  };

  const handleDelete = async (id) => {
    try {
      console.log("Delete candidate clicked:", id);
      if (!window.confirm("Are you sure you want to delete this candidate? This will also remove all their assignments and cannot be undone.")) {
        console.log("Delete cancelled by user");
        return;
      }
      await deleteCandidate(id);
      console.log("Candidate deleted successfully");
      setStatus("Candidate deleted successfully");
      await loadCandidates();
    } catch (error) {
      console.error("Error deleting candidate:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setStatus(error.response?.data?.message || "Failed to delete candidate");
    }
  };

  const handleBlock = async (id) => {
    try {
      console.log("Block candidate clicked:", id);
      await blockCandidate(id);
      console.log("Candidate blocked successfully");
      setStatus("Candidate blocked successfully");
      await loadCandidates();
    } catch (error) {
      console.error("Error blocking candidate:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setStatus(error.response?.data?.message || "Failed to block candidate");
    }
  };

  const handleUnblock = async (id) => {
    try {
      console.log("Unblock candidate clicked:", id);
      await unblockCandidate(id);
      console.log("Candidate unblocked successfully");
      setStatus("Candidate unblocked successfully");
      await loadCandidates();
    } catch (error) {
      console.error("Error unblocking candidate:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setStatus(error.response?.data?.message || "Failed to unblock candidate");
    }
  };

  const handleApprove = async (id) => {
    try {
      console.log("Approve candidate clicked:", id);
      await approveCandidate(id);
      console.log("Candidate approved successfully");
      setStatus("Candidate approved successfully");
      await loadCandidates();
    } catch (error) {
      console.error("Error approving candidate:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setStatus(error.response?.data?.message || "Failed to approve candidate");
    }
  };

  const sidebarSections = [
    { label: "All Candidates", path: "#candidates" },
  ];

  return (
    <section className="page admin-grid">
      <AdminSidebar sections={sidebarSections} />
      <div className="page">
        {status && <p className="info">{status}</p>}

        <section id="candidates" className="card">
          <header className="page__header">
            <div>
              <h3>Manage Candidates</h3>
              <p>View, edit, approve, block, and delete candidate accounts</p>
            </div>
            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="btn secondary"
                style={{ marginLeft: "1rem" }}
              >
                <option value="all">All Candidates</option>
                <option value="active">Active Only</option>
                <option value="blocked">Blocked Only</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending Approval</option>
              </select>
            </div>
          </header>

          {loading ? (
            <p>Loading candidates...</p>
          ) : candidates.length === 0 ? (
            <p>No candidates found.</p>
          ) : (
            <div className="table">
              {candidates.map((candidate) => (
                <article key={candidate._id} className="card">
                  {editingId === candidate._id ? (
                    <div className="form-grid">
                      <label>
                        Name
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                          required
                        />
                      </label>
                      <label>
                        Username
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              username: e.target.value,
                            }))
                          }
                          required
                        />
                      </label>
                      <label>
                        Grade
                        <input
                          type="text"
                          value={editForm.grade}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, grade: e.target.value }))
                          }
                          required
                        />
                      </label>
                      <label>
                        Manifesto
                        <textarea
                          value={editForm.manifesto}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              manifesto: e.target.value,
                            }))
                          }
                          rows="4"
                        />
                      </label>
                      <div className="hero__cta">
                        <button
                          className="btn"
                          onClick={() => handleSaveEdit(candidate._id)}
                        >
                          Save
                        </button>
                        <button
                          className="btn secondary"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <header className="page__header">
                        <div>
                          <h4>{candidate.user?.name || "Unknown"}</h4>
                          <p>
                            <strong>Username:</strong> {candidate.user?.username || "N/A"}
                          </p>
                          <p>
                            <strong>Grade:</strong> {candidate.grade || "N/A"}
                          </p>
                          <p>
                            <strong>Manifesto:</strong> {candidate.manifesto || "N/A"}
                          </p>
                          <p>
                            <strong>Approval Status:</strong>{" "}
                            <span
                              className={`status status-${
                                candidate.isApproved ? "approved" : "pending"
                              }`}
                            >
                              {candidate.isApproved ? "Approved" : "Pending"}
                            </span>
                          </p>
                          <p>
                            <strong>Account Status:</strong>{" "}
                            <span
                              className={`status status-${
                                candidate.user?.isBlocked ? "blocked" : "active"
                              }`}
                            >
                              {candidate.user?.isBlocked ? "Blocked" : "Active"}
                            </span>
                          </p>
                          {candidate.assignments?.length > 0 && (
                            <div>
                              <strong>Assigned Posts:</strong>
                              <ul>
                                {candidate.assignments.map((assignment) => (
                                  <li key={assignment._id}>
                                    {assignment.post?.name} - {assignment.election?.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <p className="small">
                            Registered:{" "}
                            {new Date(candidate.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="hero__cta">
                          <button
                            className="btn"
                            onClick={() => handleEdit(candidate)}
                          >
                            Edit
                          </button>
                          {!candidate.isApproved && (
                            <button
                              className="btn"
                              onClick={() => handleApprove(candidate._id)}
                            >
                              Approve
                            </button>
                          )}
                          {candidate.user?.isBlocked ? (
                            <button
                              className="btn"
                              onClick={() => handleUnblock(candidate._id)}
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              className="btn secondary"
                              onClick={() => handleBlock(candidate._id)}
                            >
                              Block
                            </button>
                          )}
                          <button
                            className="btn secondary"
                            onClick={() => handleDelete(candidate._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </header>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
};

export default AdminCandidates;

