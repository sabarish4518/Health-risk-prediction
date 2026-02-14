// ==================== AUTH.JS ====================
// Authentication module for user login and registration

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-change-in-production';

class AuthHandler {
    /**
     * Hash password using bcrypt
     */
    static async hashPassword(password) {
        try {
            const salt = await bcrypt.genSalt(12);
            return await bcrypt.hash(password, salt);
        } catch (error) {
            console.error('Error hashing password:', error);
            throw error;
        }
    }
    
    /**
     * Verify password against hash
     */
    static async verifyPassword(password, hashedPassword) {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (error) {
            console.error('Error verifying password:', error);
            return false;
        }
    }
    
    /**
     * Generate JWT token for authenticated user
     */
    static generateToken(userId, username, userType = 'student') {
        try {
            const payload = {
                user_id: userId,
                username,
                user_type: userType,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
            };
            
            return jwt.sign(payload, SECRET_KEY, { algorithm: 'HS256' });
        } catch (error) {
            console.error('Error generating token:', error);
            throw error;
        }
    }
    
    /**
     * Verify JWT token
     */
    static verifyToken(token) {
        try {
            return jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] });
        } catch (error) {
            console.error('Token verification failed:', error.message);
            return null;
        }
    }
    
    /**
     * Validate email format
     */
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Validate username format
     * Username should be 4-20 characters, alphanumeric and underscore only
     */
    static validateUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
        return usernameRegex.test(username);
    }
    
    /**
     * Validate password strength
     * Password must be minimum 4 characters (relaxed for testing)
     */
    static validatePassword(password) {
        if (password.length < 4) {
            return { valid: false, message: 'Password must be at least 4 characters long' };
        }
        
        return { valid: true, message: 'Password is valid' };
    }
}

module.exports = AuthHandler;
