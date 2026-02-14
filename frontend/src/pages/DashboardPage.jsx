import { useEffect, useState } from "react";
import { getAuth, postAuth } from "../api";
import { getStoredUser } from "../authStorage";
import TopNav from "../components/TopNav";

const initialForm = {
  height: "",
  weight: "",
  activity_level: "",
  diet_type: "",
  sleep_hours: "",
  stress_level: 5,
};

function getRiskClassName(riskLevel) {
  const normalized = String(riskLevel || "").toLowerCase().trim();
  if (normalized.includes("high")) return "high";
  if (normalized.includes("medium")) return "medium";
  if (normalized.includes("low")) return "low";
  return "medium";
}

function getBmiCategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function getActivityScore(activityLevel) {
  const value = String(activityLevel || "").toLowerCase();
  if (value === "sedentary") return 16;
  if (value === "light") return 10;
  if (value === "moderate") return 5;
  if (value === "high") return 2;
  return 8;
}

function getDietScore(dietType) {
  const value = String(dietType || "").toLowerCase();
  if (value === "high sugar") return 14;
  if (value === "high fat") return 12;
  if (value === "balanced") return 4;
  if (value === "vegetarian") return 5;
  return 8;
}

function getAssessmentInsights(assessment) {
  if (!assessment) return null;

  const bmi = Number(assessment.bmi || 0);
  const sleepHours = Number(assessment.sleep_hours || 0);
  const stressLevel = Number(assessment.stress_level || 0);
  const riskLevel = String(assessment.risk_level || "").toLowerCase();

  const baseRiskScore = riskLevel.includes("high") ? 60 : riskLevel.includes("medium") ? 40 : 20;
  const bmiRiskScore = bmi >= 30 || bmi < 18.5 ? 15 : bmi >= 25 ? 8 : 2;
  const sleepRiskScore = sleepHours < 5 ? 14 : sleepHours < 7 ? 8 : sleepHours <= 9 ? 3 : 9;
  const stressRiskScore = stressLevel >= 8 ? 16 : stressLevel >= 6 ? 10 : stressLevel >= 4 ? 6 : 2;
  const activityRiskScore = getActivityScore(assessment.activity_level);
  const dietRiskScore = getDietScore(assessment.diet_type);

  const totalRisk = Math.min(
    95,
    Math.round(baseRiskScore + bmiRiskScore + sleepRiskScore + stressRiskScore + activityRiskScore + dietRiskScore),
  );

  const severeOutcomeRisk = Math.min(40, Math.max(3, Math.round(totalRisk * 0.35)));
  const healthyShare = Math.max(0, 100 - totalRisk);

  return {
    bmiCategory: getBmiCategory(bmi),
    totalRisk,
    severeOutcomeRisk,
    healthyShare,
  };
}

function getDietPlan(assessment, insights) {
  if (!assessment || !insights) return null;

  const stressLevel = Number(assessment.stress_level || 0);
  const sleepHours = Number(assessment.sleep_hours || 0);
  const bmi = Number(assessment.bmi || 0);
  const activity = String(assessment.activity_level || "");
  const currentDiet = String(assessment.diet_type || "");

  const focus = [];
  if (bmi < 18.5) focus.push("Increase healthy calorie intake with protein-rich meals.");
  if (bmi >= 25) focus.push("Create a mild calorie deficit and increase fiber intake.");
  if (stressLevel >= 7) focus.push("Include magnesium-rich foods to support stress management.");
  if (sleepHours < 7) focus.push("Avoid heavy dinner and caffeine at night to improve sleep quality.");
  if (activity === "Sedentary") focus.push("Prefer lower sugar snacks and increase hydration throughout the day.");
  if (focus.length === 0) focus.push("Maintain a balanced macro split with consistent meal timings.");

  const avoid = [];
  if (currentDiet === "High Sugar") avoid.push("Sugary drinks, sweets, and refined flour snacks.");
  if (currentDiet === "High Fat") avoid.push("Deep-fried foods and processed high-fat meals.");
  if (stressLevel >= 7) avoid.push("Excess caffeine after 4 PM.");
  if (sleepHours < 7) avoid.push("Late-night heavy meals.");
  if (avoid.length === 0) avoid.push("Highly processed packaged foods.");

  const mealPlan = [
    {
      meal: "Breakfast",
      plan:
        bmi >= 25
          ? "Oats with chia seeds, 1 boiled egg or sprouts, and 1 fruit."
          : "Peanut butter toast, milk/curd, mixed nuts, and 1 fruit.",
    },
    {
      meal: "Mid-Morning",
      plan: "Coconut water or buttermilk with roasted chana or almonds.",
    },
    {
      meal: "Lunch",
      plan:
        currentDiet === "Vegetarian"
          ? "2 whole-grain rotis, dal/rajma/chole, mixed vegetable salad, curd."
          : "2 whole-grain rotis, grilled chicken/fish or dal, vegetables, curd.",
    },
    {
      meal: "Evening Snack",
      plan: stressLevel >= 7 ? "Banana + handful of nuts + herbal tea." : "Fruit + nuts or paneer cubes.",
    },
    {
      meal: "Dinner",
      plan:
        sleepHours < 7
          ? "Light dinner: soup + sauteed vegetables + protein (paneer/tofu/chicken)."
          : "Balanced dinner: quinoa/brown rice + vegetables + protein.",
    },
  ];

  return { focus, avoid, mealPlan };
}

