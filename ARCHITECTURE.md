# 📚 Technical Architecture & Code Structure

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (HTML/CSS/JS)                   │
│  ┌──────────────┬──────────────┬──────────────┬────────────┐│
│  │ index.html   │ login.html   │ register.html│dashboard.html││
│  │ (Landing)    │ (Auth)       │ (Auth)       │(Student)    ││
│  └──────────────┴──────────────┴──────────────┴────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │              JavaScript (Fetch API)                       ││
│  │  ┌──────────────┬──────────────┬──────────────┐          ││
│  │  │ auth.js      │ student.js   │ admin.js     │          ││
│  │  └──────────────┴──────────────┴──────────────┘          ││
│  └──────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │  CSS (Responsive Design)                                  ││
│  │  ┌──────────────────────────────────────────────────┐   ││
│  │  │ style.css - All styling, responsive, modern      │   ││
│  │  └──────────────────────────────────────────────────┘   ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP/JSON ↑
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express.js)             │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ app.js - Express.js Application                          ││
│  │ Routes: /api/register, /api/login, /api/submit-...     ││
│  │ Middleware: tokenRequired, adminRequired               ││
│  └──────────────────────────────────────────────────────────┘│
│  ┌──────────────┬──────────────┬──────────────┐             │
│  │ auth.js      │ model.js     │ database.js  │             │
│  │ Security     │ Prediction   │ MySQL Ops    │             │
│  │ Hash/Verify  │ Risk Score   │ CRUD         │             │
│  │ JWT Token    │ ML Logic     │ Queries      │             │
│  └──────────────┴──────────────┴──────────────┘             │
└─────────────────────────────────────────────────────────────┘
                            ↓ SQL ↑
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (MySQL)                           │
│  ┌──────────────┬──────────────┬──────────────┐             │
│  │ students     │ health_data  │ admin        │             │
│  │ table        │ table        │ table        │             │
│  ├──────────────┼──────────────┼──────────────┤             │
│  │ id, username │ id, student_ │ id, username │             │
│  │ email,       │ id, height,  │ password,    │             │
│  │ password,    │ weight, bmi, │ email        │             │
│  │ full_name,   │ activity_    │              │             │
│  │ age, gender  │ level, diet, │              │             │
│  │ created_at   │ sleep_hours, │              │             │
│  │              │ hydration_level,│              │             │
│  │              │ risk_level,  │              │             │
│  │              │ created_at   │              │             │
│  └──────────────┴──────────────┴──────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

---

## File-by-File Explanation

### **Frontend Files**

#### `index.html` (Landing Page)
- **Purpose**: First page users see
- **Sections**: Hero, Features, Risk Info, Footer
- **Navigation**: Links to Login/Register
- **Styling**: Hero gradient background, feature cards

#### `register.html` (Registration)
- **Purpose**: User registration
- **Form Fields**: Username, Email, Password, Full Name, Age, Gender
- **Validation**: Email format, password match, age range
- **JavaScript**: Uses auth.js functions
- **Submit**: POST to `/api/register`

#### `login.html` (Authentication)
- **Purpose**: User login
- **Form Fields**: Username, Password, User Type dropdown
- **User Types**: Student, Admin
- **JavaScript**: Uses auth.js functions
- **Submit**: POST to `/api/login`

#### `dashboard.html` (Student Dashboard)
- **Purpose**: Main student interface
- **Sections**:
  - Left Sidebar: Navigation menu
  - Main Content: Three sections (Health Form, Results, History)
- **Features**:
  - Health data form submission
  - Result visualization with charts
  - Assessment history table
- **JavaScript**: Uses student.js functions

#### `admin.html` (Admin Dashboard)
- **Purpose**: Admin control panel
- **Sections**:
  - Students: Manage all students
  - Statistics: Risk distribution
  - Analytics: Detailed health metrics
- **Features**:
  - Search students
  - Delete users
  - View statistics with charts
- **JavaScript**: Uses admin.js functions

