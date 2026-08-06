const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public route to get notices (Landing page, etc.)
router.get('/', noticeController.getNotices);

// Officer and Teacher can create notices
router.post('/', verifyToken, requireRole(['Officer', 'Teacher']), noticeController.createNotice);
router.delete('/:id', verifyToken, requireRole(['Officer']), noticeController.deleteNotice);

module.exports = router;
