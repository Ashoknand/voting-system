import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getImageUrl } from "../utils/imageUrl";
import logo from "../assets/logo.png";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const profilePhoto = user?.photoUrl || user?.student?.photoUrl || user?.candidate?.photoUrl;

  return (
    <header className="nav">
      <div className="nav__brand" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", height: "60px" }}>
          <img src={logo} alt="A-VAC Smart Voting System" style={{ width: "60px", height: "60px", objectFit: "contain" }} />
        </Link>
        <Link to="/" style={{ display: "flex", alignItems: "center", height: "60px", fontSize: "2rem", fontWeight: "600" }}>
          A_VAC Smart Voting System
        </Link>
      </div>
      <nav className="nav__links">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/ballot">Ballot</NavLink>
        {isAuthenticated && <NavLink to="/gallery">Gallery</NavLink>}
        {isAuthenticated && <NavLink to="/campaign-feed">Campaign Feed</NavLink>}
        {user?.role === "candidate" && (
          <>
            <NavLink to="/candidate/dashboard">My Dashboard</NavLink>
            <NavLink to="/candidate/campaigns">My Campaigns</NavLink>
          </>
        )}
        {user?.role === "admin" && (
          <>
            <NavLink to="/admin">Admin Dashboard</NavLink>
            <NavLink to="/admin/students">Manage Students</NavLink>
            <NavLink to="/admin/candidates">Manage Candidates</NavLink>
          </>
        )}
        {!isAuthenticated && (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register/student">Student Register</NavLink>
            <NavLink to="/register/candidate">Candidate Register</NavLink>
          </>
        )}
        {isAuthenticated && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <NavLink
              to="/profile"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                textDecoration: "none",
                padding: "0.5rem",
                borderRadius: "0.5rem",
                transition: "background-color 0.2s",
              }}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {profilePhoto ? (
                <img
                  src={getImageUrl(profilePhoto)}
                  alt={user?.name || "Profile"}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #e2e8f0",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <span
                style={{
                  display: profilePhoto ? "none" : "flex",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#e2e8f0",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.875rem",
                  color: "#64748b",
                  fontWeight: "600",
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
              <span style={{ fontSize: "0.875rem" }}>Profile</span>
            </NavLink>
            <button className="nav__logout" onClick={handleLogout}>
              Logout ({user?.role})
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;

