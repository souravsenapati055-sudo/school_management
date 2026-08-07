const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const officerRoutes = require('./routes/officerRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const announcementRoutes = require('./routes/announcementRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middleware
app.use(helmet());
app.use(cors({
    origin: '*', // Allows local dev and cross-origin requests
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // limit each IP to 300 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads Static Serving (if attachments are uploaded)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date(), app: 'School Management System API' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/announcements', announcementRoutes);

// Manual DB re-init endpoint for diagnostics
app.get('/api/setup-db', async (req, res) => {
    try {
        await initDB();
        res.json({ success: true, message: 'Database initialized successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message, stack: err.stack });
    }
});

const fs = require('fs');

// Serve Static Frontend if built in production
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
}

// Global 404 Handler for API routes
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'API Route not found' });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// Export app for serverless environments (Vercel)
module.exports = app;

// Start Server immediately when run as main module (Railway / Local Node process)
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`===================================================`);
        console.log(`School Management API Server running on port ${PORT}`);
        console.log(`Health Check: http://localhost:${PORT}/api/health`);
        console.log(`===================================================`);
        
        // Initialize Database after server is running
        initDB().catch(err => {
            console.error('Database initialization warning:', err.message);
        });
    });
}
