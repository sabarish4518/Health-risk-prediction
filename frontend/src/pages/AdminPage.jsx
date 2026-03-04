import { useEffect, useState } from "react";
import { getAuth, postAuth } from "../api";
import TopNav from "../components/TopNav";

export default function AdminPage() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [healthHistory, setHealthHistory] = useState([]);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [feedbackForm, setFeedbackForm] = useState({ health_data_id: "", feedback_text: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadStudents() {
    try {
      const data = await getAuth("/admin/students");
      const list = data.students || [];
      setStudents(list);
      if (list.length > 0 && !selectedStudentId) {
        setSelectedStudentId(list[0].id);
      }
    } catch (err) {
      setError(true);
      setMessage(err.message || "Failed to load students");
    }
  }

  async function loadStudentDetails(studentId) {
    if (!studentId) return;
    setLoading(true);
    try {
      const data = await getAuth(`/admin/students/${studentId}`);
      setSelectedStudent(data.student || null);
      setHealthHistory(data.health_history || []);
      setFeedbackHistory(data.feedback || []);
      setFeedbackForm({ health_data_id: "", feedback_text: "" });
      setError(false);
      setMessage("");
    } catch (err) {
      setError(true);
      setMessage(err.message || "Failed to load student details");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      loadStudentDetails(selectedStudentId);
    }
  }, [selectedStudentId]);

  async function submitFeedback(e) {
    e.preventDefault();
    if (!selectedStudentId) return;
    setError(false);
    setMessage("Sending feedback...");

    try {
      const payload = {
        student_id: Number(selectedStudentId),
        health_data_id: Number(feedbackForm.health_data_id),
        feedback_text: feedbackForm.feedback_text,
      };

      await postAuth("/admin/feedback", payload);
      setMessage("Feedback sent to student.");
      setFeedbackForm({ health_data_id: "", feedback_text: "" });
      await loadStudentDetails(selectedStudentId);
    } catch (err) {
      setError(true);
      setMessage(err.message || "Failed to send feedback");
    }
  }

  return (
    <div className="container">
      <TopNav dashboardPath="/admin-dashboard" title="Admin Dashboard" />
      <div className="dashboard-container">
        <div className="sidebar">
          <h3>Students</h3>
          <div className="menu">
            {students.length === 0 ? (
              <p className="input-helper">No students found.</p>
            ) : (
              students.map((student) => (
                <button
                  key={student.id}
                  className={`menu-item ${selectedStudentId === student.id ? "active" : ""}`}
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  {student.full_name || student.username}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="main-content">
          <div className="section active">
            <h2>Student Review & Feedback</h2>
            {!selectedStudent ? (
              <div className="message">{loading ? "Loading student details..." : "Select a student to review."}</div>
            ) : (
              <>
                <div className="kpi-grid">
                  <article className="kpi-card">
                    <span>Name</span>
                    <strong>{selectedStudent.full_name || selectedStudent.username}</strong>
                  </article>
                  <article className="kpi-card">
                    <span>Username</span>
                    <strong>{selectedStudent.username}</strong>
                  </article>
                  <article className="kpi-card">
                    <span>Age/Gender</span>
                    <strong>{selectedStudent.age || "-"} / {selectedStudent.gender || "-"}</strong>
                  </article>
                  <article className="kpi-card">
                    <span>Total Assessments</span>
                    <strong>{healthHistory.length}</strong>
                  </article>
                </div>

                <div className="metrics-display">
                  <h3>Recent Assessments</h3>
                  <table className="metrics-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Risk</th>
                        <th>BMI</th>
                        <th>Calories (Act/Req)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {healthHistory.length === 0 ? (
                        <tr>
                          <td colSpan="5">No assessments available.</td>
                        </tr>
                      ) : (
                        healthHistory.map((item) => (
                          <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{new Date(item.created_at).toLocaleString()}</td>
                            <td><span className={String(item.risk_level || "").toLowerCase().includes("high") ? "badge danger" : "badge warning"}>{item.risk_level}</span></td>
                            <td>{Number(item.bmi || 0).toFixed(2)}</td>
                            <td>{Number(item.total_calories || 0).toFixed(0)} / {Number(item.required_calories || 0).toFixed(0)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="diet-plan-display">
                  <h3>Send Feedback</h3>
                  <form onSubmit={submitFeedback}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Select Assessment (required)</label>
                        <select
                          required
                          value={feedbackForm.health_data_id}
                          onChange={(e) => setFeedbackForm((prev) => ({ ...prev, health_data_id: e.target.value }))}
                        >
                          <option value="">Choose from student history</option>
                          {healthHistory.map((item) => (
                            <option key={item.id} value={item.id}>
                              #{item.id} | {new Date(item.created_at).toLocaleString()} | {item.risk_level}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" />
                    </div>
                    <div className="form-group">
                      <label>Feedback Message</label>
                      <textarea
                        rows="4"
                        required
                        minLength={5}
                        value={feedbackForm.feedback_text}
                        onChange={(e) => setFeedbackForm((prev) => ({ ...prev, feedback_text: e.target.value }))}
                        placeholder="Write personalized feedback for this student"
                      />
                    </div>
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={healthHistory.length === 0 || !feedbackForm.health_data_id}
                    >
                      Send Feedback
                    </button>
                  </form>
                  {healthHistory.length === 0 ? (
                    <div className="message error">This student has no history yet. Feedback can be sent after at least one assessment is submitted.</div>
                  ) : null}
                </div>

                <div className="future-impact-display">
                  <h3>Feedback History</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Assessment ID</th>
                        <th>Status</th>
                        <th>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbackHistory.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="no-data">No feedback sent yet.</td>
                        </tr>
                      ) : (
                        feedbackHistory.map((item) => (
                          <tr key={item.id}>
                            <td>{new Date(item.created_at).toLocaleString()}</td>
                            <td>{item.health_data_id || "-"}</td>
                            <td>{Number(item.is_read) === 1 ? "Read" : "Unread"}</td>
                            <td>{item.feedback_text}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {message ? <div className={`message ${error ? "error" : "success"}`}>{message}</div> : null}
          </div>
        </div>
      </div>
      <footer>
        <p>&copy; 2026 Student Health Risk Prediction System. All rights reserved.</p>
      </footer>
    </div>
  );
}
