const express = require('express');
const router = express.Router();
const officerController = require('../controllers/officerController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All officer routes require valid token and 'Officer' role
router.use(verifyToken, requireRole(['Officer']));

router.get('/dashboard-stats', officerController.getDashboardStats);
router.get('/profile', officerController.getOfficerProfile);
router.put('/profile', officerController.updateOfficerProfile);

// Student management
router.post('/students', officerController.createStudent);
router.get('/students', officerController.getStudents);
router.put('/students/:userId', officerController.updateStudent);
router.delete('/students/:userId', officerController.deleteStudent);

// Teacher management
router.post('/teachers', officerController.createTeacher);
router.get('/teachers', officerController.getTeachers);
router.put('/teachers/:userId', officerController.updateTeacher);
router.delete('/teachers/:userId', officerController.deleteTeacher);

// Class & Section management
router.get('/classes', officerController.getClasses);
router.post('/classes', officerController.addClass);
router.post('/sections', officerController.addSection);

// Subject management
router.get('/subjects', officerController.getSubjects);
router.post('/class-subjects', officerController.assignSubjectsToClass);

// Exam management & Toppers
router.get('/exams', officerController.getExams);
router.post('/exams', officerController.createExam);
router.get('/toppers', officerController.getTopperStudents);
router.get('/student-result-pdf', officerController.downloadStudentMarksheetPDFForOfficer);
router.get('/analytics', officerController.getPowerBiAnalyticsForOfficer);

// Global search
router.get('/search', officerController.globalSearch);

module.exports = router;
