import { useCallback, useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { useElections } from "../context/ElectionContext";
import {
  fetchStudents,
  updateStudent,
  deleteStudent,
  blockStudent,
  unblockStudent,
  issueStudentVotingToken,
} from "../services/studentService";

const AdminStudents = () => {
  const { elections } = useElections();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState("all"); // all, blocked, active
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    grade: "",
    dob: "",
  });
  const [tokenSelections, setTokenSelections] = useState({});
  const [tokenFeedback, setTokenFeedback] = useState({});
  const [tokenLoading, setTokenLoading] = useState({});

  const loadStudents = useCallback(async () => {
    try {
      console.log("Loading students with filter:", filter);
      setLoading(true);
      const params = {};
      if (filter === "blocked") params.blocked = "true";
      else if (filter === "active") params.blocked = "false";
      
      const data = await fetchStudents(params);
      setStudents(data);
      console.log("Students loaded:", data.length);
    } catch (error) {
      console.error("Error loading students:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setStatus(error.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const handleSelectElectionForToken = (studentId, electionId) => {
    setTokenSelections((prev) => ({ ...prev, [studentId]: electionId }));
    setTokenFeedback((prev) => ({ ...prev, [studentId]: null }));
  };

  const handleIssueVotingToken = async (studentId) => {
    const electionId = tokenSelections[studentId];
    if (!electionId) {
      setTokenFeedback((prev) => ({
        ...prev,
        [studentId]: { type: "error", message: "Select an election first." },
      }));
      return;
    }

    setTokenLoading((prev) => ({ ...prev, [studentId]: true }));
    setTokenFeedback((prev) => ({
      ...prev,
      [studentId]: { type: "info", message: "Generating voting ID..." },
    }));

    try {
      const token = await issueStudentVotingToken(studentId, electionId);
      setTokenFeedback((prev) => ({
        ...prev,
        [studentId]: {
          type: "success",
          message: `Voting ID for ${token.election?.name || "selected election"}: ${token.token}`,
          token: token.token,
        },
      }));
    } catch (error) {
      setTokenFeedback((prev) => ({
        ...prev,
        [studentId]: {
          type: "error",
          message: error.response?.data?.message || "Failed to generate voting ID",
        },
      }));
    } finally {
      setTokenLoading((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  const handleCopyVotingToken = (studentId) => {
    const token = tokenFeedback[studentId]?.token;
    if (!token) return;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(token).catch(() => {});
    }
  };

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleEdit = (student) => {
    console.log("Edit student clicked:", student._id);
    setEditingId(student._id);
    setEditForm({
      name: student.user?.name || "",
      username: student.user?.username || "",
      grade: student.grade || "",
      dob: student.dob ? new Date(student.dob).toISOString().split("T")[0] : "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", username: "", grade: "", dob: "" });
  };

  const handleSaveEdit = async (id) => {
    try {
      console.log("Saving student edit:", id, editForm);
      await updateStudent(id, editForm);
      console.log("Student updated successfully");
      setStatus("Student updated successfully");
      setEditingId(null);
      setEditForm({ name: "", username: "", grade: "", dob: "" });
      await loadStudents();
    } catch (error) {
      console.error("Error updating student:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setStatus(error.response?.data?.message || "Failed to update student");
    }
  };

  const handleDelete = async (id) => {
    try {
      console.log("Delete student clicked:", id);
      if (!window.confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
        console.log("Delete cancelled by user");
        return;
      }
      await deleteStudent(id);
      console.log("Student deleted successfully");
      setStatus("Student deleted successfully");
      await loadStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setStatus(error.response?.data?.message || "Failed to delete student");
    }
  };

  const handleBlock = async (id) => {
    try {
      console.log("Block student clicked:", id);
      await blockStudent(id);
      console.log("Student blocked successfully");
      setStatus("Student blocked successfully");
      await loadStudents();
    } catch (error) {
      console.error("Error blocking student:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setStatus(error.response?.data?.message || "Failed to block student");
    }
  };

  const handleUnblock = async (id) => {
    try {
      console.log("Unblock student clicked:", id);
      await unblockStudent(id);
      console.log("Student unblocked successfully");
      setStatus("Student unblocked successfully");
      await loadStudents();
    } catch (error) {
      console.error("Error unblocking student:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setStatus(error.response?.data?.message || "Failed to unblock student");
    }
  };

  const sidebarSections = [
    { label: "All Students", path: "#students" },
  ];

  return (
    <section className="page admin-grid">
      <AdminSidebar sections={sidebarSections} />
      <div className="page">
        {status && <p className="info">{status}</p>}

        <section id="students" className="card">
          <header className="page__header">
            <div>
              <h3>Manage Students</h3>
              <p>View, edit, block, and delete student accounts</p>
            </div>
            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="btn secondary"
                style={{ marginLeft: "1rem" }}
              >
                <option value="all">All Students</option>
                <option value="active">Active Only</option>
                <option value="blocked">Blocked Only</option>
              </select>
            </div>
          </header>

          {loading ? (
            <p>Loading students...</p>
          ) : students.length === 0 ? (
            <p>No students found.</p>
          ) : (
            <div className="table">
              {students.map((student) => (
                <article key={student._id} className="card">
                  {editingId === student._id ? (
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
                        Date of Birth
                        <input
                          type="date"
                          value={editForm.dob}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, dob: e.target.value }))
                          }
                          required
                        />
                      </label>
                      <div className="hero__cta">
                        <button
                          className="btn"
                          onClick={() => handleSaveEdit(student._id)}
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
                          <h4>{student.user?.name || "Unknown"}</h4>
                          <p>
                            <strong>Username:</strong> {student.user?.username || "N/A"}
                          </p>
                          <p>
                            <strong>Grade:</strong> {student.grade || "N/A"}
                          </p>
                          <p>
                            <strong>Date of Birth:</strong>{" "}
                            {student.dob
                              ? new Date(student.dob).toLocaleDateString()
                              : "N/A"}
                          </p>
                          <p>
                            <strong>Has Voted:</strong>{" "}
                            {student.hasVoted ? "Yes" : "No"}
                          </p>
                          <p>
                            <strong>Status:</strong>{" "}
                            <span
                              className={`status status-${
                                student.user?.isBlocked ? "blocked" : "active"
                              }`}
                            >
                              {student.user?.isBlocked ? "Blocked" : "Active"}
                            </span>
                          </p>
                          <p className="small">
                            Registered:{" "}
                            {new Date(student.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="hero__cta">
                          <button
                            className="btn"
                            onClick={() => handleEdit(student)}
                          >
                            Edit
                          </button>
                          {student.user?.isBlocked ? (
                            <button
                              className="btn"
                              onClick={() => handleUnblock(student._id)}
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              className="btn secondary"
                              onClick={() => handleBlock(student._id)}
                            >
                              Block
                            </button>
                          )}
                          <button
                            className="btn secondary"
                            onClick={() => handleDelete(student._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </header>
                      <div className="token-panel">
                        <label>
                          Assign Voting ID Election
                          <select
                            value={tokenSelections[student._id] || ""}
                            onChange={(e) =>
                              handleSelectElectionForToken(student._id, e.target.value)
                            }
                          >
                            <option value="">Select election</option>
                            {elections.map((election) => (
                              <option key={election._id} value={election._id}>
                                {election.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="hero__cta">
                          <button
                            className="btn"
                            type="button"
                            onClick={() => handleIssueVotingToken(student._id)}
                            disabled={tokenLoading[student._id]}
                          >
                            {tokenLoading[student._id] ? "Sending..." : "Send Voting ID"}
                          </button>
                          {tokenFeedback[student._id]?.token && (
                            <button
                              className="btn secondary"
                              type="button"
                              onClick={() => handleCopyVotingToken(student._id)}
                            >
                              Copy ID
                            </button>
                          )}
                        </div>
                        {tokenFeedback[student._id] && (
                          <p
                            className={`small ${
                              tokenFeedback[student._id].type === "error" ? "error" : "info"
                            }`}
                          >
                            {tokenFeedback[student._id].message}
                          </p>
                        )}
                      </div>
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

export default AdminStudents;

