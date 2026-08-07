const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { generateStudentId, generateTeacherId, generateStudentDefaultPassword } = require('../utils/idGenerator');

// 1. Dashboard Statistics & Analytics
const getDashboardStats = async (req, res) => {
    try {
        const [studentCount] = await query('SELECT COUNT(*) as count FROM students');
        const [teacherCount] = await query('SELECT COUNT(*) as count FROM teachers');
        const [examCount] = await query('SELECT COUNT(*) as count FROM exams');
        const [noticeCount] = await query('SELECT COUNT(*) as count FROM notices');
        
        // Classwise student counts
        const [classDistribution] = await query(`
            SELECT class_name, COUNT(*) as student_count 
            FROM students 
            GROUP BY class_name 
            ORDER BY class_name ASC
        `);

        // Recent Notices
        const [recentNotices] = await query('SELECT * FROM notices ORDER BY id DESC LIMIT 5');

        // Recent Exams
        const [recentExams] = await query('SELECT * FROM exams ORDER BY id DESC LIMIT 5');

        // Today's attendance summary
        const todayStr = new Date().toISOString().split('T')[0];
        const [attendanceSummary] = await query(`
            SELECT 
                COUNT(ad.id) as total_marked,
                SUM(CASE WHEN ad.status = 'Present' THEN 1 ELSE 0 END) as present_count
            FROM attendance a
            JOIN attendance_details ad ON a.id = ad.attendance_id
            WHERE a.date = ?
        `, [todayStr]);

        const totalMarked = attendanceSummary[0]?.total_marked || 0;
        const presentCount = attendanceSummary[0]?.present_count || 0;
        const attendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 95; // default preview if no records today

        return res.json({
            success: true,
            stats: {
                totalStudents: studentCount[0].count,
                totalTeachers: teacherCount[0].count,
                totalExams: examCount[0].count,
                totalNotices: noticeCount[0].count,
                todayAttendancePercentage: attendanceRate,
                classDistribution,
                recentNotices,
                recentExams
            }
        });
    } catch (err) {
        console.error('Officer getDashboardStats error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// 2. STUDENT MANAGEMENT
const createStudent = async (req, res) => {
    try {
        const {
            name, roll_number, class_name, section_name, age, gender,
            father_name, mother_name, address, mobile_number, email,
            admission_number, dob, password
        } = req.body;

        if (!name || !roll_number || !class_name || !section_name) {
            return res.status(400).json({ success: false, message: 'Name, Roll Number, Class, and Section are required' });
        }

        // Auto-generate User ID e.g. SOURAV849 with collision protection
        const generatedUserId = await generateStudentId(name, class_name, roll_number);

        // Default password format: Name + Class Digit + Roll Number + Section (e.g. SOURAV949A)
        const defaultPassword = generateStudentDefaultPassword(name, class_name, roll_number, section_name);

        const plainPassword = password && password.trim() !== '' ? password.trim() : defaultPassword;
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        // Insert into users table
        await query('INSERT INTO users (user_id, password_hash, role, first_login) VALUES (?, ?, "Student", 1)', [
            generatedUserId,
            passwordHash
        ]);

        // Insert into students table
        await query(`INSERT INTO students (
            user_id, name, roll_number, class_name, section_name, age, gender,
            father_name, mother_name, address, mobile_number, email, admission_number, dob
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            generatedUserId, name, roll_number, class_name, section_name, age || null, gender || null,
            father_name || null, mother_name || null, address || null, mobile_number || null,
            email || null, admission_number || `ADM${Date.now()}`, dob || null
        ]);

        return res.status(201).json({
            success: true,
            message: `Student created! User ID: ${generatedUserId} | Default Password: ${plainPassword}`,
            generatedUserId,
            defaultPassword: plainPassword
        });
    } catch (err) {
        console.error('Officer createStudent error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

const getStudents = async (req, res) => {
    try {
        const { class_name, section_name, search } = req.query;
        let sql = 'SELECT * FROM students WHERE 1=1';
        let params = [];

        if (class_name) {
            sql += ' AND class_name = ?';
            params.push(class_name);
        }
        if (section_name) {
            sql += ' AND section_name = ?';
            params.push(section_name);
        }
        if (search) {
            sql += ' AND (name LIKE ? OR user_id LIKE ? OR admission_number LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        sql += ' ORDER BY class_name ASC, section_name ASC, roll_number ASC';
        const [students] = await query(sql, params);

        // Attach calculated default initial password to each student object for display on dashboard
        students.forEach(st => {
            st.default_password = generateStudentDefaultPassword(st.name, st.class_name, st.roll_number, st.section_name);
        });

        return res.json({ success: true, students });
    } catch (err) {
        console.error('Officer getStudents error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateStudent = async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            name, roll_number, class_name, section_name, age, gender,
            father_name, mother_name, address, mobile_number, email, admission_number, dob
        } = req.body;

        const cleanAge = (age !== undefined && age !== null && age !== '' && !isNaN(age)) ? parseInt(age) : null;
        const cleanDob = (dob && String(dob).trim() !== '') ? String(dob).trim() : null;
        const cleanEmail = (email && String(email).trim() !== '') ? String(email).trim() : null;
        const cleanMobile = (mobile_number && String(mobile_number).trim() !== '') ? String(mobile_number).trim() : null;

        await query(`UPDATE students SET 
            name = ?, roll_number = ?, class_name = ?, section_name = ?, age = ?, gender = ?,
            father_name = ?, mother_name = ?, address = ?, mobile_number = ?, email = ?,
            admission_number = ?, dob = ?
            WHERE user_id = ?`, [
            name, roll_number, class_name, section_name, cleanAge, gender || null,
            father_name || null, mother_name || null, address || null, cleanMobile, cleanEmail,
            admission_number || null, cleanDob,
            userId
        ]);

        return res.json({ success: true, message: 'Student updated successfully' });
    } catch (err) {
        console.error('Officer updateStudent error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

const deleteStudent = async (req, res) => {
    try {
        const { userId } = req.params;
        await query('DELETE FROM users WHERE user_id = ?', [userId]);
        return res.json({ success: true, message: 'Student deleted successfully' });
    } catch (err) {
        console.error('Officer deleteStudent error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// 3. TEACHER MANAGEMENT
const createTeacher = async (req, res) => {
    try {
        const { name, subject, designation, mobile, email, qualification, password } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Teacher Name is required' });
        }

        const generatedTeacherId = await generateTeacherId(name);
        const plainPassword = password && password.trim() !== '' ? password.trim() : generatedTeacherId;
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        // Insert into users
        await query('INSERT INTO users (user_id, password_hash, role, first_login) VALUES (?, ?, "Teacher", 1)', [
            generatedTeacherId,
            passwordHash
        ]);

        // Insert into teachers
        await query(`INSERT INTO teachers (user_id, name, subject, designation, mobile, email, qualification) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            generatedTeacherId, name, subject || null, designation || 'Teacher',
            mobile || null, email || null, qualification || null
        ]);

        return res.status(201).json({
            success: true,
            message: `Teacher created successfully with User ID: ${generatedTeacherId}`,
            generatedTeacherId
        });
    } catch (err) {
        console.error('Officer createTeacher error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getTeachers = async (req, res) => {
    try {
        const [teachers] = await query('SELECT * FROM teachers ORDER BY id DESC');
        return res.json({ success: true, teachers });
    } catch (err) {
        console.error('Officer getTeachers error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateTeacher = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, subject, designation, mobile, email, qualification } = req.body;

        await query(`UPDATE teachers SET name = ?, subject = ?, designation = ?, mobile = ?, email = ?, qualification = ? WHERE user_id = ?`, [
            name, subject, designation, mobile, email, qualification, userId
        ]);

        return res.json({ success: true, message: 'Teacher updated successfully' });
    } catch (err) {
        console.error('Officer updateTeacher error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteTeacher = async (req, res) => {
    try {
        const { userId } = req.params;
        await query('DELETE FROM users WHERE user_id = ?', [userId]);
        return res.json({ success: true, message: 'Teacher deleted successfully' });
    } catch (err) {
        console.error('Officer deleteTeacher error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// 4. CLASS & SECTION MANAGEMENT
const getClasses = async (req, res) => {
    try {
        const [classes] = await query('SELECT * FROM classes ORDER BY id ASC');
        const [sections] = await query('SELECT * FROM sections ORDER BY class_name ASC, section_name ASC');
        return res.json({ success: true, classes, sections });
    } catch (err) {
        console.error('Officer getClasses error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const addClass = async (req, res) => {
    try {
        const { class_name } = req.body;
        if (!class_name) return res.status(400).json({ success: false, message: 'Class name required' });
        await query('INSERT INTO classes (class_name) VALUES (?)', [class_name]);
        return res.json({ success: true, message: 'Class added successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error adding class: ' + err.message });
    }
};

const addSection = async (req, res) => {
    try {
        const { class_name, section_name } = req.body;
        if (!class_name || !section_name) return res.status(400).json({ success: false, message: 'Class & Section names required' });
        await query('INSERT INTO sections (class_name, section_name) VALUES (?, ?)', [class_name, section_name]);
        return res.json({ success: true, message: 'Section added successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error adding section: ' + err.message });
    }
};

// 5. SUBJECT & CLASS-SUBJECT MANAGEMENT
const getSubjects = async (req, res) => {
    try {
        const [allSubjects] = await query('SELECT * FROM subjects ORDER BY name ASC');
        const [classSubjects] = await query('SELECT * FROM class_subjects ORDER BY class_name ASC');
        return res.json({ success: true, subjects: allSubjects, classSubjects });
    } catch (err) {
        console.error('Officer getSubjects error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const addSubject = async (req, res) => {
    try {
        const { name, code } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Subject name is required' });
        }
        const cleanName = name.trim();
        const cleanCode = (code && code.trim() !== '') ? code.trim().toUpperCase() : cleanName.substring(0, 4).toUpperCase();

        const [existing] = await query('SELECT * FROM subjects WHERE LOWER(name) = LOWER(?)', [cleanName]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: `Subject '${cleanName}' already exists` });
        }

        await query('INSERT INTO subjects (name, code) VALUES (?, ?)', [cleanName, cleanCode]);

        return res.status(201).json({
            success: true,
            message: `Subject '${cleanName}' created successfully!`,
            subject: { name: cleanName, code: cleanCode }
        });
    } catch (err) {
        console.error('Officer addSubject error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

const assignSubjectsToClass = async (req, res) => {
    try {
        const { class_name, subjects } = req.body; // subjects = Array of subject names
        if (!class_name || !Array.isArray(subjects)) {
            return res.status(400).json({ success: false, message: 'Invalid payload' });
        }

        // Clear existing mappings for this class
        await query('DELETE FROM class_subjects WHERE class_name = ?', [class_name]);

        // Insert new subject assignments
        for (const sub of subjects) {
            await query('INSERT INTO class_subjects (class_name, subject_name) VALUES (?, ?)', [class_name, sub]);
        }

        return res.json({ success: true, message: `Subjects updated for ${class_name}` });
    } catch (err) {
        console.error('Officer assignSubjectsToClass error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// 6. EXAM MANAGEMENT
const createExam = async (req, res) => {
    try {
        const { name, session } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Exam name required' });
        await query('INSERT INTO exams (name, session) VALUES (?, ?)', [name, session || '2025-2026']);
        return res.json({ success: true, message: 'Exam created successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error creating exam: ' + err.message });
    }
};

const getExams = async (req, res) => {
    try {
        const [exams] = await query('SELECT * FROM exams ORDER BY id DESC');
        return res.json({ success: true, exams });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// 7. GLOBAL SEARCH
const globalSearch = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') return res.json({ success: true, results: { students: [], teachers: [], subjects: [] } });

        const searchPattern = `%${q.trim()}%`;
        const [students] = await query('SELECT user_id, name, class_name, section_name, roll_number FROM students WHERE name LIKE ? OR user_id LIKE ? LIMIT 5', [searchPattern, searchPattern]);
        const [teachers] = await query('SELECT user_id, name, subject, mobile FROM teachers WHERE name LIKE ? OR user_id LIKE ? OR subject LIKE ? LIMIT 5', [searchPattern, searchPattern, searchPattern]);
        const [subjects] = await query('SELECT name, code FROM subjects WHERE name LIKE ? LIMIT 5', [searchPattern]);

        return res.json({
            success: true,
            results: { students, teachers, subjects }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getOfficerProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const [officers] = await query('SELECT user_id, name, email, mobile, designation FROM officers WHERE user_id = ?', [userId]);

        if (!officers || officers.length === 0) {
            return res.status(404).json({ success: false, message: 'Officer profile not found' });
        }

        return res.json({ success: true, officer: officers[0] });
    } catch (err) {
        console.error('Officer getOfficerProfile error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

const updateOfficerProfile = async (req, res) => {
    try {
        const currentUserId = req.user.user_id;
        const { name, newUserId, email, mobile, designation, currentPassword, newPassword } = req.body;

        // 1. Verify existing officer record
        const [existingOfficers] = await query('SELECT * FROM officers WHERE user_id = ?', [currentUserId]);
        if (!existingOfficers || existingOfficers.length === 0) {
            return res.status(404).json({ success: false, message: 'Officer record not found' });
        }

        // 2. If password change requested, verify current password
        if (newPassword && newPassword.trim() !== '') {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Current password is required to set a new password' });
            }
            const [users] = await query('SELECT * FROM users WHERE user_id = ?', [currentUserId]);
            if (!users || users.length === 0) {
                return res.status(404).json({ success: false, message: 'User account not found' });
            }
            const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Current password is incorrect' });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedNewPass = await bcrypt.hash(newPassword.trim(), salt);
            await query('UPDATE users SET password_hash = ? WHERE user_id = ?', [hashedNewPass, currentUserId]);
        }

        // 3. Handle User ID change if newUserId is specified and different
        let finalUserId = currentUserId;
        if (newUserId && newUserId.trim() !== '' && newUserId.trim() !== currentUserId) {
            const cleanNewId = newUserId.trim();
            const [checkUser] = await query('SELECT * FROM users WHERE user_id = ?', [cleanNewId]);
            if (checkUser && checkUser.length > 0) {
                return res.status(400).json({ success: false, message: `User ID '${cleanNewId}' is already taken` });
            }

            // Disable foreign key checks for update if using MySQL/SQLite
            try {
                await query('SET FOREIGN_KEY_CHECKS = 0');
            } catch (e) {
                // Ignore if SQLite
            }

            await query('UPDATE users SET user_id = ? WHERE user_id = ?', [cleanNewId, currentUserId]);
            await query('UPDATE officers SET user_id = ? WHERE user_id = ?', [cleanNewId, currentUserId]);

            try {
                await query('SET FOREIGN_KEY_CHECKS = 1');
            } catch (e) {
                // Ignore if SQLite
            }

            finalUserId = cleanNewId;
        }

        // 4. Update Officer details (name, email, mobile, designation)
        const cleanName = name ? name.trim() : existingOfficers[0].name;
        const cleanEmail = email ? email.trim() : null;
        const cleanMobile = mobile ? mobile.trim() : null;
        const cleanDesig = designation ? designation.trim() : 'Administrator';

        await query('UPDATE officers SET name = ?, email = ?, mobile = ?, designation = ? WHERE user_id = ?', [
            cleanName, cleanEmail, cleanMobile, cleanDesig, finalUserId
        ]);

        // Generate updated JWT token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { id: req.user.id, user_id: finalUserId, role: 'Officer', name: cleanName },
            process.env.JWT_SECRET || 'school_management_jwt_secret_key_2026_super_secure',
            { expiresIn: '24h' }
        );

        return res.json({
            success: true,
            message: 'Profile & Security settings updated successfully',
            token,
            user: {
                user_id: finalUserId,
                name: cleanName,
                email: cleanEmail,
                mobile: cleanMobile,
                designation: cleanDesig,
                role: 'Officer'
            }
        });
    } catch (err) {
        console.error('Officer updateOfficerProfile error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

// 6. TOPPER LEADERBOARD & PRINT FUNCTIONALITY
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

        // Topper-wise sort: highest percentage & total_marks first, then lowest roll_number
        sql += ' ORDER BY r.percentage DESC, r.total_marks DESC, s.roll_number ASC';

        const [toppers] = await query(sql, params);

        // Attach rank (1, 2, 3...) & subject_details to each student record
        let rank = 1;
        for (let st of toppers) {
            st.rank = rank++;
            const [details] = await query('SELECT subject_name, marks_obtained, max_marks FROM result_details WHERE result_id = ?', [st.result_id]);
            st.subject_details = details || [];
        }

        // Overall statistics summary
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
        console.error('Officer getTopperStudents error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

// 7. DOWNLOAD SUBJECT-WISE RESULT PDF FOR OFFICER
const downloadStudentMarksheetPDFForOfficer = async (req, res) => {
    try {
        const { user_id, exam_name } = req.query;
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        // Fetch Student Profile
        const [students] = await query('SELECT * FROM students WHERE LOWER(user_id) = LOWER(?)', [user_id]);
        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }
        const student = students[0];

        // Fetch Result Record
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
            WHERE LOWER(student_id) = LOWER(?)
        `, [user_id]);

        const totalDays = attSummary[0]?.total_days || 0;
        const presentDays = attSummary[0]?.present_days || 0;
        const overallPercentage = totalDays > 0 ? parseFloat(((presentDays / totalDays) * 100).toFixed(1)) : 100.0;

        const { generateMarksheetPDF } = require('../utils/pdfGenerator');
        generateMarksheetPDF(student, resultHeader, subjectMarks, { overall_percentage: overallPercentage }, res);
    } catch (err) {
        console.error('downloadStudentMarksheetPDFForOfficer error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

// 8. POWERBI VISUAL ANALYTICS DATA FOR OFFICER
const getPowerBiAnalyticsForOfficer = async (req, res) => {
    try {
        const { class_name, section_name, exam_name } = req.query;

        let classFilter = (class_name && class_name !== 'All') ? ' AND s.class_name = ?' : '';
        let secFilter = (section_name && section_name !== 'All') ? ' AND s.section_name = ?' : '';
        let examFilter = (exam_name && exam_name !== 'All') ? ' AND LOWER(r.exam_name) = LOWER(?)' : '';

        let params = [];
        if (class_name && class_name !== 'All') params.push(class_name);
        if (section_name && section_name !== 'All') params.push(section_name);
        if (exam_name && exam_name !== 'All') params.push(exam_name);

        // 1. Overall Class Performance Distribution
        const [classDistribution] = await query(`
            SELECT 
                s.class_name,
                COUNT(DISTINCT s.user_id) as total_students,
                ROUND(AVG(r.percentage), 1) as avg_percentage,
                MAX(r.percentage) as highest_percentage,
                MIN(r.percentage) as lowest_percentage
            FROM students s
            LEFT JOIN results r ON LOWER(s.user_id) = LOWER(r.student_id)
            WHERE 1=1 ${classFilter} ${secFilter} ${examFilter}
            GROUP BY s.class_name
            ORDER BY s.class_name ASC
        `, params);

        // 2. Section Performance Comparison
        const [sectionDistribution] = await query(`
            SELECT 
                s.class_name,
                s.section_name,
                COUNT(DISTINCT s.user_id) as total_students,
                ROUND(AVG(r.percentage), 1) as avg_percentage
            FROM students s
            LEFT JOIN results r ON LOWER(s.user_id) = LOWER(r.student_id)
            WHERE 1=1 ${classFilter} ${secFilter} ${examFilter}
            GROUP BY s.class_name, s.section_name
            ORDER BY s.class_name ASC, s.section_name ASC
        `, params);

        // 3. Subject-wise Average Scores
        const [subjectPerformance] = await query(`
            SELECT 
                rd.subject_name,
                ROUND(AVG(rd.marks_obtained), 1) as avg_marks,
                ROUND(AVG(rd.max_marks), 0) as avg_max_marks,
                MAX(rd.marks_obtained) as highest_marks,
                MIN(rd.marks_obtained) as lowest_marks
            FROM result_details rd
            JOIN results r ON rd.result_id = r.id
            JOIN students s ON LOWER(r.student_id) = LOWER(s.user_id)
            WHERE 1=1 ${classFilter} ${secFilter} ${examFilter}
            GROUP BY rd.subject_name
            ORDER BY rd.subject_name ASC
        `, params);

        // 4. Grade Breakdown (A+, A, B, C, F)
        const [gradeDistribution] = await query(`
            SELECT 
                CASE 
                    WHEN r.percentage >= 90 THEN 'A+ (90%+)'
                    WHEN r.percentage >= 75 THEN 'A (75-89%)'
                    WHEN r.percentage >= 60 THEN 'B (60-74%)'
                    WHEN r.percentage >= 33 THEN 'C (33-59%)'
                    ELSE 'F (Below 33%)'
                END as grade_label,
                COUNT(r.id) as student_count
            FROM results r
            JOIN students s ON LOWER(r.student_id) = LOWER(s.user_id)
            WHERE 1=1 ${classFilter} ${secFilter} ${examFilter}
            GROUP BY grade_label
        `, params);

        // 5. Top 5 Toppers & Bottom 5 Needing Support
        const [topToppers] = await query(`
            SELECT s.name, s.user_id, s.class_name, s.section_name, s.roll_number, r.total_marks, r.percentage, r.grade
            FROM results r
            JOIN students s ON LOWER(r.student_id) = LOWER(s.user_id)
            WHERE 1=1 ${classFilter} ${secFilter} ${examFilter}
            ORDER BY r.percentage DESC, r.total_marks DESC
            LIMIT 5
        `, params);

        const [bottomStudents] = await query(`
            SELECT s.name, s.user_id, s.class_name, s.section_name, s.roll_number, r.total_marks, r.percentage, r.grade
            FROM results r
            JOIN students s ON LOWER(r.student_id) = LOWER(s.user_id)
            WHERE 1=1 ${classFilter} ${secFilter} ${examFilter}
            ORDER BY r.percentage ASC, r.total_marks ASC
            LIMIT 5
        `, params);

        return res.json({
            success: true,
            analytics: {
                classDistribution,
                sectionDistribution,
                subjectPerformance,
                gradeDistribution,
                topToppers,
                bottomStudents
            }
        });
    } catch (err) {
        console.error('Officer getPowerBiAnalyticsForOfficer error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

module.exports = {
    getDashboardStats,
    createStudent,
    getStudents,
    updateStudent,
    deleteStudent,
    createTeacher,
    getTeachers,
    updateTeacher,
    deleteTeacher,
    getClasses,
    addClass,
    addSection,
    getSubjects,
    addSubject,
    assignSubjectsToClass,
    createExam,
    getExams,
    globalSearch,
    getOfficerProfile,
    updateOfficerProfile,
    getTopperStudents,
    downloadStudentMarksheetPDFForOfficer,
    getPowerBiAnalyticsForOfficer
};

