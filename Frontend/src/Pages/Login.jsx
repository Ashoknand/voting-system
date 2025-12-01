import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Captcha from "../components/Captcha";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "student",
    captcha: "",
    captchaToken: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      // Clear captcha when switching away from student role
      if (name === "role" && value !== "student") {
        return { ...prev, [name]: value, captcha: "", captchaToken: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      if (form.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/ballot");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card form-card">
      <h2>Portal Login</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Role
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="student">Student</option>
            <option value="candidate">Candidate</option>
            <option value="admin">Administrator</option>
          </select>
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
        {form.role === "student" && (
          <Captcha
            value={form.captcha}
            onChange={(value) => setForm((prev) => ({ ...prev, captcha: value }))}
            onTokenChange={(token) => setForm((prev) => ({ ...prev, captchaToken: token }))}
          />
        )}
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Authenticating..." : "Login"}
        </button>
      </form>
    </section>
  );
};

export default Login;

