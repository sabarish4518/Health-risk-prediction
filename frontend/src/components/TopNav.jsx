import { Link, useNavigate } from "react-router-dom";
import { clearUser, getStoredUser } from "../authStorage";

export default function TopNav({ title = "Health Risk Predictor", dashboardPath }) {
  const navigate = useNavigate();
  const user = getStoredUser();

  function logout() {
    clearUser();
    navigate("/login");
  }

  return (
    <div className="navbar">
      <div className="logo">
        <h1>{title}</h1>
      </div>
      <div className="nav-links">
        {user?.token ? (
          <div className="nav-status" aria-label="Current user status">
            <span className="status-dot" />
            <span>{user?.userType === "admin" ? "Admin Session" : "Student Session"}</span>
            <strong>{user?.fullName || user?.username}</strong>
            {user?.userType === "student" && Number(user?.unreadFeedbackCount || 0) > 0 ? (
              <span className="badge warning">Feedback: {Number(user?.unreadFeedbackCount || 0)}</span>
            ) : null}
          </div>
        ) : null}
        {dashboardPath ? <Link to={dashboardPath}>Dashboard</Link> : null}
        {user?.token ? (
          <button id="logoutBtn" className="btn btn-secondary" onClick={logout}>
            Logout
          </button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </div>
  );
}
