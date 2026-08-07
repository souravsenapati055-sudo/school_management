const { query } = require('../config/db');

// 1. Fetch Students by Class & Section for Attendance/Marks Upload
const getStudentsForTeacher = async (req, res) => {
    try {
        const { class_name, section_name } = req.query;
        if (!class_name || !section_name) {
            return res.status(400).json({ success: false, message: 'Class and Section required' });
        }

        const [students] = await query(
            'SELECT user_id, name, roll_number, class_name, section_name FROM students WHERE class_name = ? AND section_name = ? ORDER BY roll_number ASC',
            [class_name, section_name]
        );

        return res.json({ success: true, students });
    } catch (err) {
        console.error('getStudentsForTeacher error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// 2. Mark Attendance
const submitAttendance = async (req, res) => {
    try {
        const teacherId = req.user.userId;
        const { class_name, section_name, date, attendance_records } = req.body; 
        // attendance_records = [{ student_id: 'SOURAV849', status: 'Present' }, ...]

        if (!class_name || !section_name || !date || !Array.isArray(attendance_records)) {
            return res.status(400).json({ success: false, message: 'Missing required attendance parameters' });
        }

        // Check if attendance master entry exists for this date & class
        let [existing] = await query('SELECT id FROM attendance WHERE class_name = ? AND section_name = ? AND date = ?', [
            class_name, section_name, date
        ]);

        let attendanceId;
        if (existing.length > 0) {
            attendanceId = existing[0].id;
        } else {
            const [resMaster] = await query('INSERT INTO attendance (class_name, section_name, date, teacher_id) VALUES (?, ?, ?, ?)', [
                class_name, section_name, date, teacherId
            ]);
            attendanceId = resMaster.insertId;
        }

        // Upsert individual student attendance records
        for (const record of attendance_records) {
            const [uCheck] = await query('SELECT user_id FROM users WHERE LOWER(user_id) = LOWER(?)', [record.student_id]);
            const targetStudentId = uCheck.length > 0 ? uCheck[0].user_id : record.student_id;

            const [details] = await query('SELECT id FROM attendance_details WHERE attendance_id = ? AND LOWER(student_id) = LOWER(?)', [
                attendanceId, targetStudentId
            ]);

            if (details.length > 0) {
                await query('UPDATE attendance_details SET status = ? WHERE id = ?', [record.status, details[0].id]);
            } else {
                await query('INSERT INTO attendance_details (attendance_id, student_id, status) VALUES (?, ?, ?)', [
                    attendanceId, targetStudentId, record.status
                ]);
            }
        }

        return res.json({ success: true, message: `Attendance saved successfully for ${date}` });
    } catch (err) {
        console.error('submitAttendance error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

// Fetch Attendance History for Class/Section/Date
const getAttendanceRecords = async (req, res) => {
    try {
        const { class_name, section_name, date } = req.query;
        if (!class_name || !section_name || !date) {
            return res.status(400).json({ success: false, message: 'Class, Section, and Date required' });
        }

        const [master] = await query('SELECT id FROM attendance WHERE class_name = ? AND section_name = ? AND date = ?', [
            class_name, section_name, date
        ]);

        if (master.length === 0) {
            return res.json({ success: true, records: [] });
        }

        const [records] = await query(`
            SELECT ad.student_id, ad.status, s.name, s.roll_number 
            FROM attendance_details ad
            JOIN students s ON LOWER(ad.student_id) = LOWER(s.user_id)
            WHERE ad.attendance_id = ?
            ORDER BY s.roll_number ASC
        `, [master[0].id]);

        return res.json({ success: true, records });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// 3. Upload Homework
const createHomework = async (req, res) => {
    try {
        const teacherId = req.user.userId;
        const { class_name, section_name, subject_name, title, description, due_date } = req.body;

        if (!class_name || !section_name || !subject_name || !title || !due_date) {
            return res.status(400).json({ success: false, message: 'Required homework fields missing' });
        }

        await query(`INSERT INTO homework (class_name, section_name, subject_name, title, description, due_date, teacher_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            class_name.trim(), section_name.trim(), subject_name.trim(), title.trim(), description || '', due_date, teacherId
        ]);

        return res.status(201).json({ success: true, message: 'Homework published successfully' });
    } catch (err) {
        console.error('createHomework error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getHomeworkList = async (req, res) => {
    try {
        const { class_name, section_name } = req.query;
        let sql = 'SELECT * FROM homework WHERE 1=1';
        let params = [];

        if (class_name) {
            sql += ' AND LOWER(class_name) = LOWER(?)';
            params.push(class_name.trim());
        }
        if (section_name) {
            sql += ' AND LOWER(section_name) = LOWER(?)';
            params.push(section_name.trim());
        }

        sql += ' ORDER BY id DESC';
        const [homework] = await query(sql, params);

        return res.json({ success: true, homework });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// 4. Dynamic Result Upload based on Officer-Configured Class Subjects
const getConfiguredSubjectsForClass = async (req, res) => {
    try {
        const { class_name } = req.params;
        const [subjects] = await query('SELECT subject_name FROM class_subjects WHERE LOWER(class_name) = LOWER(?)', [class_name.trim()]);
        return res.json({ success: true, subjects: subjects.map(s => s.subject_name) });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const uploadStudentMarks = async (req, res) => {
    try {
        const { exam_name, class_name, section_name, student_id, marks_data, remarks } = req.body;
        // marks_data = [{ subject_name: 'Mathematics', marks_obtained: 95, max_marks: 100 }, ...]

        if (!exam_name || !class_name || !section_name || !student_id || !Array.isArray(marks_data)) {
            return res.status(400).json({ success: false, message: 'Invalid result upload payload' });
        }

        // Fetch exact case user_id from users table
        const [uCheck] = await query('SELECT user_id FROM users WHERE LOWER(user_id) = LOWER(?)', [student_id]);
        const targetStudentId = uCheck.length > 0 ? uCheck[0].user_id : student_id;

        // Calculate Totals & Percentage
        let totalObtained = 0;
        let totalMax = 0;

        marks_data.forEach(m => {
            totalObtained += parseFloat(m.marks_obtained || 0);
            totalMax += parseFloat(m.max_marks || 100);
        });

        const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : 0;

        // Determine Grade
        let grade = 'F';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B+';
        else if (percentage >= 60) grade = 'B';
        else if (percentage >= 50) grade = 'C';
        else if (percentage >= 33) grade = 'D';

        // Check if result record already exists
        const [existing] = await query('SELECT id FROM results WHERE TRIM(LOWER(exam_name)) = TRIM(LOWER(?)) AND LOWER(student_id) = LOWER(?)', [
            exam_name, targetStudentId
        ]);

        let resultId;
        if (existing.length > 0) {
            resultId = existing[0].id;
            await query('UPDATE results SET total_marks = ?, percentage = ?, grade = ?, remarks = ? WHERE id = ?', [
                totalObtained, percentage, grade, remarks || 'Good', resultId
            ]);
            // Clear old detail rows
            await query('DELETE FROM result_details WHERE result_id = ?', [resultId]);
        } else {
            const [resMaster] = await query(`INSERT INTO results (exam_name, class_name, section_name, student_id, total_marks, percentage, grade, remarks) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                exam_name.trim(), class_name.trim(), section_name.trim(), targetStudentId, totalObtained, percentage, grade, remarks || 'Good'
            ]);
            resultId = resMaster.insertId;
        }

        // Insert new subject marks
        for (const item of marks_data) {
            await query('INSERT INTO result_details (result_id, subject_name, marks_obtained, max_marks) VALUES (?, ?, ?, ?)', [
                resultId, item.subject_name.trim(), parseFloat(item.marks_obtained), parseFloat(item.max_marks || 100)
            ]);
        }

        return res.json({
            success: true,
            message: `Marks uploaded successfully for Student ${targetStudentId}`,
            summary: { totalObtained, percentage, grade }
        });
    } catch (err) {
        console.error('uploadStudentMarks error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

// 7. TOPPER LEADERBOARD FOR TEACHER
const getTopperStudents = async (req, res) => {
    try {
        const { class_name, section_name, exam_name, search } = req.query;

        let sql = `
            SELECT 
                r.id as result_id,
                r.student_id,
                r.exam_name,
                r.total_marks,
                r.percentage,
                r.grade,
                r.remarks,
                s.name as student_name,
                s.roll_number,
                s.class_name,
                s.section_name,
                s.email,
                s.admission_number,
                s.mobile_number
            FROM results r
            JOIN students s ON LOWER(r.student_id) = LOWER(s.user_id)
            WHERE 1=1
        `;
        let params = [];

        if (class_name && class_name !== 'All') {
            sql += ' AND s.class_name = ?';
            params.push(class_name);
        }
        if (section_name && section_name !== 'All') {
            sql += ' AND s.section_name = ?';
            params.push(section_name);
        }
        if (exam_name && exam_name !== 'All') {
            sql += ' AND LOWER(r.exam_name) = LOWER(?)';
            params.push(exam_name);
        }
        if (search) {
            sql += ' AND (s.name LIKE ? OR s.user_id LIKE ? OR CAST(s.roll_number AS CHAR) LIKE ?)';
            const pattern = `%${search}%`;
            params.push(pattern, pattern, pattern);
        }

        sql += ' ORDER BY r.percentage DESC, r.total_marks DESC, s.roll_number ASC';

        const [toppers] = await query(sql, params);

        let rank = 1;
        for (let st of toppers) {
            st.rank = rank++;
            const [details] = await query('SELECT subject_name, marks_obtained, max_marks FROM result_details WHERE result_id = ?', [st.result_id]);
            st.subject_details = details || [];
        }

        const totalStudents = toppers.length;
        let highestPercentage = totalStudents > 0 ? toppers[0].percentage : 0;
        let lowestPercentage = totalStudents > 0 ? toppers[totalStudents - 1].percentage : 0;
        let sumPercentage = toppers.reduce((acc, t) => acc + (parseFloat(t.percentage) || 0), 0);
        let classAvgPercentage = totalStudents > 0 ? parseFloat((sumPercentage / totalStudents).toFixed(1)) : 0;
        let passCount = toppers.filter(t => t.grade !== 'F' && (parseFloat(t.percentage) || 0) >= 33).length;
        let failCount = totalStudents - passCount;

        return res.json({
            success: true,
            toppers,
            stats: {
                totalStudents,
                highestPercentage,
                lowestPercentage,
                classAvgPercentage,
                passCount,
                failCount
            }
        });
    } catch (err) {
        console.error('Teacher getTopperStudents error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

const getClasses = async (req, res) => {
    try {
        const [classes] = await query('SELECT * FROM classes ORDER BY id ASC');
        return res.json({ success: true, classes });
    } catch (err) {
        console.error('Teacher getClasses error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getExams = async (req, res) => {
    try {
        const [exams] = await query('SELECT * FROM exams ORDER BY id DESC');
        return res.json({ success: true, exams });
    } catch (err) {
        console.error('Teacher getExams error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const downloadStudentMarksheetPDFForTeacher = async (req, res) => {
    try {
        const { user_id, exam_name } = req.query;
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        const [students] = await query('SELECT * FROM students WHERE LOWER(user_id) = LOWER(?)', [user_id]);
        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }
        const student = students[0];

        let sqlResult = 'SELECT * FROM results WHERE LOWER(student_id) = LOWER(?)';
        let resultParams = [user_id];
        if (exam_name && exam_name !== 'All') {
            sqlResult += ' AND TRIM(LOWER(exam_name)) = TRIM(LOWER(?))';
            resultParams.push(exam_name);
        }
        sqlResult += ' ORDER BY id DESC LIMIT 1';

        const [results] = await query(sqlResult, resultParams);
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: `No result found for student: ${user_id}` });
        }
        const resultHeader = results[0];

        const [subjectMarks] = await query('SELECT subject_name, marks_obtained, max_marks FROM result_details WHERE result_id = ?', [
            resultHeader.id
        ]);

        const [attSummary] = await query(`
            SELECT 
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days
            FROM attendance_details
            WHERE LOWER(student_id) = LOWER(?)
        `, [user_id]);

        const totalDays = attSummary[0]?.total_days || 0;
        const presentDays = attSummary[0]?.present_days || 0;
        const overallPercentage = totalDays > 0 ? parseFloat(((presentDays / totalDays) * 100).toFixed(1)) : 100.0;

        const { generateMarksheetPDF } = require('../utils/pdfGenerator');
        generateMarksheetPDF(student, resultHeader, subjectMarks, { overall_percentage: overallPercentage }, res);
    } catch (err) {
        console.error('downloadStudentMarksheetPDFForTeacher error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

module.exports = {
    getStudentsForTeacher,
    submitAttendance,
    getAttendanceRecords,
    createHomework,
    getHomeworkList,
    getConfiguredSubjectsForClass,
    uploadStudentMarks,
    getTopperStudents,
    getClasses,
    getExams,
    downloadStudentMarksheetPDFForTeacher
};
