import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Captcha from "../components/Captcha";
import { useAuth } from "../context/AuthContext";

const RegisterStudent = () => {
  const navigate = useNavigate();
  const { registerStudent } = useAuth();
  const [form, setForm] = useState({
    name: "",
    grade: "",
    dob: "",
    username: "",
    password: "",
    confirmPassword: "",
    captcha: "",
    captchaToken: "",
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
      await registerStudent(form);
      navigate("/ballot");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card form-card">
      <h2>Student Registration</h2>
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
            placeholder="e.g. Grade 10"
            required
          />
        </label>
        <label>
          Date of Birth
          <input
            type="date"
            name="dob"
            value={form.dob}
            onChange={handleChange}
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
        <Captcha
          value={form.captcha}
          onChange={(value) => setForm((prev) => ({ ...prev, captcha: value }))}
          onTokenChange={(token) => setForm((prev) => ({ ...prev, captchaToken: token }))}
        />
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
    </section>
  );
};

export default RegisterStudent;

