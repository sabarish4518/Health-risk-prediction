import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { postPublic } from "../api";
import { saveUser } from "../authStorage";
import TopNav from "../components/TopNav";

export default function LoginPage() {
  const [userType, setUserType] = useState("student");
  const [form, setForm] = useState({
    username: "student",
    password: "student123",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError(false);
    setMessage("Logging in...");
    try {
      const data = await postPublic("/login", { ...form, user_type: userType });
      saveUser({
        token: data.token,
        userId: data.user_id,
        username: data.username,
        fullName: data.full_name || data.username,
        age: data.age ?? null,
        gender: data.gender || "",
        userType: data.user_type || userType,
        unreadFeedbackCount: Number(data.unread_feedback_count || 0),
      });
      setMessage("Login successful");
      navigate((data.user_type || userType) === "admin" ? "/admin-dashboard" : "/dashboard");
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
          <h2>{userType === "admin" ? "Admin Login" : "Student Login"}</h2>
          <div className="mode-toggle">
            <button
              type="button"
              className={`mode-btn ${userType === "student" ? "active" : ""}`}
              onClick={() => {
                setUserType("student");
                setForm({ username: "student", password: "student123" });
              }}
            >
              Student
            </button>
            <button
              type="button"
              className={`mode-btn ${userType === "admin" ? "active" : ""}`}
              onClick={() => {
                setUserType("admin");
                setForm({ username: "admin", password: "admin123" });
              }}
            >
              Admin
            </button>
          </div>
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
            <button className="btn btn-primary full-width" type="submit">
              {userType === "admin" ? "Login as Admin" : "Login as Student"}
            </button>
          </form>
          {userType === "student" ? (
            <p className="auth-link">
              No account? <Link to="/register">Register</Link>
            </p>
          ) : null}
          {message ? <div className={`message ${error ? "error" : "success"}`}>{message}</div> : null}
        </div>
      </div>
      <footer>
        <p>&copy; 2026 Student Health Risk Prediction System. All rights reserved.</p>
      </footer>
    </div>
  );
}
