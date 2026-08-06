const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRES_IN } = require('../config/jwt');

// Login Handler for all 3 roles (Officer, Teacher, Student)
const login = async (req, res) => {
    try {
        const { userId, password } = req.body;
        if (!userId || !password) {
            return res.status(400).json({ success: false, message: 'User ID and Password are required' });
        }

        const cleanUserId = userId.trim().toUpperCase();

        // 1. Fetch user from credentials table
        const [users] = await query('SELECT * FROM users WHERE user_id = ?', [cleanUserId]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid User ID or Password' });
        }

        const user = users[0];

        // 2. Compare bcrypt password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid User ID or Password' });
        }

        // 3. Fetch detailed profile based on role
        let profile = { userId: user.user_id, role: user.role, firstLogin: Boolean(user.first_login) };

        if (user.role === 'Officer') {
            const [officers] = await query('SELECT * FROM officers WHERE user_id = ?', [user.user_id]);
            if (officers.length > 0) profile = { ...profile, ...officers[0] };
        } else if (user.role === 'Teacher') {
            const [teachers] = await query('SELECT * FROM teachers WHERE user_id = ?', [user.user_id]);
            if (teachers.length > 0) profile = { ...profile, ...teachers[0] };
        } else if (user.role === 'Student') {
            const [students] = await query('SELECT * FROM students WHERE user_id = ?', [user.user_id]);
            if (students.length > 0) profile = { ...profile, ...students[0] };
        }

        // 4. Generate JWT tokens
        const accessToken = jwt.sign(
            { userId: user.user_id, role: user.role, firstLogin: Boolean(user.first_login) },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const refreshToken = jwt.sign(
            { userId: user.user_id },
            REFRESH_TOKEN_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
        );

        return res.json({
            success: true,
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: profile
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Change Password Handler (Triggered during first_login or voluntary password update)
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
        }

        // Fetch existing user record
        const [users] = await query('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (users.length === 0) {
            return res.status(444).json({ success: false, message: 'User not found' });
        }
        const user = users[0];

        // If not first_login, verify current password
        if (!user.first_login) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Current password is required' });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Current password does not match' });
            }
        }

        // Hash new password and update user table, setting first_login = 0
        const newHash = await bcrypt.hash(newPassword, 10);
        await query('UPDATE users SET password_hash = ?, first_login = 0 WHERE user_id = ?', [newHash, userId]);

        // Issue new updated JWT token with firstLogin: false
        const updatedToken = jwt.sign(
            { userId: user.user_id, role: user.role, firstLogin: false },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return res.json({
            success: true,
            message: 'Password updated successfully. You can now access your dashboard.',
            accessToken: updatedToken
        });
    } catch (err) {
        console.error('Change password error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Fetch profile of logged-in user
const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;

        const [users] = await query('SELECT user_id, role, first_login, created_at FROM users WHERE user_id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User profile not found' });
        }

        let profile = { ...users[0], firstLogin: Boolean(users[0].first_login) };

        if (role === 'Officer') {
            const [officers] = await query('SELECT * FROM officers WHERE user_id = ?', [userId]);
            if (officers.length > 0) profile = { ...profile, ...officers[0] };
        } else if (role === 'Teacher') {
            const [teachers] = await query('SELECT * FROM teachers WHERE user_id = ?', [userId]);
            if (teachers.length > 0) profile = { ...profile, ...teachers[0] };
        } else if (role === 'Student') {
            const [students] = await query('SELECT * FROM students WHERE user_id = ?', [userId]);
            if (students.length > 0) profile = { ...profile, ...students[0] };
        }

        return res.json({ success: true, user: profile });
    } catch (err) {
        console.error('Get profile error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    login,
    changePassword,
    getProfile
};
