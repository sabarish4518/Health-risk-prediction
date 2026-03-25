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
const { getFoodNutritionOptions, assessDietPattern } = require('./calorieAssessment');

// Initialize Express app
const app = express();
const BASE_PORT = Number(process.env.PORT || 5000);
const QUICK_LOGIN_ONLY = (process.env.QUICK_LOGIN_ONLY || 'true').toLowerCase() === 'true';
const QUICK_LOGIN_USERNAME = process.env.QUICK_LOGIN_USERNAME || 'student';
const QUICK_LOGIN_PASSWORD = process.env.QUICK_LOGIN_PASSWORD || 'student123';
const QUICK_ADMIN_USERNAME = process.env.QUICK_ADMIN_USERNAME || 'admin';
const QUICK_ADMIN_PASSWORD = process.env.QUICK_ADMIN_PASSWORD || 'admin123';
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DEFAULT_ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'System Admin';

// Middleware
const corsOptions = {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database instance
const db = new Database();

// Health risk predictor
const predictor = new HealthRiskPredictor();
const quickHealthStore = new Map();
const quickFeedbackStore = new Map();
const foodSearchCache = new Map();

// ==================== ERROR HANDLING UTILITY ====================

/**
 * Wrapper for async route handlers to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

function resolveEntryDayNumber(entry) {
    const candidate = Number(entry?.day_number);
    if (Number.isFinite(candidate) && candidate >= 1) {
        return Math.max(1, Math.floor(candidate));
    }
    const dayText = String(entry?.day || entry?.day_label || '').trim();
    const matched = dayText.match(/\d+/);
    if (matched) return Math.max(1, Number(matched[0]));
    return 1;
}

function buildExternalFoodOption(name, caloriesPer100g) {
    const normalized = String(name || '').toLowerCase();
    const isLiquid = ['drink', 'juice', 'milk', 'tea', 'coffee', 'shake', 'smoothie', 'water', 'soda'].some((token) => normalized.includes(token));

    if (isLiquid) {
        return {
            name,
            calories_per_100g: caloriesPer100g,
            default_unit: 'ml',
            grams_per_unit: 250,
            serving_options: [
                { unit: 'ml', label: 'Milliliters (ml)', grams_per_unit: 1 },
                { unit: 'liters', label: 'Liters (L)', grams_per_unit: 1000 },
                { unit: 'glass', label: '1 glass', grams_per_unit: 250 },
                { unit: 'bottle', label: '1 bottle', grams_per_unit: 500 }
            ]
        };
    }

    return {
        name,
        calories_per_100g: caloriesPer100g,
        default_unit: 'grams',
        grams_per_unit: 100,
        serving_options: [
            { unit: 'grams', label: 'Grams', grams_per_unit: 1 },
            { unit: 'small', label: 'Small serving', grams_per_unit: 100 },
            { unit: 'medium', label: 'Medium serving', grams_per_unit: 180 },
            { unit: 'large', label: 'Large serving', grams_per_unit: 260 }
        ]
    };
}

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
app.post('/api/register', asyncHandler(async (req, res) => {
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
}));

/**
 * POST /api/login
 * Login for students
 */
app.post('/api/login', asyncHandler(async (req, res) => {
    try {
        const { username, password } = req.body;
        const userType = String(req.body.user_type || 'student').toLowerCase() === 'admin' ? 'admin' : 'student';

        if (QUICK_LOGIN_ONLY) {
            if (!username || !password) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            if (userType === 'admin') {
                if (username !== QUICK_ADMIN_USERNAME || password !== QUICK_ADMIN_PASSWORD) {
                    return res.status(401).json({ message: 'Invalid admin credentials' });
                }

                const token = AuthHandler.generateToken(9999, QUICK_ADMIN_USERNAME, 'admin');
                return res.json({
                    message: 'Admin login successful',
                    token,
                    user_id: 9999,
                    username: QUICK_ADMIN_USERNAME,
                    full_name: 'Quick Admin',
                    user_type: 'admin'
                });
            }

            if (username !== QUICK_LOGIN_USERNAME || password !== QUICK_LOGIN_PASSWORD) {
                return res.status(401).json({ message: 'Invalid student credentials' });
            }

            const studentFeedback = quickFeedbackStore.get(1) || [];
            const unreadCount = studentFeedback.filter((item) => !item.is_read).length;
            const token = AuthHandler.generateToken(1, QUICK_LOGIN_USERNAME, 'student');
            return res.json({
                message: 'Login successful',
                token,
                user_id: 1,
                username: QUICK_LOGIN_USERNAME,
                full_name: 'Quick User',
                age: null,
                gender: '',
                user_type: 'student',
                unread_feedback_count: unreadCount
            });
        }
        
        // Validate required fields
        if (!username || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        if (userType === 'admin') {
            const admin = await db.getAdminByUsername(username);
            if (!admin) {
                return res.status(401).json({ message: 'Invalid admin credentials' });
            }

            const isAdminValid = await AuthHandler.verifyPassword(password, admin.password);
            if (!isAdminValid) {
                return res.status(401).json({ message: 'Invalid admin credentials' });
            }

            const token = AuthHandler.generateToken(admin.id, admin.username, 'admin');
            return res.json({
                message: 'Admin login successful',
                token,
                user_id: admin.id,
                username: admin.username,
                full_name: admin.full_name,
                user_type: 'admin'
            });
        }

        // Student login
        const student = await db.getStudentByUsername(username);
        if (!student) {
            return res.status(401).json({ message: 'Invalid student credentials' });
        }

        const isValid = await AuthHandler.verifyPassword(password, student.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid student credentials' });
        }
        
        // Generate token
        const token = AuthHandler.generateToken(student.id, student.username, 'student');
        const feedbackRows = await db.getStudentFeedback(student.id, true);
        return res.json({
            message: 'Login successful',
            token,
            user_id: student.id,
            username: student.username,
            full_name: student.full_name,
            age: student.age,
            gender: student.gender,
            user_type: 'student',
            unread_feedback_count: feedbackRows.length
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}));

// ==================== STUDENT ROUTES ====================

/**
 * GET /api/food-options
 * Get supported food items for daily intake tracker
 */
app.get('/api/food-options', tokenRequired, asyncHandler(async (req, res) => {
    return res.json({
        message: 'Food options retrieved',
        foods: getFoodNutritionOptions()
    });
}));

/**
 * GET /api/food-search?q=...
 * Search food options (global suggestions + local nutrition dataset)
 */
app.get('/api/food-search', tokenRequired, asyncHandler(async (req, res) => {
    const query = String(req.query.q || '').trim();
    if (query.length < 2) {
        return res.json({ message: 'Query too short', foods: [] });
    }

    const cacheKey = query.toLowerCase();
    const now = Date.now();
    const cached = foodSearchCache.get(cacheKey);
    if (cached && now - cached.timestamp < 10 * 60 * 1000) {
        return res.json({ message: 'Food search results', foods: cached.foods });
    }

    const localFoods = getFoodNutritionOptions().filter((food) =>
        String(food.name || '').toLowerCase().includes(cacheKey)
        || (Array.isArray(food.aliases) && food.aliases.some((alias) => String(alias || '').toLowerCase().includes(cacheKey)))
    );

    let externalFoods = [];
    try {
        if (typeof fetch === 'function') {
            const response = await fetch(
                `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&json=1&page_size=40&fields=product_name,nutriments`
            );
            if (response.ok) {
                const payload = await response.json();
                const products = Array.isArray(payload?.products) ? payload.products : [];
                externalFoods = products
                    .map((item) => {
                        const name = String(item?.product_name || '').trim();
                        if (!name) return null;
                        const kcal = Number(item?.nutriments?.['energy-kcal_100g']);
                        return buildExternalFoodOption(name, Number.isFinite(kcal) && kcal > 0 ? kcal : 120);
                    })
                    .filter(Boolean);
            }
        }
    } catch (error) {
        console.warn('Food search external API failed:', error.message);
    }

    const dedupedMap = new Map();
    for (const item of [...localFoods, ...externalFoods]) {
        const key = String(item.name || '').toLowerCase().trim();
        if (!key) continue;
        if (!dedupedMap.has(key)) dedupedMap.set(key, item);
    }

    const foods = Array.from(dedupedMap.values()).slice(0, 120);
    foodSearchCache.set(cacheKey, { timestamp: now, foods });

    return res.json({
        message: 'Food search results',
        foods
    });
}));

/**
 * POST /api/submit-health-data
 * Submit health assessment data
 */
app.post('/api/submit-health-data', tokenRequired, asyncHandler(async (req, res) => {
    try {
        if (req.userType !== 'student') {
            return res.status(403).json({ message: 'Student access required' });
        }
        const { height, weight, age, gender, activity_level, sleep_hours, hydration_level, hydration_liters, daily_food_intake } = req.body;
        
        // Validate required fields with explicit feedback
        const missing = [];
        if (!Number(height)) missing.push('height');
        if (!Number(weight)) missing.push('weight');
        if (!activity_level) missing.push('activity_level');
        if (!Number(sleep_hours)) missing.push('sleep_hours');
        if (hydration_level === undefined || hydration_level === null) missing.push('hydration_level');
        if (!Array.isArray(daily_food_intake) || daily_food_intake.length === 0) missing.push('daily_food_intake');
        if (missing.length > 0) {
            return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
        }

        const submittedDayNumbers = new Set(
            daily_food_intake
                .filter((entry) => String(entry?.food_item_name || '').trim() && Number(entry?.quantity || 0) > 0)
                .map((entry) => resolveEntryDayNumber(entry))
        );
        if (submittedDayNumbers.size < 2) {
            return res.status(400).json({ message: 'At least 2 days of food entries are mandatory for risk assessment.' });
        }

        let resolvedAge = Number(age);
        let resolvedGender = String(gender || '').trim();

        if ((!resolvedAge || !resolvedGender) && !QUICK_LOGIN_ONLY) {
            const studentProfile = await db.getStudentById(req.userId);
            if (!resolvedAge) resolvedAge = Number(studentProfile?.age || 0);
            if (!resolvedGender) resolvedGender = String(studentProfile?.gender || '').trim();
        }

        if (!resolvedAge || !resolvedGender) {
            return res.status(400).json({ message: 'Age and gender are required for calorie assessment' });
        }

        const dietAssessment = assessDietPattern({
            height: parseFloat(height),
            weight: parseFloat(weight),
            age: resolvedAge,
            gender: resolvedGender,
            activity_level,
            daily_food_intake
        });

        if ((dietAssessment.tracked_days || 0) < 2) {
            return res.status(400).json({ message: 'At least 2 valid days are required. Add food items from the list for Day 1 and Day 2.' });
        }

        if (!dietAssessment.intake_entries || dietAssessment.intake_entries.length === 0) {
            return res.status(400).json({ message: 'No valid food items found. Please select food items from the list and enter quantity.' });
        }
        
        // Prepare health data
        const healthData = {
            height: parseFloat(height),
            weight: parseFloat(weight),
            activity_level,
            diet_type: dietAssessment.detected_diet_pattern,
            sleep_hours: parseFloat(sleep_hours),
            hydration_level: parseInt(hydration_level),
            hydration_liters: hydration_liters !== undefined && hydration_liters !== null ? parseFloat(hydration_liters) : null,
            total_calories: dietAssessment.total_calories,
            avg_calories_per_day: dietAssessment.avg_calories_per_day,
            tracked_days: dietAssessment.tracked_days,
            total_calories_all_days: dietAssessment.total_calories_all_days,
            required_calories: dietAssessment.required_calories,
            calorie_difference: dietAssessment.calorie_difference,
            detected_diet_pattern: dietAssessment.detected_diet_pattern,
            food_entries_json: JSON.stringify(dietAssessment.intake_entries)
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
                id: Date.now(),
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
                    hydration_level: healthData.hydration_level,
                    hydration_liters: healthData.hydration_liters,
                    total_calories: healthData.total_calories,
                    avg_calories_per_day: dietAssessment.avg_calories_per_day,
                    tracked_days: dietAssessment.tracked_days,
                    total_calories_all_days: dietAssessment.total_calories_all_days,
                    required_calories: healthData.required_calories,
                    calorie_difference: healthData.calorie_difference,
                    detected_diet_pattern: healthData.detected_diet_pattern,
                    age: resolvedAge,
                    gender: resolvedGender,
                    detected_patterns: dietAssessment.detected_patterns,
                    skipped_meals: dietAssessment.skipped_meals,
                    sugar_grams: dietAssessment.sugar_grams,
                    fat_grams: dietAssessment.fat_grams,
                    protein_grams: dietAssessment.protein_grams,
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
                    hydration_level: healthData.hydration_level,
                    hydration_liters: healthData.hydration_liters,
                    total_calories: healthData.total_calories,
                    avg_calories_per_day: dietAssessment.avg_calories_per_day,
                    tracked_days: dietAssessment.tracked_days,
                    total_calories_all_days: dietAssessment.total_calories_all_days,
                    required_calories: healthData.required_calories,
                    calorie_difference: healthData.calorie_difference,
                    detected_diet_pattern: healthData.detected_diet_pattern,
                    age: resolvedAge,
                    gender: resolvedGender,
                    detected_patterns: dietAssessment.detected_patterns,
                    skipped_meals: dietAssessment.skipped_meals,
                    sugar_grams: dietAssessment.sugar_grams,
                    fat_grams: dietAssessment.fat_grams,
                    protein_grams: dietAssessment.protein_grams,
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
}));

/**
 * GET /api/get-health-data
 * Get latest health assessment for current student
 */
app.get('/api/get-health-data', tokenRequired, asyncHandler(async (req, res) => {
    try {
        if (req.userType !== 'student') {
            return res.status(403).json({ message: 'Student access required' });
        }
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
                    hydration_level: assessment.hydration_level
                });

                return res.json({
                    message: 'Health data retrieved',
                    assessment: {
                        height: assessment.height,
                        weight: assessment.weight,
                        bmi: assessment.bmi,
                        activity_level: assessment.activity_level,
                        diet_type: assessment.diet_type,
                        detected_diet_pattern: assessment.detected_diet_pattern || assessment.diet_type,
                        sleep_hours: assessment.sleep_hours,
                        hydration_level: assessment.hydration_level,
                        hydration_liters: assessment.hydration_liters || null,
                        total_calories: assessment.total_calories || 0,
                        required_calories: assessment.required_calories || 0,
                        calorie_difference: assessment.calorie_difference || 0,
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
                hydration_level: assessment.hydration_level
            });

            return res.json({
                message: 'Health data retrieved',
                assessment: {
                    height: assessment.height,
                    weight: assessment.weight,
                    bmi: assessment.bmi,
                    activity_level: assessment.activity_level,
                    diet_type: assessment.diet_type,
                    detected_diet_pattern: assessment.detected_diet_pattern || assessment.diet_type,
                    sleep_hours: assessment.sleep_hours,
                    hydration_level: assessment.hydration_level,
                    hydration_liters: assessment.hydration_liters || null,
                    total_calories: assessment.total_calories || 0,
                    required_calories: assessment.required_calories || 0,
                    calorie_difference: assessment.calorie_difference || 0,
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
}));

/**
 * GET /api/get-history
 * Get health assessment history for current student
 */
app.get('/api/get-history', tokenRequired, asyncHandler(async (req, res) => {
    try {
        if (req.userType !== 'student') {
            return res.status(403).json({ message: 'Student access required' });
        }
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
                    hydration_level: entry.hydration_level
                }).risk_score,
                sleep_hours: entry.sleep_hours,
                hydration_level: entry.hydration_level,
                hydration_liters: entry.hydration_liters || null,
                activity_level: entry.activity_level,
                diet_type: entry.diet_type,
                detected_diet_pattern: entry.detected_diet_pattern || entry.diet_type,
                total_calories: entry.total_calories || 0,
                required_calories: entry.required_calories || 0,
                calorie_difference: entry.calorie_difference || 0,
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
                hydration_level: entry.hydration_level
            }).risk_score,
            sleep_hours: entry.sleep_hours,
            hydration_level: entry.hydration_level,
            hydration_liters: entry.hydration_liters || null,
            activity_level: entry.activity_level,
            diet_type: entry.diet_type,
            detected_diet_pattern: entry.detected_diet_pattern || entry.diet_type,
            total_calories: entry.total_calories || 0,
            required_calories: entry.required_calories || 0,
            calorie_difference: entry.calorie_difference || 0,
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
}));

/**
 * GET /api/my-feedback
 * Student feedback notifications
 */
app.get('/api/my-feedback', tokenRequired, asyncHandler(async (req, res) => {
    if (req.userType !== 'student') {
        return res.status(403).json({ message: 'Student access required' });
    }

    if (QUICK_LOGIN_ONLY) {
        const feedback = quickFeedbackStore.get(req.userId) || [];
        const unreadCount = feedback.filter((item) => !item.is_read).length;
        return res.json({
            message: 'Feedback retrieved',
            unread_count: unreadCount,
            feedback
        });
    }

    const feedback = await db.getStudentFeedback(req.userId, false);
    const unreadCount = feedback.filter((item) => Number(item.is_read) === 0).length;
    return res.json({
        message: 'Feedback retrieved',
        unread_count: unreadCount,
        feedback
    });
}));

/**
 * POST /api/my-feedback/:feedbackId/read
 * Mark a feedback notification as read
 */
app.post('/api/my-feedback/:feedbackId/read', tokenRequired, asyncHandler(async (req, res) => {
    if (req.userType !== 'student') {
        return res.status(403).json({ message: 'Student access required' });
    }

    const feedbackId = Number(req.params.feedbackId || 0);
    if (!feedbackId) {
        return res.status(400).json({ message: 'Invalid feedback id' });
    }

    if (QUICK_LOGIN_ONLY) {
        const rows = quickFeedbackStore.get(req.userId) || [];
        const updated = rows.map((item) => (item.id === feedbackId ? { ...item, is_read: 1 } : item));
        quickFeedbackStore.set(req.userId, updated);
        return res.json({ message: 'Feedback marked as read' });
    }

    const result = await db.markFeedbackRead(req.userId, feedbackId);
    if (!result.success) {
        return res.status(400).json({ message: 'Failed to mark feedback as read', error: result.error });
    }
    return res.json({ message: 'Feedback marked as read' });
}));

/**
 * GET /api/admin/students
 * Admin view of students and latest assessment
 */
app.get('/api/admin/students', tokenRequired, adminRequired, asyncHandler(async (req, res) => {
    if (QUICK_LOGIN_ONLY) {
        const quickRows = [{
            id: 1,
            username: QUICK_LOGIN_USERNAME,
            email: '',
            full_name: 'Quick User',
            age: null,
            gender: '',
            latest_assessment_at: (quickHealthStore.get(1) || [])[0]?.created_at || null,
            latest_risk_level: (quickHealthStore.get(1) || [])[0]?.risk_level || null
        }];
        return res.json({ message: 'Students retrieved', students: quickRows });
    }

    const students = await db.getAllStudents();
    return res.json({ message: 'Students retrieved', students });
}));

/**
 * GET /api/admin/students/:studentId
 * Admin detail view for one student
 */
app.get('/api/admin/students/:studentId', tokenRequired, adminRequired, asyncHandler(async (req, res) => {
    const studentId = Number(req.params.studentId || 0);
    if (!studentId) {
        return res.status(400).json({ message: 'Invalid student id' });
    }

    if (QUICK_LOGIN_ONLY) {
        const student = {
            id: 1,
            username: QUICK_LOGIN_USERNAME,
            full_name: 'Quick User',
            age: null,
            gender: '',
            email: ''
        };
        const healthHistory = quickHealthStore.get(1) || [];
        const feedback = quickFeedbackStore.get(1) || [];
        return res.json({
            message: 'Student detail retrieved',
            student,
            health_history: healthHistory,
            feedback
        });
    }

    const student = await db.getStudentById(studentId);
    if (!student) {
        return res.status(404).json({ message: 'Student not found' });
    }
    const healthHistory = await db.getHealthHistory(studentId, 30);
    const feedback = await db.getStudentFeedback(studentId, false);
    return res.json({
        message: 'Student detail retrieved',
        student,
        health_history: healthHistory,
        feedback
    });
}));

/**
 * POST /api/admin/feedback
 * Admin submits feedback to a student
 */
app.post('/api/admin/feedback', tokenRequired, adminRequired, asyncHandler(async (req, res) => {
    const studentId = Number(req.body.student_id || 0);
    const healthDataId = Number(req.body.health_data_id || 0);
    const feedbackText = String(req.body.feedback_text || '').trim();

    if (!studentId || !healthDataId || !feedbackText) {
        return res.status(400).json({ message: 'student_id, health_data_id and feedback_text are required' });
    }

    if (feedbackText.length < 5) {
        return res.status(400).json({ message: 'Feedback is too short' });
    }

    if (QUICK_LOGIN_ONLY) {
        const quickHistory = quickHealthStore.get(studentId) || [];
        const linkedAssessment = quickHistory.find((item) => Number(item.id || 0) === healthDataId);
        if (!linkedAssessment) {
            return res.status(400).json({ message: 'Selected assessment not found for this student' });
        }

        const row = {
            id: Date.now(),
            student_id: studentId,
            admin_id: req.userId,
            health_data_id: healthDataId,
            feedback_text: feedbackText,
            is_read: 0,
            admin_name: req.username,
            created_at: new Date().toISOString()
        };
        const existing = quickFeedbackStore.get(studentId) || [];
        quickFeedbackStore.set(studentId, [row, ...existing]);
        return res.status(201).json({ message: 'Feedback sent successfully', feedback: row });
    }

    const student = await db.getStudentById(studentId);
    if (!student) {
        return res.status(404).json({ message: 'Student not found' });
    }

    const linkedAssessment = await db.getHealthDataById(healthDataId);
    if (!linkedAssessment || Number(linkedAssessment.student_id) !== studentId) {
        return res.status(400).json({ message: 'Selected assessment does not belong to this student' });
    }

    const result = await db.saveStudentFeedback({
        studentId,
        adminId: req.userId,
        healthDataId,
        feedbackText
    });

    if (!result.success) {
        return res.status(400).json({ message: 'Failed to save feedback', error: result.error });
    }

    return res.status(201).json({
        message: 'Feedback sent successfully',
        feedback_id: result.feedback_id
    });
}));

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

const listenOnPort = (serverApp, port) => new Promise((resolve, reject) => {
    const server = serverApp.listen(port, () => resolve(server));
    server.once('error', reject);
});

const listenWithFallback = async (serverApp, startPort, maxAttempts = 20) => {
    for (let offset = 0; offset < maxAttempts; offset += 1) {
        const port = startPort + offset;
        try {
            const server = await listenOnPort(serverApp, port);
            return { server, port };
        } catch (error) {
            if (error && error.code === 'EADDRINUSE') {
                continue;
            }
            throw error;
        }
    }
    throw new Error(`No available port found in range ${startPort}-${startPort + maxAttempts - 1}`);
};

const startServer = async () => {
    try {
        const { port: PORT } = await listenWithFallback(app, BASE_PORT);
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
            const adminHash = await AuthHandler.hashPassword(DEFAULT_ADMIN_PASSWORD);
            await db.createAdminIfMissing(DEFAULT_ADMIN_USERNAME, adminHash, DEFAULT_ADMIN_FULL_NAME);
            console.log(`Default admin ready: ${DEFAULT_ADMIN_USERNAME}`);
        } else {
            console.log('\nQuick login mode enabled (database skipped)');
            console.log('Student Username: ' + QUICK_LOGIN_USERNAME);
            console.log('Student Password: ' + QUICK_LOGIN_PASSWORD);
            console.log('Admin Username: ' + QUICK_ADMIN_USERNAME);
            console.log('Admin Password: ' + QUICK_ADMIN_PASSWORD);
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
        console.log('  - My Feedback: GET /api/my-feedback');
        console.log('  - Admin Students: GET /api/admin/students');
        console.log('='.repeat(60) + '\n');
        
        console.log('Listening on port ' + PORT);
        if (PORT !== BASE_PORT) {
            console.log('Note: Default port ' + BASE_PORT + ' was busy, using ' + PORT + ' instead.');
        }
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

module.exports = app;