#### `css/style.css` (Styling)
- **Approach**: Vanilla CSS, no frameworks
- **Key Features**:
  - CSS Grid for layouts
  - Flexbox for components
  - Responsive media queries
  - Color scheme: Purple gradient (#667eea, #764ba2)
  - Animations: Fade-in, hover effects
  - Mobile-first design

#### `js/auth.js` (Authentication Logic)
- **Functions**:
  - `registerStudent()`: Handle registration
  - `loginStudent()`: Handle student/admin login
  - `logout()`: Clear session data
  - `validateEmail()`: Email format check
  - `getAuthHeaders()`: Add token to requests
- **Storage**: localStorage for token, user info
- **Redirects**: Based on user type (student/admin)

#### `js/student.js` (Student Dashboard Logic)
- **Functions**:
  - `submitHealthData()`: POST assessment data
  - `loadHealthResults()`: Display latest assessment
  - `loadHealthHistory()`: Display past assessments
  - `showSection()`: Toggle dashboard sections
  - `drawRiskChart()`: Canvas chart rendering
  - `displayRecommendations()`: Show personalized tips
- **Features**: Real-time validation, dynamic chart generation
- **API Calls**: GET/POST to health endpoints

#### `js/admin.js` (Admin Dashboard Logic)
- **Functions**:
  - `loadAllStudents()`: Fetch all students
  - `loadStatistics()`: Get risk statistics
  - `loadAnalytics()`: Get detailed analytics
  - `drawRiskDistributionChart()`: Pie chart
  - `drawActivityChart()`: Bar chart
  - `deleteStudent()`: Remove student
  - `searchStudents()`: Filter students
- **Features**: Real-time search, data filtering
- **Visualizations**: Canvas-based charts

---

### **Backend Files**

#### `app.js` (Main Express.js Application)
- **Purpose**: Core backend server
- **Framework**: Express.js (Node.js web framework)
- **Components**:
  - **Routes** (20+ endpoints):
    - `POST /api/register` - Student registration
    - `POST /api/login` - User authentication
    - `POST /api/submit-health-data` - Save assessment
    - `GET /api/get-health-data` - Retrieve latest
    - `GET /api/get-history` - Assessment history
    - `GET /api/admin/*` - Admin endpoints
  - **Middleware**:
    - `tokenRequired` - JWT verification
    - `adminRequired` - Admin authorization
  - **Error Handling** - Custom error handlers
  - **CORS Setup** - Cross-origin requests allowed
- **Database Integration**: Uses Database class
- **Security**: Password hashing, JWT tokens
- **Initialization**: Auto-creates tables, default admin

#### `database.js` (Database Operations)
- **Class**: `Database`
- **Methods**:
  - **Connection**:
    - `connect()` - DB connection pool
    - `close()` - Disconnect
  - **Admin**:
    - `verifyAdmin()` - Check admin user
    - `createDefaultAdmin()` - Default admin setup
  - **Student**:
    - `registerStudent()` - New student
    - `getStudentByUsername()` - Fetch user
    - `getStudentById()` - Fetch by ID
    - `getAllStudents()` - All students (admin)
    - `deleteStudent()` - Remove student
  - **Health Data**:
    - `saveHealthData()` - Store assessment
    - `getLatestHealthData()` - Most recent
    - `getHealthHistory()` - Past assessments
  - **Analytics**:
    - `getStatistics()` - Risk counts
    - `getAnalytics()` - Health metrics averages
- **Configuration**: Read from .env file
- **Error Handling**: Try-catch with logging

#### `auth.js` (Authentication & Security)
- **Class**: `AuthHandler` (static methods)
- **Static Methods**:
  - **Password**:
    - `hashPassword()` - bcryptjs hashing
    - `verifyPassword()` - Password verification
  - **Tokens**:
    - `generateToken()` - Create JWT
    - `verifyToken()` - Validate JWT
  - **Validation**:
    - `validateEmail()` - Email format
    - `validateUsername()` - Username format
    - `validatePassword()` - Password strength
- **Security**:
  - bcryptjs for hashing (12 salt rounds)
  - JWT (jsonwebtoken) with 7-day expiry
  - Password requirements: uppercase, lowercase, digits
  - Username: 4-20 alphanumeric characters
- **Dependencies**: bcryptjs, jsonwebtoken, dotenv

#### `model.js` (Health Risk Prediction)
- **Class**: `HealthRiskPredictor`
- **Main Method**: `predictRiskLevel(healthData)`
- **Prediction Logic**:
  - **BMI Calculation**: weight / (height²)
  - **Risk Scoring** (Weighted):
    - BMI: 25% weight
    - Sleep: 20% weight
    - Activity: 20% weight
    - Hydration: 20% weight
    - Diet: 15% weight
  - **Classification**:
    - Low Risk: < 25
    - Medium Risk: 25-44
    - High Risk: ≥ 45
- **Helper Methods**:
  - `evaluate_bmi_risk()` - BMI score
  - `evaluate_sleep_risk()` - Sleep quality
  - `evaluate_activity_risk()` - Exercise level
  - `evaluate_hydration_risk()` - Water intake
  - `evaluate_diet_risk()` - Nutrition quality
- **Features**:
  - Detailed factor breakdown
  - Recommendation generation
  - Sample usage in `__main__`

---

## Data Flow Examples

### Registration Flow

```
1. User fills register.html form
2. Form submits → JavaScript calls registerStudent()
3. Sends POST /api/register with user data
4. Backend validates form, hashes password
5. Database creates new student record
6. Returns success/error message
7. Redirect to login page
```

### Login Flow

```
1. User fills login.html form
2. Form submits → JavaScript calls loginStudent()
3. Sends POST /api/login with credentials
4. Backend verifies credentials
5. Generates JWT token
6. Returns token to frontend
7. localStorage stores token
8. Redirect to dashboard/admin based on user type
```

### Health Assessment Flow

```
1. Student fills health form on dashboard
2. Submits → JavaScript calls submitHealthData()
3. Sends POST /api/submit-health-data with health data + token
4. Backend validates input
5. Module calculates BMI, risk prediction
6. Database stores assessment
7. Returns risk level + recommendations
8. Frontend displays results + charts
```

### Admin Statistics Flow

```
1. Admin navigates to Statistics section
2. JavaScript calls loadStatistics()
3. Sends GET /api/admin/statistics with token
4. Backend queries database for counts
5. Calculates risk distribution
6. Returns statistics JSON
7. JavaScript calls drawRiskDistributionChart()
8. Canvas renders pie chart
```

---

## Database Schema

### Students Table
```sql
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Hashed
    full_name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Health Data Table
```sql
CREATE TABLE health_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    height FLOAT NOT NULL,
    weight FLOAT NOT NULL,
    bmi FLOAT NOT NULL,
    activity_level VARCHAR(50) NOT NULL,
    diet_type VARCHAR(50) NOT NULL,
    sleep_hours FLOAT NOT NULL,
    hydration_level INT NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
```

### Admin Table
```sql
CREATE TABLE admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Hashed
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoint Details

### Authentication Endpoints

#### POST /api/register
- **Description**: Register new student
- **Auth Required**: No
- **Body**: 
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "Pass123",
    "full_name": "John Doe",
    "age": 20,
    "gender": "Male"
  }
  ```
- **Response**: 201 Created
  ```json
  {
    "message": "Registration successful",
    "student_id": 1
  }
  ```

#### POST /api/login
- **Description**: Authenticate user (student or admin)
- **Auth Required**: No
- **Body**:
  ```json
  {
    "username": "john_doe",
    "password": "Pass123",
    "user_type": "student"
  }
  ```
- **Response**: 200 OK
  ```json
  {
    "message": "Login successful",
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user_id": 1,
    "username": "john_doe",
    "full_name": "John Doe"
  }
  ```

### Student Endpoints

#### POST /api/submit-health-data
- **Description**: Submit health assessment
- **Auth Required**: Yes (Bearer token)
- **Body**:
  ```json
  {
    "height": 170,
    "weight": 75,
    "activity_level": "Moderate",
    "diet_type": "Balanced",
    "sleep_hours": 7.5,
    "hydration_level": 5
  }
  ```
- **Response**: 201 Created with assessment

#### GET /api/get-health-data
- **Description**: Get latest assessment
- **Auth Required**: Yes
- **Response**: 200 OK with assessment object

#### GET /api/get-history
- **Description**: Get assessment history
- **Auth Required**: Yes
- **Response**: 200 OK with array of assessments

### Admin Endpoints

#### GET /api/admin/users
- **Description**: Get all students
- **Auth Required**: Yes (admin only)
- **Response**: 200 OK with students array

#### GET /api/admin/statistics
- **Description**: Get risk statistics
- **Auth Required**: Yes (admin only)
- **Response**: 200 OK with counts

#### GET /api/admin/analytics
- **Description**: Get detailed analytics
- **Auth Required**: Yes (admin only)
- **Response**: 200 OK with averages

#### DELETE /api/admin/delete-user/{id}
- **Description**: Delete student
- **Auth Required**: Yes (admin only)
- **Response**: 200 OK on success

---

## Security Implementation

### Password Security
```python
# Hashing
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12))

