const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public: Get ticker announcements
router.get('/', announcementController.getAnnouncements);

// Officer: Create & delete ticker announcements
router.post('/', verifyToken, requireRole(['Officer']), announcementController.createAnnouncement);
router.delete('/:id', verifyToken, requireRole(['Officer']), announcementController.deleteAnnouncement);

module.exports = router;
