const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

// Middleware to verify JWT Token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Access token missing or invalid format' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { userId, role, firstLogin }
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
};

// Middleware for Role-Based Access Control
const requireRole = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}` 
            });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    requireRole
};
