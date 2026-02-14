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

