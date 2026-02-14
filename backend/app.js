// ==================== APP.JS ====================
// Main Express.js application for Student Health Risk Prediction System

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import custom modules
const Database = require('./database');
const AuthHandler = require('./auth');
const HealthRiskPredictor = require('./model');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const QUICK_LOGIN_ONLY = (process.env.QUICK_LOGIN_ONLY || 'true').toLowerCase() === 'true';
const QUICK_LOGIN_USERNAME = process.env.QUICK_LOGIN_USERNAME || 'student';
const QUICK_LOGIN_PASSWORD = process.env.QUICK_LOGIN_PASSWORD || 'student123';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database instance
const db = new Database();

// Health risk predictor
const predictor = new HealthRiskPredictor();
const quickHealthStore = new Map();

// ==================== AUTHENTICATION MIDDLEWARE ====================

/**
 * Middleware to verify JWT token
 */
const tokenRequired = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Token is missing' });
    }
    
    const payload = AuthHandler.verifyToken(token);
    if (!payload) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    req.userId = payload.user_id;
    req.username = payload.username;
    req.userType = payload.user_type;
    
    next();
};

/**
 * Middleware to verify admin authorization
 */
const adminRequired = (req, res, next) => {
    if (req.userType !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// ==================== AUTHENTICATION ROUTES ====================

/**
 * POST /api/register
 * Register a new student
 */
app.post('/api/register', async (req, res) => {
    if (QUICK_LOGIN_ONLY) {
        return res.status(403).json({
            message: 'Registration is disabled in quick login mode'
        });
    }

    try {
        const { username, email, password, full_name, age, gender } = req.body;
        
        // Validate required fields
        if (!username || !email || !password || !full_name || !age || !gender) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Validate email format
        if (!AuthHandler.validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        
        // Validate username format
        if (!AuthHandler.validateUsername(username)) {
            return res.status(400).json({ message: 'Username must be 4-20 alphanumeric characters' });
        }
        
        // Validate password strength
        const { valid, message } = AuthHandler.validatePassword(password);
        if (!valid) {
            return res.status(400).json({ message });
        }
        
        // Check if student already exists
        const existing = await db.getStudentByUsername(username);
        if (existing) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        
        // Hash password
        const passwordHash = await AuthHandler.hashPassword(password);
        
        // Register student
        const result = await db.registerStudent(username, email, passwordHash, full_name, age, gender);
        
        if (result.success) {
            return res.status(201).json({
                message: 'Registration successful',
                student_id: result.student_id
            });
        } else {
            return res.status(400).json({
                message: 'Registration failed',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * POST /api/login
 * Login for students and admins
 */
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, user_type } = req.body;

        if (QUICK_LOGIN_ONLY) {
            if (!username || !password) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            if (username !== QUICK_LOGIN_USERNAME || password !== QUICK_LOGIN_PASSWORD) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const token = AuthHandler.generateToken(1, QUICK_LOGIN_USERNAME, 'student');
            return res.json({
                message: 'Login successful',
                token,
                user_id: 1,
                username: QUICK_LOGIN_USERNAME,
                full_name: 'Quick User',
                user_type: 'student'
            });
        }
        
        // Validate required fields
        if (!username || !password || !user_type) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        if (user_type === 'admin') {
            // Admin login
            const admin = await db.verifyAdmin(username);
            if (!admin) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            
            // Verify password
            const isValid = await AuthHandler.verifyPassword(password, admin.password);
            if (!isValid) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            
            // Generate token
            const token = AuthHandler.generateToken(admin.id, admin.username, 'admin');
            return res.json({
                message: 'Login successful',
                token,
                user_id: admin.id,
                username: admin.username,
                full_name: admin.username,
                user_type: 'admin'
            });
        } else {
            // Student login
            const student = await db.getStudentByUsername(username);
            if (!student) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            
            // Verify password
            const isValid = await AuthHandler.verifyPassword(password, student.password);
            if (!isValid) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            
            // Generate token
            const token = AuthHandler.generateToken(student.id, student.username, 'student');
            return res.json({
                message: 'Login successful',
                token,
                user_id: student.id,
                username: student.username,
                full_name: student.full_name,
                user_type: 'student'
            });
        }
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ==================== STUDENT ROUTES ====================

/**
 * POST /api/submit-health-data
 * Submit health assessment data
 */
app.post('/api/submit-health-data', tokenRequired, async (req, res) => {
    try {
        const { height, weight, activity_level, diet_type, sleep_hours, stress_level } = req.body;
        
        // Validate required fields
        if (!height || !weight || !activity_level || !diet_type || !sleep_hours || stress_level === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Prepare health data
        const healthData = {
            height: parseFloat(height),
            weight: parseFloat(weight),
            activity_level,
            diet_type,
            sleep_hours: parseFloat(sleep_hours),
            stress_level: parseInt(stress_level)
        };
        
        // Get prediction
        const prediction = predictor.predictRiskLevel(healthData);
        
        // Add prediction to health data
        healthData.bmi = prediction.bmi;
        healthData.risk_level = prediction.risk_level;
        healthData.risk_score = prediction.risk_score;

        if (QUICK_LOGIN_ONLY) {
            const createdAt = new Date().toISOString();
            const quickEntry = {
                ...healthData,
                created_at: createdAt
            };

            if (!quickHealthStore.has(req.userId)) {
                quickHealthStore.set(req.userId, []);
            }
            quickHealthStore.get(req.userId).unshift(quickEntry);
            
            return res.status(201).json({
                message: 'Health data submitted successfully',
                assessment: {
                    height: healthData.height,
                    weight: healthData.weight,
                    bmi: healthData.bmi,
                    activity_level: healthData.activity_level,
                    diet_type: healthData.diet_type,
                    sleep_hours: healthData.sleep_hours,
                    stress_level: healthData.stress_level,
                    risk_level: prediction.risk_level,
                    risk_score: prediction.risk_score,
                    date: createdAt
                }
            });
        }
        
        // Save to database
        const result = await db.saveHealthData(req.userId, healthData);
        
        if (result.success) {
            return res.status(201).json({
                message: 'Health data submitted successfully',
                assessment: {
                    height: healthData.height,
                    weight: healthData.weight,
                    bmi: healthData.bmi,
                    activity_level: healthData.activity_level,
                    diet_type: healthData.diet_type,
                    sleep_hours: healthData.sleep_hours,
                    stress_level: healthData.stress_level,
                    risk_level: prediction.risk_level,
                    risk_score: prediction.risk_score,
                    date: new Date().toISOString()
                }
            });
        } else {
            return res.status(400).json({
                message: 'Failed to save health data',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error in submit_health_data:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * GET /api/get-health-data
 * Get latest health assessment for current student
 */
app.get('/api/get-health-data', tokenRequired, async (req, res) => {
    try {
        if (QUICK_LOGIN_ONLY) {
            const history = quickHealthStore.get(req.userId) || [];
            const assessment = history[0] || null;
            
            if (assessment) {
                const derivedPrediction = predictor.predictRiskLevel({
                    height: assessment.height,
                    weight: assessment.weight,
                    activity_level: assessment.activity_level,
                    diet_type: assessment.diet_type,
                    sleep_hours: assessment.sleep_hours,
                    stress_level: assessment.stress_level
                });

                return res.json({
                    message: 'Health data retrieved',
                    assessment: {
                        height: assessment.height,
                        weight: assessment.weight,
                        bmi: assessment.bmi,
                        activity_level: assessment.activity_level,
                        diet_type: assessment.diet_type,
                        sleep_hours: assessment.sleep_hours,
                        stress_level: assessment.stress_level,
                        risk_level: assessment.risk_level,
                        risk_score: derivedPrediction.risk_score,
                        date: assessment.created_at
                    }
                });
            }
            
            return res.json({
                message: 'No assessment found',
                assessment: null
            });
        }

        const assessment = await db.getLatestHealthData(req.userId);
        
        if (assessment) {
            const derivedPrediction = predictor.predictRiskLevel({
                height: assessment.height,
                weight: assessment.weight,
                activity_level: assessment.activity_level,
                diet_type: assessment.diet_type,
                sleep_hours: assessment.sleep_hours,
                stress_level: assessment.stress_level
            });

            return res.json({
                message: 'Health data retrieved',
                assessment: {
                    height: assessment.height,
                    weight: assessment.weight,
                    bmi: assessment.bmi,
                    activity_level: assessment.activity_level,
                    diet_type: assessment.diet_type,
                    sleep_hours: assessment.sleep_hours,
                    stress_level: assessment.stress_level,
                    risk_level: assessment.risk_level,
                    risk_score: derivedPrediction.risk_score,
                    date: assessment.created_at
                }
            });
        } else {
            return res.json({
                message: 'No assessment found',
                assessment: null
            });
        }
    } catch (error) {
        console.error('Error in get_health_data:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * GET /api/get-history
 * Get health assessment history for current student
 */
app.get('/api/get-history', tokenRequired, async (req, res) => {
    try {
        if (QUICK_LOGIN_ONLY) {
            const historyData = quickHealthStore.get(req.userId) || [];
            const history = historyData.slice(0, 10).map(entry => ({
                bmi: entry.bmi,
                weight: entry.weight,
                height: entry.height,
                risk_level: entry.risk_level,
                risk_score: predictor.predictRiskLevel({
                    height: entry.height,
                    weight: entry.weight,
                    activity_level: entry.activity_level,
                    diet_type: entry.diet_type,
                    sleep_hours: entry.sleep_hours,
                    stress_level: entry.stress_level
                }).risk_score,
                sleep_hours: entry.sleep_hours,
                stress_level: entry.stress_level,
                activity_level: entry.activity_level,
                diet_type: entry.diet_type,
                date: entry.created_at
            }));
            
            return res.json({
                message: 'History retrieved',
                history
            });
        }

        const historyData = await db.getHealthHistory(req.userId);
        
        const history = historyData.map(entry => ({
            bmi: entry.bmi,
            weight: entry.weight,
            height: entry.height,
            risk_level: entry.risk_level,
            risk_score: predictor.predictRiskLevel({
                height: entry.height,
                weight: entry.weight,
                activity_level: entry.activity_level,
                diet_type: entry.diet_type,
                sleep_hours: entry.sleep_hours,
                stress_level: entry.stress_level
            }).risk_score,
            sleep_hours: entry.sleep_hours,
            stress_level: entry.stress_level,
            activity_level: entry.activity_level,
            diet_type: entry.diet_type,
            date: entry.created_at
        }));
        
        return res.json({
            message: 'History retrieved',
            history
        });
    } catch (error) {
        console.error('Error in get_history:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/admin/users
 * Get all students (admin only)
 */
app.get('/api/admin/users', tokenRequired, adminRequired, async (req, res) => {
    try {
        const studentsData = await db.getAllStudents();
        
        const students = studentsData.map(student => ({
            id: student.id,
            username: student.username,
            email: student.email,
            full_name: student.full_name,
            age: student.age,
            gender: student.gender,
            risk_level: student.risk_level,
            last_assessment_date: student.last_assessment_date
        }));
        
        return res.json({
            message: 'Students retrieved',
            students
        });
    } catch (error) {
        console.error('Error in get_all_students:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * GET /api/admin/student/:id
 * Get detailed info for specific student
 */
app.get('/api/admin/student/:id', tokenRequired, adminRequired, async (req, res) => {
    try {
        const student = await db.getStudentById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        const latestAssessment = await db.getLatestHealthData(req.params.id);
        
        return res.json({
            message: 'Student details retrieved',
            student: {
                id: student.id,
                username: student.username,
                email: student.email,
                full_name: student.full_name,
                age: student.age,
                gender: student.gender,
                created_at: student.created_at,
                risk_level: latestAssessment?.risk_level || null,
                last_assessment_date: latestAssessment?.created_at || null
            }
        });
    } catch (error) {
        console.error('Error in get_student_details:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * GET /api/admin/statistics
 * Get health risk statistics
 */
app.get('/api/admin/statistics', tokenRequired, adminRequired, async (req, res) => {
    try {
        const stats = await db.getStatistics();
        
        return res.json({
            message: 'Statistics retrieved',
            statistics: stats
        });
    } catch (error) {
        console.error('Error in get_statistics:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * GET /api/admin/analytics
 * Get detailed analytics
 */
app.get('/api/admin/analytics', tokenRequired, adminRequired, async (req, res) => {
    try {
        const analytics = await db.getAnalytics();
        
        return res.json({
            message: 'Analytics retrieved',
            analytics
        });
    } catch (error) {
        console.error('Error in get_analytics:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * DELETE /api/admin/delete-user/:id
 * Delete a student
 */
app.delete('/api/admin/delete-user/:id', tokenRequired, adminRequired, async (req, res) => {
    try {
        const result = await db.deleteStudent(req.params.id);
        
        if (result.success) {
            return res.json({ message: 'Student deleted successfully' });
        } else {
            return res.status(400).json({
                message: 'Failed to delete student',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error in delete_user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ==================== HEALTH CHECK ====================

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        message: 'Student Health Risk Prediction System API is running',
        status: 'healthy'
    });
});

// ==================== ERROR HANDLERS ====================

app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// ==================== SERVER STARTUP ====================

const startServer = async () => {
    try {
        console.log('\n' + '='.repeat(60));
        console.log('Student Health Risk Prediction System');
        console.log('='.repeat(60));
        
        if (!QUICK_LOGIN_ONLY) {
            // Initialize database
            console.log('\nInitializing database...');
            const connected = await db.connect();
            
            if (!connected) {
                console.error('ERROR: Could not initialize database');
                console.error('Make sure MySQL is running and configured correctly.');
                process.exit(1);
            }
            
            await db.createTables();
            await db.createDefaultAdmin();
        } else {
            console.log('\nQuick login mode enabled (database skipped)');
            console.log('Username: ' + QUICK_LOGIN_USERNAME);
            console.log('Password: ' + QUICK_LOGIN_PASSWORD);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✓ System ready!');
        console.log('='.repeat(60));
        console.log('\nServer running at: http://localhost:' + PORT);
        console.log('Frontend URL: file:///path/to/frontend/index.html');
        console.log('\nAPI Documentation:');
        console.log('  - Health Check: GET /api/health');
        console.log('  - Register: POST /api/register');
        console.log('  - Login: POST /api/login');
        console.log('  - Submit Health Data: POST /api/submit-health-data');
        console.log('  - Get Health Data: GET /api/get-health-data');
        console.log('  - Get History: GET /api/get-history');
        console.log('  - Admin Users: GET /api/admin/users');
        console.log('  - Admin Statistics: GET /api/admin/statistics');
        console.log('  - Admin Analytics: GET /api/admin/analytics');
        console.log('='.repeat(60) + '\n');
        
        // Start server
        app.listen(PORT, () => {
            console.log('Listening on port ' + PORT);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

module.exports = app;
