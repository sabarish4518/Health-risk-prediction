import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";

export default function HomePage() {
  return (
    <div className="container">
      <TopNav />
      <div className="hero-section">
        <div className="hero-content">
          <h2>Student Health Risk Prediction System</h2>
          <p>React frontend with npm-based development workflow</p>
          <div className="hero-buttons">
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Register
            </Link>
          </div>
        </div>
      </div>
      <footer>
        <p>&copy; 2026 Student Health Risk Prediction System. All rights reserved.</p>
      </footer>
    </div>
  );
}