function getFutureOutlook(assessment, insights) {
  if (!assessment || !insights) return null;

  const bmi = Number(assessment.bmi || 0);
  const stress = Number(assessment.stress_level || 0);
  const sleep = Number(assessment.sleep_hours || 0);
  const activity = String(assessment.activity_level || "");
  const diet = String(assessment.diet_type || "");

  const drawbackSignals = [
    {
      label: "Metabolic risk",
      score: Math.min(100, Math.round(insights.totalRisk * 0.9 + (diet === "High Sugar" ? 10 : 0))),
    },
    {
      label: "Weight instability",
      score: Math.min(100, Math.round((bmi >= 25 || bmi < 18.5 ? 65 : 35) + (activity === "Sedentary" ? 20 : 0))),
    },
    {
      label: "Sleep and recovery issue",
      score: Math.min(100, Math.round((sleep < 7 ? 65 : 30) + (stress >= 7 ? 20 : 5))),
    },
    {
      label: "Stress burnout chance",
      score: Math.min(100, Math.round(stress * 8 + (sleep < 7 ? 10 : 0))),
    },
    {
      label: "Cardio strain",
      score: Math.min(100, Math.round((diet === "High Fat" ? 60 : 35) + (activity === "Sedentary" ? 20 : 0))),
    },
  ];

  const avgDrawback = Math.round(drawbackSignals.reduce((acc, item) => acc + item.score, 0) / drawbackSignals.length);
  const projected6Month = Math.min(100, Math.round(insights.totalRisk + avgDrawback * 0.12));
  const projected12Month = Math.min(100, Math.round(insights.totalRisk + avgDrawback * 0.22));

  const timeline = [
    {
      period: "Next 1-3 months",
      message:
        avgDrawback >= 60
          ? "Energy dips, cravings, and stress-linked sleep disturbance may increase."
          : "Mild fatigue and inconsistent recovery can start if habits stay unchanged.",
    },
    {
      period: "Next 3-6 months",
      message:
        avgDrawback >= 60
          ? "Weight, blood sugar trend, and concentration issues may become more visible."
          : "You may see gradual increase in risk markers and stress load.",
    },
    {
      period: "Next 6-12 months",
      message:
        avgDrawback >= 60
          ? "Sustained lifestyle imbalance may raise chronic-risk trajectory."
          : "Current risk can drift upward if diet and recovery are not improved.",
    },
  ];

  return { drawbackSignals, projected6Month, projected12Month, timeline };
}

