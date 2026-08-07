const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRES_IN } = require('../config/jwt');
const { sendOTPEmail } = require('../utils/emailSender');

// Login Handler for all 3 roles (Officer, Teacher, Student)
const login = async (req, res) => {
    try {
        const { userId, password } = req.body;
        if (!userId || !password) {
            return res.status(400).json({ success: false, message: 'User ID and Password are required' });
        }

        const cleanInput = userId.trim();

        // 1. Fetch user from credentials table (by exact or case-insensitive user_id)
        let [users] = await query('SELECT * FROM users WHERE LOWER(user_id) = LOWER(?)', [cleanInput]);

        // If not found by user_id, check if input matches a Student's Admission ID or Email!
        if (users.length === 0) {
            const [students] = await query(
                'SELECT user_id FROM students WHERE LOWER(admission_number) = LOWER(?) OR LOWER(email) = LOWER(?)',
                [cleanInput, cleanInput]
            );
            if (students.length > 0) {
                const studentUserId = students[0].user_id;
                [users] = await query('SELECT * FROM users WHERE LOWER(user_id) = LOWER(?)', [studentUserId]);
            }
        }

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid Login Credentials (ID, Admission No, or Password)' });
        }

        const user = users[0];

        // 2. Compare bcrypt password (supports case-insensitive match for default passwords)
        const cleanPassword = password.trim();
        let isMatch = await bcrypt.compare(cleanPassword, user.password_hash);
        if (!isMatch && cleanPassword.toUpperCase() !== cleanPassword) {
            isMatch = await bcrypt.compare(cleanPassword.toUpperCase(), user.password_hash);
        }
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid Login Credentials (User ID / Admission ID or Password)' });
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

// Mask Email helper e.g. sourav@gmail.com -> s***v@gmail.com
const maskEmail = (email) => {
    if (!email || !email.includes('@')) return email;
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
};

// Request Password Reset OTP
const requestPasswordResetOTP = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId || !userId.trim()) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        const cleanUserId = userId.trim();

        // Find user case-insensitively
        const [users] = await query('SELECT user_id, role FROM users WHERE LOWER(user_id) = LOWER(?)', [cleanUserId]);
        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, message: 'User ID not found in system' });
        }

        const user = users[0];
        const dbUserId = user.user_id; // Exact user_id from DB
        let name = '';
        let email = '';

        if (user.role === 'Officer') {
            const [officers] = await query('SELECT name, email FROM officers WHERE LOWER(user_id) = LOWER(?)', [dbUserId]);
            if (officers && officers.length > 0) {
                name = officers[0].name;
                email = officers[0].email;
            }
        } else if (user.role === 'Teacher') {
            const [teachers] = await query('SELECT name, email FROM teachers WHERE LOWER(user_id) = LOWER(?)', [dbUserId]);
            if (teachers && teachers.length > 0) {
                name = teachers[0].name;
                email = teachers[0].email;
            }
        } else if (user.role === 'Student') {
            const [students] = await query('SELECT name, email FROM students WHERE LOWER(user_id) = LOWER(?)', [dbUserId]);
            if (students && students.length > 0) {
                name = students[0].name;
                email = students[0].email;
            }
        }

        if (!email || !email.trim() || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'No Gmail address is currently linked to this account. Please ask your school administrator to assign your Gmail.'
            });
        }

        const targetEmail = email.trim();
        // Generate 6 digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 10 minutes expiry timestamp
        const expiryDate = new Date(Date.now() + 10 * 60 * 1000);
        const expiresAtFormatted = expiryDate.toISOString().slice(0, 19).replace('T', ' ');

        // Delete existing OTPs for user
        await query('DELETE FROM password_otps WHERE LOWER(user_id) = LOWER(?)', [dbUserId]);

        // Insert new OTP
        await query('INSERT INTO password_otps (user_id, email, otp, expires_at) VALUES (?, ?, ?, ?)', [
            dbUserId, targetEmail, otp, expiresAtFormatted
        ]);

        // Send Email via Nodemailer
        const emailResult = await sendOTPEmail({
            toEmail: targetEmail,
            userName: name,
            userId: dbUserId,
            otp
        });

        const masked = maskEmail(targetEmail);

        return res.json({
            success: true,
            message: emailResult.sent 
                ? `OTP sent successfully to registered email (${masked})`
                : (emailResult.message || `OTP generated. (SMTP credentials not configured on Railway; OTP is displayed below for testing)`),
            maskedEmail: masked,
            userId: dbUserId,
            devOtp: emailResult.sent ? null : otp
        });

    } catch (err) {
        console.error('Request OTP error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

// Failsafe helper to verify if OTP is expired (Valid for 15 minutes)
const isOTPExpired = (record) => {
    try {
        if (!record) return true;
        
        // 1. Primary check: created_at timestamp age
        if (record.created_at) {
            const createdAtMs = record.created_at instanceof Date 
                ? record.created_at.getTime() 
                : new Date(record.created_at).getTime();

            if (!isNaN(createdAtMs) && createdAtMs > 0) {
                const ageInMs = Math.abs(Date.now() - createdAtMs);
                // If created within 15 minutes (900,000 ms), it is ALWAYS valid!
                if (ageInMs <= 15 * 60 * 1000) {
                    return false;
                }
            }
        }

        // 2. Fallback check: expires_at timestamp
        if (record.expires_at) {
            const expiresAtMs = record.expires_at instanceof Date
                ? record.expires_at.getTime()
                : new Date(String(record.expires_at).trim().replace(' ', 'T')).getTime();

            // Allow 6-hour buffer to absorb any server/DB local-UTC timezone offsets
            if (!isNaN(expiresAtMs) && Date.now() > expiresAtMs + (6 * 60 * 60 * 1000)) {
                return true;
            }
        }

        return false;
    } catch (err) {
        console.error('isOTPExpired error:', err);
        return false; // Fail open to allow valid user verification
    }
};

// Verify OTP
const verifyPasswordResetOTP = async (req, res) => {
    try {
        const { userId, otp } = req.body;
        if (!userId || !otp) {
            return res.status(400).json({ success: false, message: 'User ID and OTP are required' });
        }

        const cleanUserId = userId.trim();
        const cleanOtp = String(otp).trim();

        // Fetch latest OTP record for this user ID (case-insensitive)
        const [records] = await query(
            'SELECT * FROM password_otps WHERE LOWER(user_id) = LOWER(?) ORDER BY id DESC LIMIT 1',
            [cleanUserId]
        );

        if (!records || records.length === 0) {
            return res.status(400).json({ success: false, message: 'No OTP request found for this User ID. Please click Send OTP first.' });
        }

        const record = records[0];

        // 1. Compare OTP code (string coercion & trim)
        const dbOtp = String(record.otp).trim();
        if (dbOtp !== cleanOtp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP code. Please check the 6-digit code and try again.' });
        }

        // 2. Check Expiry using failsafe helper
        if (isOTPExpired(record)) {
            return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new OTP.' });
        }

        return res.json({ success: true, message: 'OTP code verified successfully.' });
    } catch (err) {
        console.error('Verify OTP error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

// Reset Password
const resetPasswordWithOTP = async (req, res) => {
    try {
        const { userId, otp, newPassword } = req.body;
        if (!userId || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'User ID, OTP, and New Password are required' });
        }

        if (newPassword.trim().length < 4) {
            return res.status(400).json({ success: false, message: 'New password must be at least 4 characters long' });
        }

        const cleanUserId = userId.trim();
        const cleanOtp = String(otp).trim();

        // Verify OTP record (case-insensitive)
        const [records] = await query(
            'SELECT * FROM password_otps WHERE LOWER(user_id) = LOWER(?) ORDER BY id DESC LIMIT 1',
            [cleanUserId]
        );

        if (!records || records.length === 0 || String(records[0].otp).trim() !== cleanOtp) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP session' });
        }

        const record = records[0];

        if (isOTPExpired(record)) {
            return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new OTP.' });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword.trim(), 10);

        // Update user table (case-insensitive)
        await query('UPDATE users SET password_hash = ? WHERE LOWER(user_id) = LOWER(?)', [
            passwordHash,
            cleanUserId
        ]);

        // Delete used OTP
        await query('DELETE FROM password_otps WHERE LOWER(user_id) = LOWER(?)', [cleanUserId]);

        return res.json({ success: true, message: 'Password reset successfully! You can now sign in with your new password.' });
    } catch (err) {
        console.error('Reset Password error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

module.exports = {
    login,
    changePassword,
    getProfile,
    requestPasswordResetOTP,
    verifyPasswordResetOTP,
    resetPasswordWithOTP
};
