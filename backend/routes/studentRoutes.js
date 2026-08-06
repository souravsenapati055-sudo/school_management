const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All student routes require valid token and 'Student' role
router.use(verifyToken, requireRole(['Student']));

router.get('/dashboard', studentController.getStudentDashboard);
router.get('/result-pdf', studentController.downloadMarksheetPDF);

module.exports = router;
