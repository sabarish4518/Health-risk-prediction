# Student Health Risk Prediction System

A full-stack web application for student health assessment with role-based access:
- **Students** can submit lifestyle/food data, get risk prediction, track history, and receive admin feedback notifications.
- **Admins** can review each student's submitted assessment history and send targeted feedback.

---

## Table of Contents
- [What This Project Does](#what-this-project-does)
- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Setup Guide](#setup-guide)
- [Environment Variables](#environment-variables)
- [Default Credentials](#default-credentials)
- [API Overview](#api-overview)
- [Risk and Diet Assessment Logic](#risk-and-diet-assessment-logic)
- [Admin Feedback Notification Flow](#admin-feedback-notification-flow)
- [Troubleshooting](#troubleshooting)

---

## What This Project Does

The system collects student health and dietary behavior, computes a risk profile, and presents insights with visualizations.

The latest implementation includes:
- Multi-day food intake logging (minimum 2 days required)
- Searchable food catalog with nutrition lookup support
- Average calorie intake/day based assessment
- Pie-chart based risk visualization with hover tooltip
- Separate **Student** and **Admin** login flows
- Admin-to-student feedback notifications

---

## Tech Stack

### Frontend
- React 19
- React Router DOM
- Vite
- Plain CSS

### Backend
- Node.js
- Express.js
- JWT (`jsonwebtoken`) for authentication
- Password hashing (`bcryptjs`)
- CORS + dotenv

### Database
- MySQL (via `mysql2/promise`)

### External Data Integration
- OpenFoodFacts search API (used to expand food suggestions)

---

## Core Features

### Student Features
- Register account (DB mode)
- Student login
- Submit health metrics and food intake
- Mandatory Day 1 + Day 2 food entry before assessment
- Water intake input in liters/day
- View risk results and prediction charts
- View personal assessment history
- View admin feedback notifications and mark them as read

### Admin Features
- Admin login
- View all students
- Inspect each student individually
- Review student assessment history
- Send feedback linked to a specific assessment record
- Track whether feedback is read/unread

---

## Architecture

### Frontend app
- Route protection by role:
  - `/dashboard` -> student only
  - `/admin-dashboard` -> admin only
- Auth data and role stored in localStorage
- API base URL from `VITE_API_BASE_URL` (defaults to `http://localhost:5000/api`)

### Backend API
- JWT middleware validates token (`tokenRequired`)
- Role guard middleware for admin-only routes (`adminRequired`)
- Quick mode available for fast demo without DB
- DB mode includes table creation/migrations on startup

### Database model (high level)
- `students`
- `admins`
- `health_data`
- `student_feedback`

---

## Project Structure

```text
Student-Health-Risk-Prediction-System/
|-- backend/
|   |-- app.js
|   |-- auth.js
|   |-- calorieAssessment.js
|   |-- database.js
|   |-- model.js
|   |-- package.json
|   |-- .env / .env.example
|
|-- frontend/
|   |-- src/
|   |   |-- App.jsx
|   |   |-- api.js
|   |   |-- authStorage.js
|   |   |-- config.js
|   |   |-- styles.css
|   |   |-- components/TopNav.jsx
|   |   `-- pages/
|   |       |-- HomePage.jsx
|   |       |-- LoginPage.jsx
|   |       |-- RegisterPage.jsx
|   |       |-- DashboardPage.jsx
|   |       `-- AdminPage.jsx
|   `-- package.json
|
`-- README.md
```

---

## Setup Guide

## 1) Backend

```bash
cd backend
npm install
```

Copy env template and configure:

```bash
# Windows PowerShell
Copy-Item .env.example .env
```

Start backend:

```bash
npm start
```

The API runs on `http://localhost:5000` by default.

## 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite dev server will print local URL (commonly `http://localhost:5173`).

---

## Environment Variables

Backend (`backend/.env`):

- `PORT` (default: `5000`)
- `NODE_ENV`
- `SECRET_KEY` (JWT signing key)
- `QUICK_LOGIN_ONLY` (`true`/`false`)
- `QUICK_LOGIN_USERNAME`, `QUICK_LOGIN_PASSWORD`
- `QUICK_ADMIN_USERNAME`, `QUICK_ADMIN_PASSWORD` (optional; defaults used if absent)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME` (used in DB mode default admin creation)

Frontend (`frontend/.env` optional):

- `VITE_API_BASE_URL` (default: `http://localhost:5000/api`)

---

## Default Credentials

### Quick mode (`QUICK_LOGIN_ONLY=true`)
- Student: `student` / `student123`
- Admin: `admin` / `admin123` (unless overridden via `QUICK_ADMIN_*`)

### DB mode (`QUICK_LOGIN_ONLY=false`)
- Student: register via `/register`
- Admin: auto-created from `ADMIN_USERNAME` / `ADMIN_PASSWORD` on startup (if missing)

---

## API Overview

### Public
- `POST /api/register`
- `POST /api/login` (supports `user_type: student|admin`)
- `GET /api/health`

### Student (JWT + student role)
- `GET /api/food-options`
- `GET /api/food-search?q=...`
- `POST /api/submit-health-data`
- `GET /api/get-health-data`
- `GET /api/get-history`
- `GET /api/my-feedback`
- `POST /api/my-feedback/:feedbackId/read`

### Admin (JWT + admin role)
- `GET /api/admin/students`
- `GET /api/admin/students/:studentId`
- `POST /api/admin/feedback`

---

## Risk and Diet Assessment Logic

### Inputs considered
- Height, weight (BMI derived)
- Activity level
- Sleep hours
- Hydration level (derived from liters/day input on frontend)
- Food entries by day (meal type, item, quantity, unit)

### Diet processing
- Validates food items against nutrition dataset
- Converts quantity/units to grams where needed
- Computes daily calories/macros
- Uses **average calories per day** across tracked days
- Classifies diet pattern (e.g., Balanced, High Calorie Diet, Low Protein, etc.)

### Risk prediction
- Rule-based model in `backend/model.js`
- Produces:
  - Risk level
  - Risk score
  - Metric breakdown values used in frontend insights

---

## Admin Feedback Notification Flow

1. Student submits assessment -> health record saved.
2. Admin opens student profile/history.
3. Admin sends feedback linked to a specific `health_data_id`.
4. Feedback stored in `student_feedback` as unread (`is_read = 0`).
5. Student login returns unread count.
6. Student dashboard lists feedback notifications.
7. Student marks feedback read -> `is_read = 1`.

---

## Troubleshooting

### Invalid admin credentials
- Confirm login tab is set to **Admin**.
- In quick mode, use quick admin credentials.
- Restart backend after env changes.

### Registration disabled
- Happens when `QUICK_LOGIN_ONLY=true`.
- Set `QUICK_LOGIN_ONLY=false` to enable normal registration + DB mode.

### DB connection errors
- Verify MySQL is running and credentials are correct in `.env`.
- Ensure database exists (`student_health_db` by default).

### Food search sometimes limited
- OpenFoodFacts call may fail due to network/API rate limits.
- App still falls back to local nutrition dataset.

---

## Notes for Staff Demo

For a quick demonstration without DB setup:
1. Keep `QUICK_LOGIN_ONLY=true`
2. Start backend and frontend
3. Login as student -> submit health data
4. Login as admin -> review student history -> send feedback
5. Login back as student -> verify feedback notification appears

