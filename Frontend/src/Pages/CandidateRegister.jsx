import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CandidateRegister = () => {
  const navigate = useNavigate();
  const { registerCandidate } = useAuth();
  const [form, setForm] = useState({
    name: "",
    grade: "",
    username: "",
    password: "",
    confirmPassword: "",
    manifesto: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerCandidate(form);
      navigate("/ballot");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card form-card">
      <h2>Candidate Registration</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Full Name
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Grade
          <input
            name="grade"
            value={form.grade}
            onChange={handleChange}
            placeholder="e.g. Grade 12"
            required
          />
        </label>
        <label>
          Username
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Confirm Password
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Manifesto / Bio
          <textarea
            name="manifesto"
            value={form.manifesto}
            onChange={handleChange}
            rows={4}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Register"}
        </button>
      </form>
    </section>
  );
};

export default CandidateRegister;

