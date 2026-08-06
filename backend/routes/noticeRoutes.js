const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const noticeController = require('../controllers/noticeController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/notices');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Engine for PDF attachments
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `notice-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed for notice attachments!'));
        }
    }
});

// Public route to get notices
router.get('/', noticeController.getNotices);

// Officer and Teacher can create notices with optional PDF file attachment
router.post('/', verifyToken, requireRole(['Officer', 'Teacher']), upload.single('pdf'), noticeController.createNotice);
router.delete('/:id', verifyToken, requireRole(['Officer']), noticeController.deleteNotice);

module.exports = router;
