import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { postPublic } from "../api";
import TopNav from "../components/TopNav";

function randomUser() {
  const suffix = `${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 9000 + 1000)}`;
  const username = `stu_${suffix}`.slice(0, 20);
  const password = `pass${suffix}`;
  return {
    username,
    email: `${username}@example.com`,
    password,
    password_confirm: password,
    full_name: "Quick Student",
    age: 20,
    gender: "Other",
  };
}

export default function RegisterPage() {
  const [form, setForm] = useState(randomUser());
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError(false);
    setMessage("Registering...");
    if (form.password !== form.password_confirm) {
      setError(true);
      setMessage("Passwords do not match");
      return;
    }
    try {
      await postPublic("/register", {
        username: form.username,
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        age: Number(form.age),
        gender: form.gender,
      });
      setMessage("Registration successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(true);
      setMessage(err.message || "Registration failed");
    }
  }

  return (
    <div className="container">
      <TopNav />
      <div className="auth-container">
        <div className="auth-box">
          <h2>Student Registration</h2>
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Username:</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Confirm Password:</label>
              <input
                type="password"
                value={form.password_confirm}
                onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Full Name:</label>
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Age:</label>
              <input type="number" min="15" max="35" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Gender:</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button className="btn btn-primary full-width" type="submit">
              Register
            </button>
          </form>
          <p className="auth-link">
            Already have an account? <Link to="/login">Login</Link>
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

