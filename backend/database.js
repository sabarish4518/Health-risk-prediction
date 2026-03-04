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
            console.log('Database connection successful');
            return true;
        } catch (error) {
            console.error('Database connection error:', error.message);
            return false;
        }
    }

    /**
     * Close database connection
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('Database connection closed');
        }
    }

    /**
     * Create necessary tables in database
     */
    async createTables() {
        try {
            const connection = await this.pool.getConnection();

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

            const createAdminsTable = `
                CREATE TABLE IF NOT EXISTS admins (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    full_name VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

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
                    hydration_level INT NOT NULL,
                    hydration_liters FLOAT DEFAULT NULL,
                    total_calories FLOAT DEFAULT 0,
                    required_calories FLOAT DEFAULT 0,
                    calorie_difference FLOAT DEFAULT 0,
                    detected_diet_pattern VARCHAR(100) DEFAULT 'Balanced',
                    food_entries_json TEXT NULL,
                    risk_level VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
                )
            `;

            const createFeedbackTable = `
                CREATE TABLE IF NOT EXISTS student_feedback (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    admin_id INT NULL,
                    health_data_id INT NULL,
                    feedback_text TEXT NOT NULL,
                    is_read TINYINT(1) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL,
                    FOREIGN KEY (health_data_id) REFERENCES health_data(id) ON DELETE SET NULL
                )
            `;

            await connection.execute(createStudentsTable);
            await connection.execute(createAdminsTable);
            await connection.execute(createHealthTable);
            await connection.execute(createFeedbackTable);

            const requiredHealthColumns = [
                { name: 'total_calories', ddl: 'ALTER TABLE health_data ADD COLUMN total_calories FLOAT DEFAULT 0' },
                { name: 'required_calories', ddl: 'ALTER TABLE health_data ADD COLUMN required_calories FLOAT DEFAULT 0' },
                { name: 'calorie_difference', ddl: 'ALTER TABLE health_data ADD COLUMN calorie_difference FLOAT DEFAULT 0' },
                { name: 'detected_diet_pattern', ddl: "ALTER TABLE health_data ADD COLUMN detected_diet_pattern VARCHAR(100) DEFAULT 'Balanced'" },
                { name: 'food_entries_json', ddl: 'ALTER TABLE health_data ADD COLUMN food_entries_json TEXT NULL' },
                { name: 'hydration_liters', ddl: 'ALTER TABLE health_data ADD COLUMN hydration_liters FLOAT DEFAULT NULL' }
            ];

            for (const column of requiredHealthColumns) {
                const [existing] = await connection.execute('SHOW COLUMNS FROM health_data LIKE ?', [column.name]);
                if (!existing || existing.length === 0) {
                    await connection.execute(column.ddl);
                }
            }

            const requiredFeedbackColumns = [
                { name: 'is_read', ddl: 'ALTER TABLE student_feedback ADD COLUMN is_read TINYINT(1) DEFAULT 0' }
            ];

            for (const column of requiredFeedbackColumns) {
                const [existing] = await connection.execute('SHOW COLUMNS FROM student_feedback LIKE ?', [column.name]);
                if (!existing || existing.length === 0) {
                    await connection.execute(column.ddl);
                }
            }

            console.log('Database tables created successfully');
            connection.release();
            return true;
        } catch (error) {
            console.error('Error creating tables:', error.message);
            return false;
        }
    }

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

    async getStudentByUsername(username) {
        try {
            const connection = await this.pool.getConnection();
            const [rows] = await connection.execute('SELECT * FROM students WHERE username = ?', [username]);
            connection.release();
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching student:', error.message);
            return null;
        }
    }

    async getStudentById(studentId) {
        try {
            const connection = await this.pool.getConnection();
            const [rows] = await connection.execute('SELECT * FROM students WHERE id = ?', [studentId]);
            connection.release();
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching student:', error.message);
            return null;
        }
    }

    async getAllStudents() {
        try {
            const connection = await this.pool.getConnection();
            const query = `
                SELECT s.id, s.username, s.email, s.full_name, s.age, s.gender, s.created_at,
                       h.id AS latest_health_id, h.risk_level AS latest_risk_level, h.created_at AS latest_assessment_at
                FROM students s
                LEFT JOIN health_data h ON h.id = (
                    SELECT h2.id FROM health_data h2
                    WHERE h2.student_id = s.id
                    ORDER BY h2.created_at DESC
                    LIMIT 1
                )
                ORDER BY s.created_at DESC
            `;
            const [rows] = await connection.execute(query);
            connection.release();
            return rows || [];
        } catch (error) {
            console.error('Error fetching students list:', error.message);
            return [];
        }
    }

    async getHealthHistory(studentId, limit = 10) {
        try {
            const connection = await this.pool.getConnection();
            const query = `
                SELECT * FROM health_data
                WHERE student_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            `;
            const [rows] = await connection.execute(query, [studentId, Number(limit)]);
            connection.release();
            return rows || [];
        } catch (error) {
            console.error('Error fetching health history:', error.message);
            return [];
        }
    }

    async getLatestHealthData(studentId) {
        try {
            const history = await this.getHealthHistory(studentId, 1);
            return history[0] || null;
        } catch (error) {
            console.error('Error fetching latest health data:', error.message);
            return null;
        }
    }

    async getHealthDataById(healthDataId) {
        try {
            const connection = await this.pool.getConnection();
            const [rows] = await connection.execute('SELECT * FROM health_data WHERE id = ?', [healthDataId]);
            connection.release();
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching health data by id:', error.message);
            return null;
        }
    }

    async saveHealthData(studentId, healthData) {
        try {
            const connection = await this.pool.getConnection();
            const query = `
                INSERT INTO health_data
                (student_id, height, weight, bmi, activity_level, diet_type, sleep_hours, hydration_level, hydration_liters, total_calories, required_calories, calorie_difference, detected_diet_pattern, food_entries_json, risk_level)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await connection.execute(query, [
                studentId,
                healthData.height,
                healthData.weight,
                healthData.bmi,
                healthData.activity_level,
                healthData.diet_type,
                healthData.sleep_hours,
                healthData.hydration_level,
                healthData.hydration_liters ?? null,
                healthData.total_calories || 0,
                healthData.required_calories || 0,
                healthData.calorie_difference || 0,
                healthData.detected_diet_pattern || healthData.diet_type || 'Balanced',
                healthData.food_entries_json || null,
                healthData.risk_level
            ]);

            connection.release();
            return { success: true, health_id: result.insertId };
        } catch (error) {
            console.error('Error saving health data:', error.message);
            return { success: false, error: error.message };
        }
    }

    async getAdminByUsername(username) {
        try {
            const connection = await this.pool.getConnection();
            const [rows] = await connection.execute('SELECT * FROM admins WHERE username = ?', [username]);
            connection.release();
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching admin:', error.message);
            return null;
        }
    }

    async createAdminIfMissing(username, passwordHash, fullName = 'System Admin') {
        try {
            const connection = await this.pool.getConnection();
            const [rows] = await connection.execute('SELECT id FROM admins WHERE username = ?', [username]);
            if (!rows || rows.length === 0) {
                await connection.execute(
                    'INSERT INTO admins (username, password, full_name) VALUES (?, ?, ?)',
                    [username, passwordHash, fullName]
                );
            }
            connection.release();
            return { success: true };
        } catch (error) {
            console.error('Error creating admin:', error.message);
            return { success: false, error: error.message };
        }
    }

    async saveStudentFeedback({ studentId, adminId, healthDataId, feedbackText }) {
        try {
            const connection = await this.pool.getConnection();
            const query = `
                INSERT INTO student_feedback (student_id, admin_id, health_data_id, feedback_text, is_read)
                VALUES (?, ?, ?, ?, 0)
            `;
            const [result] = await connection.execute(query, [
                studentId,
                adminId || null,
                healthDataId || null,
                feedbackText
            ]);
            connection.release();
            return { success: true, feedback_id: result.insertId };
        } catch (error) {
            console.error('Error saving student feedback:', error.message);
            return { success: false, error: error.message };
        }
    }

    async getStudentFeedback(studentId, unreadOnly = false) {
        try {
            const connection = await this.pool.getConnection();
            const query = `
                SELECT sf.id, sf.student_id, sf.admin_id, sf.health_data_id, sf.feedback_text, sf.is_read, sf.created_at,
                       a.full_name AS admin_name
                FROM student_feedback sf
                LEFT JOIN admins a ON a.id = sf.admin_id
                WHERE sf.student_id = ? ${unreadOnly ? 'AND sf.is_read = 0' : ''}
                ORDER BY sf.created_at DESC
            `;
            const [rows] = await connection.execute(query, [studentId]);
            connection.release();
            return rows || [];
        } catch (error) {
            console.error('Error fetching feedback:', error.message);
            return [];
        }
    }

    async markFeedbackRead(studentId, feedbackId) {
        try {
            const connection = await this.pool.getConnection();
            await connection.execute(
                'UPDATE student_feedback SET is_read = 1 WHERE id = ? AND student_id = ?',
                [feedbackId, studentId]
            );
            connection.release();
            return { success: true };
        } catch (error) {
            console.error('Error marking feedback read:', error.message);
            return { success: false, error: error.message };
        }
    }

    async deleteStudent(studentId) {
        try {
            const connection = await this.pool.getConnection();
            await connection.execute('DELETE FROM students WHERE id = ?', [studentId]);
            connection.release();
            return { success: true };
        } catch (error) {
            console.error('Error deleting student:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = Database;
