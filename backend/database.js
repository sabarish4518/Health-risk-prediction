// ==================== DATABASE.JS ====================
// Database connection and operations module

const mysql = require('mysql2/promise');

// Database configuration
const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_health_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

class Database {
    constructor() {
        this.pool = null;
    }
    
    /**
     * Establish database connection
     */
    async connect() {
        try {
            this.pool = mysql.createPool(DB_CONFIG);
            console.log('✓ Database connection successful');
            return true;
        } catch (error) {
            console.error('✗ Database connection error:', error.message);
            return false;
        }
    }
    
    /**
     * Close database connection
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('✓ Database connection closed');
        }
    }
    
    /**
     * Create necessary tables in database
     */
    async createTables() {
        try {
            const connection = await this.pool.getConnection();
            
            // Create students table
            const createStudentsTable = `
                CREATE TABLE IF NOT EXISTS students (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    full_name VARCHAR(100) NOT NULL,
                    age INT NOT NULL,
                    gender VARCHAR(20),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            
            // Create health data table
            const createHealthTable = `
                CREATE TABLE IF NOT EXISTS health_data (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    height FLOAT NOT NULL,
                    weight FLOAT NOT NULL,
                    bmi FLOAT NOT NULL,
                    activity_level VARCHAR(50) NOT NULL,
                    diet_type VARCHAR(50) NOT NULL,
                    sleep_hours FLOAT NOT NULL,
                    stress_level INT NOT NULL,
                    risk_level VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
                )
            `;
            
            // Create admin table
            const createAdminTable = `
                CREATE TABLE IF NOT EXISTS admin (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    email VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            
            await connection.execute(createStudentsTable);
            await connection.execute(createHealthTable);
            await connection.execute(createAdminTable);
            
            console.log('✓ Database tables created successfully');
            connection.release();
            return true;
        } catch (error) {
            console.error('✗ Error creating tables:', error.message);
            return false;
        }
    }
    
    /**
     * Register a new student
     */
    async registerStudent(username, email, passwordHash, fullName, age, gender) {
        try {
            const connection = await this.pool.getConnection();
            const query = 'INSERT INTO students (username, email, password, full_name, age, gender) VALUES (?, ?, ?, ?, ?, ?)';
            
            const [result] = await connection.execute(query, [username, email, passwordHash, fullName, age, gender]);
            connection.release();
            
            return { success: true, student_id: result.insertId };
        } catch (error) {
            console.error('Registration error:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Get student by username
     */
    async getStudentByUsername(username) {
        try {
            const connection = await this.pool.getConnection();
            const query = 'SELECT * FROM students WHERE username = ?';
            
            const [rows] = await connection.execute(query, [username]);
            connection.release();
            
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching student:', error.message);
            return null;
        }
    }
    
    /**
     * Get student by ID
     */
    async getStudentById(studentId) {
        try {
            const connection = await this.pool.getConnection();
            const query = 'SELECT * FROM students WHERE id = ?';
            
            const [rows] = await connection.execute(query, [studentId]);
            connection.release();
            
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching student:', error.message);
            return null;
        }
    }
    
    /**
     * Save health assessment data
     */
    async saveHealthData(studentId, healthData) {
        try {
            const connection = await this.pool.getConnection();
            const query = `
                INSERT INTO health_data 
                (student_id, height, weight, bmi, activity_level, diet_type, sleep_hours, stress_level, risk_level)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const [result] = await connection.execute(query, [
                studentId,
                healthData.height,
                healthData.weight,
                healthData.bmi,
                healthData.activity_level,
                healthData.diet_type,
                healthData.sleep_hours,
                healthData.stress_level,
                healthData.risk_level
            ]);
            
            connection.release();
            return { success: true, health_id: result.insertId };
        } catch (error) {
            console.error('Error saving health data:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Get most recent health assessment for a student
     */
    async getLatestHealthData(studentId) {
        try {
            const connection = await this.pool.getConnection();
            const query = `
                SELECT * FROM health_data 
                WHERE student_id = ? 
                ORDER BY created_at DESC 
                LIMIT 1
            `;
            
            const [rows] = await connection.execute(query, [studentId]);
            connection.release();
            
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching health data:', error.message);
            return null;
        }
    }
    
    /**
     * Get health assessment history for a student
     */
    async getHealthHistory(studentId) {
        try {
            const connection = await this.pool.getConnection();
            const query = `
                SELECT * FROM health_data 
                WHERE student_id = ? 
                ORDER BY created_at DESC 
                LIMIT 10
            `;
            
            const [rows] = await connection.execute(query, [studentId]);
            connection.release();
            
            return rows || [];
        } catch (error) {
            console.error('Error fetching health history:', error.message);
            return [];
        }
    }
    
    /**
     * Get all students (for admin)
     */
    async getAllStudents() {
        try {
            const connection = await this.pool.getConnection();
            const query = `
                SELECT s.id, s.username, s.email, s.full_name, s.age, s.gender,
                       (SELECT risk_level FROM health_data WHERE student_id = s.id ORDER BY created_at DESC LIMIT 1) as risk_level,
                       (SELECT created_at FROM health_data WHERE student_id = s.id ORDER BY created_at DESC LIMIT 1) as last_assessment_date
                FROM students s
            `;
            
            const [rows] = await connection.execute(query);
            connection.release();
            
            return rows || [];
        } catch (error) {
            console.error('Error fetching students:', error.message);
            return [];
        }
    }
    
    /**
     * Get overall health statistics
     */
    async getStatistics() {
        try {
            const connection = await this.pool.getConnection();
            
            const totalQuery = 'SELECT COUNT(*) as count FROM students';
            const [totalResult] = await connection.execute(totalQuery);
            const total = totalResult[0].count;
            
            const riskQuery = `
                SELECT 
                    SUM(CASE WHEN risk_level = 'Low Risk' THEN 1 ELSE 0 END) as low,
                    SUM(CASE WHEN risk_level = 'Medium Risk' THEN 1 ELSE 0 END) as medium,
                    SUM(CASE WHEN risk_level = 'High Risk' THEN 1 ELSE 0 END) as high
                FROM health_data
                WHERE created_at IN (
                    SELECT MAX(created_at) FROM health_data GROUP BY student_id
                )
            `;
            
            const [riskResult] = await connection.execute(riskQuery);
            const riskData = riskResult[0];
            
            connection.release();
            
            return {
                total_students: total,
                low_risk_count: riskData.low || 0,
                medium_risk_count: riskData.medium || 0,
                high_risk_count: riskData.high || 0
            };
        } catch (error) {
            console.error('Error fetching statistics:', error.message);
            return {
                total_students: 0,
                low_risk_count: 0,
                medium_risk_count: 0,
                high_risk_count: 0
            };
        }
    }
    
    /**
     * Get detailed analytics
     */
    async getAnalytics() {
        try {
            const connection = await this.pool.getConnection();
            
            const bmiQuery = 'SELECT AVG(bmi) as avg FROM health_data';
            const [bmiResult] = await connection.execute(bmiQuery);
            const avgBmi = bmiResult[0].avg || 0;
            
            const sleepQuery = 'SELECT AVG(sleep_hours) as avg FROM health_data';
            const [sleepResult] = await connection.execute(sleepQuery);
            const avgSleep = sleepResult[0].avg || 0;
            
            const stressQuery = 'SELECT AVG(stress_level) as avg FROM health_data';
            const [stressResult] = await connection.execute(stressQuery);
            const avgStress = stressResult[0].avg || 0;
            
            const activityQuery = `
                SELECT activity_level, COUNT(*) as count
                FROM health_data
                WHERE created_at IN (
                    SELECT MAX(created_at) FROM health_data GROUP BY student_id
                )
                GROUP BY activity_level
            `;
            const [activityResult] = await connection.execute(activityQuery);
            
            let mostCommon = 'Moderate';
            const activityDict = {};
            
            for (const row of activityResult) {
                if (row.activity_level) {
                    activityDict[row.activity_level.toLowerCase()] = row.count;
                    if (row.count > 0) {
                        mostCommon = row.activity_level;
                    }
                }
            }
            
            connection.release();
            
            return {
                avg_bmi: parseFloat(avgBmi.toFixed(2)),
                avg_sleep_hours: parseFloat(avgSleep.toFixed(1)),
                avg_stress_level: parseFloat(avgStress.toFixed(1)),
                most_common_activity: mostCommon,
                activity_distribution: {
                    sedentary: activityDict.sedentary || 0,
                    light: activityDict.light || 0,
                    moderate: activityDict.moderate || 0,
                    high: activityDict.high || 0
                }
            };
        } catch (error) {
            console.error('Error fetching analytics:', error.message);
            return {
                avg_bmi: 0,
                avg_sleep_hours: 0,
                avg_stress_level: 0,
                most_common_activity: 'Moderate',
                activity_distribution: {
                    sedentary: 0,
                    light: 0,
                    moderate: 0,
                    high: 0
                }
            };
        }
    }
    
    /**
     * Delete a student
     */
    async deleteStudent(studentId) {
        try {
            const connection = await this.pool.getConnection();
            const query = 'DELETE FROM students WHERE id = ?';
            
            await connection.execute(query, [studentId]);
            connection.release();
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting student:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Verify if admin exists
     */
    async verifyAdmin(username) {
        try {
            const connection = await this.pool.getConnection();
            const query = 'SELECT * FROM admin WHERE username = ?';
            
            const [rows] = await connection.execute(query, [username]);
            connection.release();
            
            return rows[0] || null;
        } catch (error) {
            console.error('Error verifying admin:', error.message);
            return null;
        }
    }
    
    /**
     * Create default admin account
     */
    async createDefaultAdmin() {
        try {
            const AuthHandler = require('./auth');
            const existingAdmin = await this.verifyAdmin('admin');
            
            if (!existingAdmin) {
                const password = await AuthHandler.hashPassword('admin123');
                const connection = await this.pool.getConnection();
                const query = 'INSERT INTO admin (username, password, email) VALUES (?, ?, ?)';
                
                await connection.execute(query, ['admin', password, 'admin@healthsystem.com']);
                connection.release();
                
                console.log('✓ Default admin created (username: admin, password: admin123)');
            }
        } catch (error) {
            console.error('Admin already exists or error:', error.message);
        }
    }
}

module.exports = Database;