export default function DashboardPage() {
  const [active, setActive] = useState("health-form");
  const [form, setForm] = useState(initialForm);
  const [assessment, setAssessment] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pieHoverInfo, setPieHoverInfo] = useState(null);
  const user = getStoredUser();
  const insights = getAssessmentInsights(assessment);
  const dietPlan = getDietPlan(assessment, insights);
  const futureOutlook = getFutureOutlook(assessment, insights);

  function getPieSegmentFromEvent(event) {
    if (!insights) return null;
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const point = "touches" in event && event.touches?.[0] ? event.touches[0] : event;
    const x = point.clientX - rect.left;
    const y = point.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const outerRadius = rect.width / 2;
    const innerRadius = outerRadius * 0.56;

    if (distance < innerRadius || distance > outerRadius) return null;

    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    const anglePercent = (angle / 360) * 100;

    const totalRiskEnd = insights.totalRisk;
    const severeEnd = Math.min(100, insights.totalRisk + insights.severeOutcomeRisk);

    let segment = {
      label: "Healthy Share",
      value: insights.healthyShare,
      colorClass: "dot-healthy",
      description: "Lower current risk region.",
    };

    if (anglePercent <= totalRiskEnd) {
      segment = {
        label: "Overall Risk",
        value: insights.totalRisk,
        colorClass: "dot-risk",
        description: "Current total health-risk intensity.",
      };
    } else if (anglePercent <= severeEnd) {
      segment = {
        label: "Severe Outcome Indicator",
        value: insights.severeOutcomeRisk,
        colorClass: "dot-severe",
        description: "Estimated severe outcome signal.",
      };
    }

    return {
      ...segment,
      x,
      y,
    };
  }

  function handlePiePointerMove(event) {
    const segment = getPieSegmentFromEvent(event);
    setPieHoverInfo(segment);
  }

  async function loadResults() {
    try {
      const data = await getAuth("/get-health-data");
      setAssessment(data.assessment || null);
    } catch {
      setAssessment(null);
    }
  }

  async function loadHistory() {
    try {
      const data = await getAuth("/get-history");
      setHistory(data.history || []);
    } catch {
      setHistory([]);
    }
  }

  useEffect(() => {
    loadResults();
    loadHistory();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    setMessage("Processing your assessment...");
    try {
      const data = await postAuth("/submit-health-data", {
        height: Number(form.height),
        weight: Number(form.weight),
        activity_level: form.activity_level,
        diet_type: form.diet_type,
        sleep_hours: Number(form.sleep_hours),
        stress_level: Number(form.stress_level),
      });
      setMessage("Assessment submitted successfully!");
      setAssessment(data.assessment);
      await loadHistory();
      setActive("results");
    } catch (err) {
      setError(true);
      setMessage(err.message || "Failed to submit health data");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <TopNav dashboardPath="/dashboard" />
      <div className="dashboard-container">
        <div className="sidebar">
          <h3>Welcome, {user?.fullName?.split(" ")[0] || user?.username || ""}</h3>
          <div className="menu">
            <button className={`menu-item ${active === "health-form" ? "active" : ""}`} onClick={() => setActive("health-form")}>
              Enter Health Data
            </button>
            <button className={`menu-item ${active === "results" ? "active" : ""}`} onClick={() => setActive("results")}>
              My Results
            </button>
            <button className={`menu-item ${active === "history" ? "active" : ""}`} onClick={() => setActive("history")}>
              Health History
            </button>
          </div>
        </div>

        <div className="main-content">
          {active === "health-form" ? (
            <div className="section active">
              <h2>Health & Lifestyle Assessment</h2>
              <form onSubmit={onSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Height (cm):</label>
                    <input type="number" min="100" max="250" step="0.1" required value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Weight (kg):</label>
                    <input type="number" min="30" max="200" step="0.1" required value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Physical Activity Level:</label>
                    <select required value={form.activity_level} onChange={(e) => setForm({ ...form, activity_level: e.target.value })}>
                      <option value="">Select Activity Level</option>
                      <option value="Sedentary">Sedentary (No exercise)</option>
                      <option value="Light">Light (1-3 days/week)</option>
                      <option value="Moderate">Moderate (3-5 days/week)</option>
                      <option value="High">High (6-7 days/week)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Diet Type:</label>
                    <select required value={form.diet_type} onChange={(e) => setForm({ ...form, diet_type: e.target.value })}>
                      <option value="">Select Diet Type</option>
                      <option value="Balanced">Balanced</option>
                      <option value="High Sugar">High Sugar</option>
                      <option value="High Fat">High Fat</option>
                      <option value="Vegetarian">Vegetarian</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Average Sleep Hours (per night):</label>
                    <input type="number" min="2" max="12" step="0.5" required value={form.sleep_hours} onChange={(e) => setForm({ ...form, sleep_hours: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Stress Level (1-10):</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={form.stress_level}
                      onChange={(e) => setForm({ ...form, stress_level: e.target.value })}
                    />
                    <span id="stressValue">{form.stress_level}</span>
                  </div>
                </div>
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? "Processing..." : "Submit & Get Risk Assessment"}
                </button>
                {message ? <div className={`message ${error ? "error" : "success"}`}>{message}</div> : null}
              </form>
            </div>
          ) : null}

          {active === "results" ? (
            <div className="section active">
              <h2>Your Health Risk Assessment</h2>
              {!assessment ? (
                <div id="noResultMessage" className="message">
                  No assessment results yet. Submit your health data first.
                </div>
              ) : (
                <div className="result-container">
                  <div className="risk-result">
                    <div className={`risk-level ${getRiskClassName(assessment.risk_level)}`}>{assessment.risk_level}</div>
                    <div className="risk-score-chip">
                      Risk Score: {typeof assessment.risk_score === "number" ? assessment.risk_score.toFixed(2) : `${insights.totalRisk.toFixed(2)} (estimated)`}
                    </div>
                  </div>
                  <div className="risk-visualization">
                    <h3>Risk & Outcome Prediction</h3>
                    <div className="risk-chart-wrap">
                      <div
                        className="risk-pie"
                        style={{
                          background: `conic-gradient(
                            #ef4444 0% ${insights.totalRisk}%,
                            #f97316 ${insights.totalRisk}% ${Math.min(100, insights.totalRisk + insights.severeOutcomeRisk)}%,
                            #22c55e ${Math.min(100, insights.totalRisk + insights.severeOutcomeRisk)}% 100%
                          )`,
                        }}
                        aria-label="Risk and outcome pie chart"
                        onMouseMove={handlePiePointerMove}
                        onMouseLeave={() => setPieHoverInfo(null)}
                        onTouchStart={handlePiePointerMove}
                        onTouchMove={handlePiePointerMove}
                        onTouchEnd={() => setPieHoverInfo(null)}
                      >
                        <div className="risk-pie-center">
                          <div className="risk-pie-value">{insights.totalRisk}%</div>
                          <div className="risk-pie-label">Risk Index</div>
                        </div>
                        {pieHoverInfo ? (
                          <div
                            className="pie-tooltip"
                            style={{
                              left: `${pieHoverInfo.x}px`,
                              top: `${pieHoverInfo.y}px`,
                            }}
                          >
                            <div className="pie-tooltip-title">
                              <span className={`dot ${pieHoverInfo.colorClass}`} />
                              {pieHoverInfo.label}
                            </div>
                            <div className="pie-tooltip-value">{pieHoverInfo.value}%</div>
                            <div className="pie-tooltip-desc">{pieHoverInfo.description}</div>
                          </div>
                        ) : null}
                      </div>
                      <div className="risk-legend">
                        <div><span className="dot dot-risk" /> Overall Risk: {insights.totalRisk}%</div>
                        <div><span className="dot dot-severe" /> Severe Outcome Indicator: {insights.severeOutcomeRisk}%</div>
                        <div><span className="dot dot-healthy" /> Healthy Share: {insights.healthyShare}%</div>
                      </div>
                    </div>
                  </div>
                  <div className="metrics-display">
                    <h3>Detailed Assessment Table</h3>
                    <table className="metrics-table detailed-table">
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th>User Data</th>
                          <th>Interpretation</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>BMI</td>
                          <td>{Number(assessment.bmi).toFixed(2)}</td>
                          <td>{insights.bmiCategory}</td>
                        </tr>
                        <tr>
                          <td>Sleep Hours</td>
                          <td>{assessment.sleep_hours}</td>
                          <td>{Number(assessment.sleep_hours) < 7 ? "Below ideal range" : "Within preferred range"}</td>
                        </tr>
                        <tr>
                          <td>Stress Level</td>
                          <td>{assessment.stress_level}/10</td>
                          <td>{Number(assessment.stress_level) >= 7 ? "High stress load" : "Manageable stress load"}</td>
                        </tr>
                        <tr>
                          <td>Activity</td>
                          <td>{assessment.activity_level}</td>
                          <td>{assessment.activity_level === "Sedentary" ? "Low movement pattern" : "Active movement pattern"}</td>
                        </tr>
                        <tr>
                          <td>Diet</td>
                          <td>{assessment.diet_type}</td>
                          <td>{assessment.diet_type === "High Sugar" || assessment.diet_type === "High Fat" ? "Higher dietary risk" : "Lower dietary risk"}</td>
                        </tr>
                        <tr>
                          <td>Final Risk Level</td>
                          <td>{assessment.risk_level}</td>
                          <td>Model prediction</td>
                        </tr>
                        <tr>
                          <td>Risk Score</td>
                          <td>
                            {typeof assessment.risk_score === "number" ? assessment.risk_score.toFixed(2) : insights.totalRisk.toFixed(2)}
                          </td>
                          <td>Numerical model score (0-100)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="diet-plan-display">
                    <h3>Recommended Diet Plan</h3>
                    <p className="diet-summary">
                      Designed from your current inputs: BMI {Number(assessment.bmi).toFixed(2)}, {assessment.activity_level} activity,
                      {` ${assessment.sleep_hours}`} hours sleep, stress {assessment.stress_level}/10, and {assessment.diet_type} diet.
                    </p>
                    <div className="diet-grid">
                      <div className="diet-card">
                        <h4>Focus Areas</h4>
                        <ul>
                          {dietPlan.focus.map((item, idx) => (
                            <li key={`focus-${idx}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="diet-card">
                        <h4>Limit / Avoid</h4>
                        <ul>
                          {dietPlan.avoid.map((item, idx) => (
                            <li key={`avoid-${idx}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <table className="metrics-table meal-plan-table">
                      <thead>
                        <tr>
                          <th>Meal Time</th>
                          <th>Suggested Plan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dietPlan.mealPlan.map((item, idx) => (
                          <tr key={`meal-${idx}`}>
                            <td>{item.meal}</td>
                            <td>{item.plan}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="future-impact-display">
                    <h3>If You Continue Current Diet & Lifestyle</h3>
                    <p className="future-impact-summary">
                      This projection shows likely drawbacks over time if current habits remain unchanged.
                    </p>

                    <div className="future-projection-grid">
                      <div className="future-projection-card">
                        <span>Current Risk Index</span>
                        <strong>{insights.totalRisk}%</strong>
                      </div>
                      <div className="future-projection-card warning">
                        <span>Projected Risk (6 months)</span>
                        <strong>{futureOutlook.projected6Month}%</strong>
                      </div>
                      <div className="future-projection-card danger">
                        <span>Projected Risk (12 months)</span>
                        <strong>{futureOutlook.projected12Month}%</strong>
                      </div>
                    </div>

                    <div className="future-timeline">
                      {futureOutlook.timeline.map((item, idx) => (
                        <div className="future-timeline-item" key={`timeline-${idx}`}>
                          <h4>{item.period}</h4>
                          <p>{item.message}</p>
                        </div>
                      ))}
                    </div>

                    <div className="drawback-bars">
                      <h4>Potential Drawbacks (Future)</h4>
                      {futureOutlook.drawbackSignals.map((item, idx) => (
                        <div className="drawback-row" key={`drawback-${idx}`}>
                          <div className="drawback-head">
                            <span>{item.label}</span>
                            <span>{item.score}%</span>
                          </div>
                          <div className="drawback-track">
                            <div className="drawback-fill" style={{ width: `${item.score}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {active === "history" ? (
            <div className="section active">
              <h2>Health Assessment History</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Risk Level</th>
                    <th>BMI</th>
                    <th>Sleep Hours</th>
                    <th>Stress Level</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-data">
                        No history available yet.
                      </td>
                    </tr>
                  ) : (
                    history.map((entry, idx) => (
                      <tr key={`${entry.date}-${idx}`}>
                        <td>{new Date(entry.date).toLocaleDateString()}</td>
                        <td>{entry.risk_level}</td>
                        <td>{Number(entry.bmi).toFixed(2)}</td>
                        <td>{entry.sleep_hours}</td>
                        <td>{entry.stress_level}/10</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
