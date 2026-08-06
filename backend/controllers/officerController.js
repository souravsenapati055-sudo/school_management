const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { generateStudentId, generateTeacherId } = require('../utils/idGenerator');

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

        // Password logic: Default password = generated User ID if empty
        const plainPassword = password && password.trim() !== '' ? password.trim() : generatedUserId;
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
            message: `Student created successfully with User ID: ${generatedUserId}`,
            generatedUserId
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

        await query(`UPDATE students SET 
            name = ?, roll_number = ?, class_name = ?, section_name = ?, age = ?, gender = ?,
            father_name = ?, mother_name = ?, address = ?, mobile_number = ?, email = ?,
            admission_number = ?, dob = ?
            WHERE user_id = ?`, [
            name, roll_number, class_name, section_name, age, gender,
            father_name, mother_name, address, mobile_number, email, admission_number, dob,
            userId
        ]);

        return res.json({ success: true, message: 'Student updated successfully' });
    } catch (err) {
        console.error('Officer updateStudent error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
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
    assignSubjectsToClass,
    createExam,
    getExams,
    globalSearch
};
