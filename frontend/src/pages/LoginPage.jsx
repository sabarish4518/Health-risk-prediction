import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { postPublic } from "../api";
import { saveUser } from "../authStorage";
import TopNav from "../components/TopNav";

export default function LoginPage() {
  const [form, setForm] = useState({
    username: "student",
    password: "student123",
    user_type: "student",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError(false);
    setMessage("Logging in...");
    try {
      const data = await postPublic("/login", form);
      saveUser({
        token: data.token,
        userId: data.user_id,
        username: data.username,
        fullName: data.full_name || data.username,
        userType: data.user_type || form.user_type,
      });
      setMessage("Login successful");
      navigate((data.user_type || form.user_type) === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(true);
      setMessage(err.message || "Login failed");
    }
  }

  return (
    <div className="container">
      <TopNav />
      <div className="auth-container">
        <div className="auth-box">
          <h2>Login</h2>
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Username:</label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Login as:</label>
              <select
                value={form.user_type}
                onChange={(e) => setForm({ ...form, user_type: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button className="btn btn-primary full-width" type="submit">
              Login
            </button>
          </form>
          <p className="auth-link">
            No account? <Link to="/register">Register</Link>
          </p>
          {message ? <div className={`message ${error ? "error" : "success"}`}>{message}</div> : null}
        </div>
      </div>
      <footer>
        <p>&copy; 2026 Student Health Risk Prediction System. All rights reserved.</p>
      </footer>
    </div>
  );
}