# Verification
bcrypt.checkpw(password.encode('utf-8'), hashed_password)
```

### JWT Token
```python
# Generation
token = jwt.encode({
    'user_id': 1,
    'username': 'john_doe',
    'exp': datetime.utcnow() + timedelta(days=7)
}, SECRET_KEY, algorithm='HS256')

# Verification
payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
```

### CORS Configuration
```python
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

---

## Error Handling

### Frontend (JavaScript)
```javascript
try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (response.ok) {
        // Handle success
    } else {
        // Handle error from server
    }
} catch (error) {
    // Handle network error
}
```

### Backend (Express.js)
```javascript
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});
```

---

## Performance Considerations

1. **Database Queries**: Optimized for frequently accessed data
2. **Frontend Caching**: localStorage for token/user info
3. **Async Operations**: JavaScript Promises for network requests
4. **Canvas Charts**: Direct rendering without libraries
5. **CSS**: Minimal, efficient styles without frameworks
6. **Response Size**: JSON payloads kept small

---

## Future Enhancements

1. Add data export (CSV/PDF)
2. Email notifications for risk alerts
3. Mobile app version
4. Advanced ML models
5. Real-time dashboards
6. User activity logging
7. Multi-language support
8. Dark mode theme

---

**Document Version**: 1.0  
**Last Updated**: February 2026
