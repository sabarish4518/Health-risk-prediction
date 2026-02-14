import { useEffect, useMemo, useState } from "react";
import { deleteAuth, getAuth } from "../api";
import TopNav from "../components/TopNav";

export default function AdminPage() {
  const [active, setActive] = useState("students");
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [statistics, setStatistics] = useState({
    total_students: 0,
    low_risk_count: 0,
    medium_risk_count: 0,
    high_risk_count: 0,
  });
  const [analytics, setAnalytics] = useState({
    avg_bmi: 0,
    avg_sleep_hours: 0,
    avg_stress_level: 0,
    most_common_activity: "N/A",
  });

  async function loadStudents() {
    const data = await getAuth("/admin/users");
    setStudents(data.students || []);
  }

  async function loadStatistics() {
    const data = await getAuth("/admin/statistics");
    setStatistics(data.statistics || statistics);
  }

  async function loadAnalytics() {
    const data = await getAuth("/admin/analytics");
    setAnalytics(data.analytics || analytics);
  }

  useEffect(() => {
    loadStudents().catch(() => setStudents([]));
    loadStatistics().catch(() => null);
  }, []);

  useEffect(() => {
    if (active === "analytics") loadAnalytics().catch(() => null);
    if (active === "statistics") loadStatistics().catch(() => null);
  }, [active]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) => `${s.username} ${s.email}`.toLowerCase().includes(term));
  }, [students, search]);

  async function onDelete(id) {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    await deleteAuth(`/admin/delete-user/${id}`);
    await loadStudents();
  }

  const total = statistics.total_students || 1;

  return (
    <div className="container">
      <TopNav title="Health Risk Predictor - Admin" dashboardPath="/admin" />
      <div className="dashboard-container">
        <div className="sidebar">
          <h3>Admin Panel</h3>
          <div className="menu">
            <button className={`menu-item ${active === "students" ? "active" : ""}`} onClick={() => setActive("students")}>
              Students
            </button>
            <button className={`menu-item ${active === "statistics" ? "active" : ""}`} onClick={() => setActive("statistics")}>
              Statistics
            </button>
            <button className={`menu-item ${active === "analytics" ? "active" : ""}`} onClick={() => setActive("analytics")}>
              Analytics
            </button>
          </div>
        </div>

        <div className="main-content">
          {active === "students" ? (
            <div className="section active">
              <h2>All Students</h2>
              <div className="search-bar">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by username or email..." />
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Full Name</th>
                    <th>Age</th>
                    <th>Last Assessment</th>
                    <th>Risk</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-data">
                        No students found
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td>{s.username}</td>
                        <td>{s.email}</td>
                        <td>{s.full_name}</td>
                        <td>{s.age}</td>
                        <td>{s.last_assessment_date ? new Date(s.last_assessment_date).toLocaleDateString() : "Never"}</td>
                        <td>{s.risk_level || "N/A"}</td>
                        <td>
                          <button className="btn btn-danger" onClick={() => onDelete(s.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : null}

          {active === "statistics" ? (
            <div className="section active">
              <h2>Health Risk Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h4>Total Students</h4>
                  <p className="stat-number">{statistics.total_students}</p>
                </div>
                <div className="stat-card">
                  <h4>Low Risk</h4>
                  <p className="stat-number">{statistics.low_risk_count}</p>
                </div>
                <div className="stat-card">
                  <h4>Medium Risk</h4>
                  <p className="stat-number">{statistics.medium_risk_count}</p>
                </div>
                <div className="stat-card">
                  <h4>High Risk</h4>
                  <p className="stat-number">{statistics.high_risk_count}</p>
                </div>
              </div>
              <div className="stats-table-container">
                <h3>Distribution</h3>
                <table className="data-table">
                  <tbody>
                    <tr>
                      <td>Low Risk</td>
                      <td>{statistics.low_risk_count}</td>
                      <td>{Math.round((statistics.low_risk_count / total) * 100)}%</td>
                    </tr>
                    <tr>
                      <td>Medium Risk</td>
                      <td>{statistics.medium_risk_count}</td>
                      <td>{Math.round((statistics.medium_risk_count / total) * 100)}%</td>
                    </tr>
                    <tr>
                      <td>High Risk</td>
                      <td>{statistics.high_risk_count}</td>
                      <td>{Math.round((statistics.high_risk_count / total) * 100)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {active === "analytics" ? (
            <div className="section active">
              <h2>Health Analytics</h2>
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h4>Average BMI</h4>
                  <p className="analytics-value">{Number(analytics.avg_bmi).toFixed(2)}</p>
                </div>
                <div className="analytics-card">
                  <h4>Average Sleep</h4>
                  <p className="analytics-value">{Number(analytics.avg_sleep_hours).toFixed(1)} hrs</p>
                </div>
                <div className="analytics-card">
                  <h4>Average Stress</h4>
                  <p className="analytics-value">{Number(analytics.avg_stress_level).toFixed(1)}/10</p>
                </div>
                <div className="analytics-card">
                  <h4>Common Activity</h4>
                  <p className="analytics-value">{analytics.most_common_activity || "N/A"}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <footer>
        <p>&copy; 2026 Student Health Risk Prediction System. All rights reserved.</p>
      </footer>
    </div>
  );
}

