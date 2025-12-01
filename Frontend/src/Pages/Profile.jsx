import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getProfile, updateProfile } from "../services/profileService";
import { getImageUrl } from "../utils/imageUrl";

const Profile = () => {
  const { user: authUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    dob: "",
    photo: null,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log("Loading profile...");
      setLoading(true);
      const data = await getProfile();
      setProfile(data);
      setFormData({
        name: data.name || "",
        grade: data.grade || data.student?.grade || data.candidate?.grade || "",
        dob: data.dob || data.student?.dob ? new Date(data.dob || data.student.dob).toISOString().split("T")[0] : "",
        photo: null,
      });
      console.log("Profile loaded:", data);
    } catch (error) {
      console.error("Error loading profile:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setStatus(error.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      setFormData((prev) => ({ ...prev, photo: files[0] || null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Updating profile...");
      setStatus("");
      const updateFormData = new FormData();
      updateFormData.append("name", formData.name);
      if (formData.grade) updateFormData.append("grade", formData.grade);
      if (formData.dob) updateFormData.append("dob", formData.dob);
      if (formData.photo) {
        updateFormData.append("photo", formData.photo);
      }

      await updateProfile(updateFormData);
      console.log("Profile updated successfully");
      setStatus("Profile updated successfully!");
      setEditing(false);
      await loadProfile();
      // Reload page to update auth context
      window.location.reload();
    } catch (error) {
      console.error("Error updating profile:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setStatus(error.response?.data?.message || "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setFormData({
        name: profile.name || "",
        grade: profile.grade || profile.student?.grade || profile.candidate?.grade || "",
        dob: profile.dob || profile.student?.dob ? new Date(profile.dob || profile.student.dob).toISOString().split("T")[0] : "",
        photo: null,
      });
    }
    setStatus("");
  };

  if (loading) {
    return (
      <section className="page">
        <div className="card">
          <p>Loading profile...</p>
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="page">
        <div className="card">
          <p className="error">Failed to load profile</p>
          <button className="btn" onClick={loadProfile}>
            Retry
          </button>
        </div>
      </section>
    );
  }

  const displayPhoto = profile.photoUrl || profile.student?.photoUrl || profile.candidate?.photoUrl;

  return (
    <section className="page">
      <div className="card">
        <header className="page__header">
          <div>
            <h2>My Profile</h2>
            <p>View and edit your profile information</p>
          </div>
          {!editing && (
            <button className="btn" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          )}
        </header>

        {status && (
          <div className={`card ${status.includes("Failed") ? "error" : "success"}`}>
            <p>{status}</p>
          </div>
        )}

        {editing ? (
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="profile-photo-section">
              <label>
                Profile Photo
                <div style={{ marginTop: "0.5rem" }}>
                  {displayPhoto && (
                    <img
                      src={getImageUrl(displayPhoto)}
                      alt="Current profile"
                      style={{
                        width: "150px",
                        height: "150px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        marginBottom: "1rem",
                        border: "3px solid #e2e8f0",
                      }}
                    />
                  )}
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleChange}
                    style={{ marginTop: "0.5rem" }}
                  />
                  <small style={{ color: "#64748b", display: "block", marginTop: "0.25rem" }}>
                    {formData.photo ? `Selected: ${formData.photo.name}` : "Leave empty to keep current photo"}
                  </small>
                </div>
              </label>
            </div>

            <label>
              Name *
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </label>

            {authUser?.role !== "admin" && (
              <>
                <label>
                  Grade
                  <input
                    type="text"
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                  />
                </label>

                {authUser?.role === "student" && (
                  <label>
                    Date of Birth
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                    />
                  </label>
                )}
              </>
            )}

            <div className="hero__cta">
              <button className="btn" type="submit">
                Save Changes
              </button>
              <button
                className="btn secondary"
                type="button"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-view">
            <div className="profile-photo-section" style={{ textAlign: "center", marginBottom: "2rem" }}>
              {displayPhoto ? (
                <img
                  src={getImageUrl(displayPhoto)}
                  alt={profile.name}
                  style={{
                    width: "200px",
                    height: "200px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "4px solid #e2e8f0",
                    margin: "0 auto",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "200px",
                    height: "200px",
                    borderRadius: "50%",
                    backgroundColor: "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "4rem",
                    color: "#94a3b8",
                    margin: "0 auto",
                  }}
                >
                  {profile.name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
            </div>

            <div className="profile-info">
              <div className="profile-field">
                <strong>Name:</strong> {profile.name}
              </div>
              <div className="profile-field">
                <strong>Username:</strong> {profile.username}
              </div>
              <div className="profile-field">
                <strong>Role:</strong> {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)}
              </div>
              {profile.grade && (
                <div className="profile-field">
                  <strong>Grade:</strong> {profile.grade}
                </div>
              )}
              {profile.dob && (
                <div className="profile-field">
                  <strong>Date of Birth:</strong> {new Date(profile.dob).toLocaleDateString()}
                </div>
              )}
              {profile.student && (
                <>
                  <div className="profile-field">
                    <strong>Has Voted:</strong> {profile.student.hasVoted ? "Yes" : "No"}
                  </div>
                </>
              )}
              {profile.candidate && (
                <>
                  <div className="profile-field">
                    <strong>Approval Status:</strong>{" "}
                    <span className={`status status-${profile.candidate.isApproved ? "approved" : "pending"}`}>
                      {profile.candidate.isApproved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  {profile.candidate.manifesto && (
                    <div className="profile-field">
                      <strong>Manifesto:</strong>
                      <p>{profile.candidate.manifesto}</p>
                    </div>
                  )}
                </>
              )}
              <div className="profile-field">
                <strong>Member Since:</strong> {new Date(profile.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Profile;

