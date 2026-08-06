const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All teacher routes require valid token and 'Teacher' role
router.use(verifyToken, requireRole(['Teacher']));

router.get('/students', teacherController.getStudentsForTeacher);
router.post('/attendance', teacherController.submitAttendance);
router.get('/attendance', teacherController.getAttendanceRecords);

router.post('/homework', teacherController.createHomework);
router.get('/homework', teacherController.getHomeworkList);

router.get('/class-subjects/:class_name', teacherController.getConfiguredSubjectsForClass);
router.post('/marks', teacherController.uploadStudentMarks);

module.exports = router;
