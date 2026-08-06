const { query } = require('../config/db');
const { generateMarksheetPDF } = require('../utils/pdfGenerator');

// 1. Get Comprehensive Student Dashboard Data
const getStudentDashboard = async (req, res) => {
    try {
        const studentId = req.user.userId;

        // Fetch Student Profile
        const [students] = await query('SELECT * FROM students WHERE user_id = ?', [studentId]);
        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'Student record not found' });
        }
        const student = students[0];

        // Fetch Overall Attendance %
        const [attSummary] = await query(`
            SELECT 
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days
            FROM attendance_details
            WHERE student_id = ?
        `, [studentId]);

        const totalDays = attSummary[0]?.total_days || 0;
        const presentDays = attSummary[0]?.present_days || 0;
        const overallAttendancePercent = totalDays > 0 ? parseFloat(((presentDays / totalDays) * 100).toFixed(1)) : 100.0;

        // Monthly Attendance Breakdown
        const [monthlyAttendance] = await query(`
            SELECT 
                a.date as month,
                COUNT(ad.id) as total,
                SUM(CASE WHEN ad.status = 'Present' THEN 1 ELSE 0 END) as present
            FROM attendance_details ad
            JOIN attendance a ON ad.attendance_id = a.id
            WHERE ad.student_id = ?
            GROUP BY a.date
            ORDER BY a.date DESC
        `, [studentId]);

        // Latest Homework for student's class
        const [homeworkList] = await query(
            'SELECT * FROM homework WHERE class_name = ? AND section_name = ? ORDER BY due_date DESC LIMIT 5',
            [student.class_name, student.section_name]
        );

        // Latest Notices
        const [notices] = await query(
            "SELECT * FROM notices WHERE target_audience IN ('All', 'Student') ORDER BY id DESC LIMIT 5"
        );

        // Exam Results Summary
        const [results] = await query(
            'SELECT * FROM results WHERE student_id = ? ORDER BY id DESC',
            [studentId]
        );

        // Attach subject-wise details to each result
        for (let r of results) {
            const [details] = await query('SELECT * FROM result_details WHERE result_id = ?', [r.id]);
            r.subject_details = details;
        }

        return res.json({
            success: true,
            dashboard: {
                student,
                attendance: {
                    overallPercentage: overallAttendancePercent,
                    totalDays,
                    presentDays,
                    monthlyAttendance
                },
                homework: homeworkList,
                notices,
                results
            }
        });
    } catch (err) {
        console.error('getStudentDashboard error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// 2. Download Dynamic Marksheet PDF for Exam
const downloadMarksheetPDF = async (req, res) => {
    try {
        const studentId = req.user.userId;
        const { exam_name } = req.query;

        if (!exam_name) {
            return res.status(400).json({ success: false, message: 'Exam name parameter is required' });
        }

        // Fetch Student Profile
        const [students] = await query('SELECT * FROM students WHERE user_id = ?', [studentId]);
        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }
        const student = students[0];

        // Fetch Result Record
        const [results] = await query('SELECT * FROM results WHERE student_id = ? AND exam_name = ?', [
            studentId, exam_name
        ]);

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: `No result found for exam: ${exam_name}` });
        }
        const resultHeader = results[0];

        // Fetch Subject Details
        const [subjectMarks] = await query('SELECT subject_name, marks_obtained, max_marks FROM result_details WHERE result_id = ?', [
            resultHeader.id
        ]);

        // Fetch Overall Attendance %
        const [attSummary] = await query(`
            SELECT 
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days
            FROM attendance_details
            WHERE student_id = ?
        `, [studentId]);

        const totalDays = attSummary[0]?.total_days || 0;
        const presentDays = attSummary[0]?.present_days || 0;
        const overallPercentage = totalDays > 0 ? parseFloat(((presentDays / totalDays) * 100).toFixed(1)) : 100.0;

        // Trigger PDF Stream Generation
        generateMarksheetPDF(student, resultHeader, subjectMarks, { overall_percentage: overallPercentage }, res);
    } catch (err) {
        console.error('downloadMarksheetPDF error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getStudentDashboard,
    downloadMarksheetPDF
};
