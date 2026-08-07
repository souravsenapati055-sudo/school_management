const { initDB, query } = require('./config/db');
const bcrypt = require('bcryptjs');
const { generateStudentDefaultPassword } = require('./utils/idGenerator');

const firstNames = [
    'Sourav', 'Priya', 'Rahul', 'Anita', 'Arav', 'Sneha', 'Amit', 'Pooja', 'Rohan', 'Neha',
    'Arpan', 'Ishita', 'Vikram', 'Ananya', 'Rajesh', 'Sumi', 'Deepak', 'Kavita', 'Sanjay', 'Meera',
    'Siddharth', 'Diya', 'Karan', 'Riya', 'Abhishek', 'Shreya', 'Manish', 'Preeti', 'Aditya', 'Swati',
    'Gaurav', 'Nisha', 'Varun', 'Tanvi', 'Kushal', 'Payal', 'Subhash', 'Mousumi', 'Debasmita', 'Joy'
];

const lastNames = [
    'Senapati', 'Sharma', 'Patel', 'Roy', 'Verma', 'Das', 'Banerjee', 'Malhotra', 'Gupta', 'Mukherjee',
    'Choudhury', 'Chatterjee', 'Ghosh', 'Dutta', 'Sarkar', 'Mishra', 'Singh', 'Kumar', 'Bhowmick', 'Pal'
];

const classList = [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
    'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
];

const sectionList = ['A', 'B', 'C', 'D'];

const examList = ['Annual Exam 2026', 'Half Yearly Exam 2025', 'Unit Test 1'];

const subjectList = [
    'English', 'Bengali', 'Mathematics', 'Physics',
    'Chemistry', 'Biology', 'History', 'Geography', 'Computer'
];

async function seed100Students() {
    console.log('🚀 Starting Fast 100 Students & Full Marks Generator Script...');
    await initDB();

    // Fast pre-hashed password for fast bulk insertion
    const defaultHash = await bcrypt.hash('STUDENT123', 8);

    // Ensure Master Subjects exist in subjects table & class_subjects
    for (const sub of subjectList) {
        try {
            await query('INSERT INTO subjects (name, code) VALUES (?, ?)', [sub, sub.substring(0, 4).toUpperCase()]);
        } catch (e) { /* ignore duplicate */ }

        for (const cls of classList) {
            try {
                await query('INSERT INTO class_subjects (class_name, subject_name) VALUES (?, ?)', [cls, sub]);
            } catch (e) { /* ignore duplicate */ }
        }
    }

    // Ensure Exam Terms exist
    for (const ex of examList) {
        try {
            await query('INSERT INTO exams (name, session) VALUES (?, ?)', [ex, '2025-2026']);
        } catch (e) { /* ignore duplicate */ }
    }

    // Ensure Sections exist
    for (const cls of classList) {
        for (const sec of sectionList) {
            try {
                await query('INSERT INTO sections (class_name, section_name) VALUES (?, ?)', [cls, sec]);
            } catch (e) { /* ignore duplicate */ }
        }
    }

    let createdCount = 0;

    for (let i = 1; i <= 100; i++) {
        const fn = firstNames[(i - 1) % firstNames.length];
        const ln = lastNames[(i - 1) % lastNames.length];
        const fullName = `${fn} ${ln}`;
        
        // Distribute evenly across classes and sections
        const className = classList[(i - 1) % classList.length];
        const sectionName = sectionList[(i - 1) % sectionList.length];
        const rollNumber = Math.floor((i - 1) / (classList.length * sectionList.length)) + 1;

        // Generate User ID e.g. SOURAV91, PRIYA102
        const classNum = className.match(/\d+/) ? className.match(/\d+/)[0] : '1';
        const cleanFn = fn.replace(/[^a-zA-Z]/g, '').toUpperCase();
        let baseUserId = `${cleanFn}${classNum}${rollNumber}`;
        
        // Ensure user_id uniqueness
        let userId = baseUserId;
        let suffix = 1;
        while (true) {
            const [exist] = await query('SELECT user_id FROM users WHERE user_id = ?', [userId]);
            if (exist.length === 0) break;
            userId = `${baseUserId}${suffix++}`;
        }

        // Generate Default Password e.g. SOURAV91A or pre-computed hash
        const plainPassword = generateStudentDefaultPassword(fullName, className, rollNumber, sectionName);
        const passwordHash = await bcrypt.hash(plainPassword, 4); // fast rounds for seeding 100

        // 1. Insert into users
        await query(`INSERT INTO users (user_id, password_hash, role, first_login) VALUES (?, ?, 'Student', 1)`, [
            userId, passwordHash
        ]);

        // 2. Insert into students
        const age = Math.min(18, Math.max(6, parseInt(classNum) + 5));
        const gender = (i % 2 === 0) ? 'Female' : 'Male';
        const fatherName = `Rajesh ${ln}`;
        const motherName = `Sunita ${ln}`;
        const mobileNumber = `98${String(10000000 + i).padStart(8, '0')}`;
        const email = `${cleanFn.toLowerCase()}${i}@student.edu`;
        const admissionNo = `ADM2026${String(i).padStart(4, '0')}`;
        const dob = `20${String(15 - Math.min(12, parseInt(classNum))).padStart(2, '0')}-05-15`;

        await query(`INSERT INTO students (
            user_id, name, roll_number, class_name, section_name, age, gender,
            father_name, mother_name, address, mobile_number, email, admission_number, dob
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            userId, fullName, rollNumber, className, sectionName, age, gender,
            fatherName, motherName, `House No. ${i}, Main Road`, mobileNumber, email, admissionNo, dob
        ]);

        // 3. Insert Exam Results & Subject Marks
        for (const examName of examList) {
            // Generate varied marks per student to create distinct toppers!
            const baseScorePercent = Math.max(45, Math.min(98, 98 - (i * 0.48) + (Math.sin(i) * 5)));
            
            let totalMarks = 0;
            const subjectMarksList = [];

            for (const sub of subjectList) {
                const variation = (Math.sin(i * sub.length) * 8);
                const mark = Math.max(35, Math.min(100, Math.round(baseScorePercent + variation)));
                totalMarks += mark;
                subjectMarksList.push({ subject_name: sub, marks_obtained: mark, max_marks: 100 });
            }

            const totalMaxMarks = subjectList.length * 100;
            const percentage = parseFloat(((totalMarks / totalMaxMarks) * 100).toFixed(2));
            
            let grade = 'F';
            if (percentage >= 90) grade = 'A+';
            else if (percentage >= 75) grade = 'A';
            else if (percentage >= 60) grade = 'B';
            else if (percentage >= 33) grade = 'C';

            let remarks = 'Good effort and steady progress.';
            if (percentage >= 90) remarks = 'Outstanding academic performance! Class Topper.';
            else if (percentage >= 75) remarks = 'Excellent result, keep aiming high.';
            else if (percentage < 50) remarks = 'Needs additional practice and guidance.';

            try {
                const [resMaster] = await query(`INSERT INTO results (
                    exam_name, class_name, section_name, student_id, total_marks, percentage, grade, remarks
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                    examName, className, sectionName, userId, totalMarks, percentage, grade, remarks
                ]);

                const resultId = resMaster.insertId;

                for (const sm of subjectMarksList) {
                    await query(`INSERT INTO result_details (result_id, subject_name, marks_obtained, max_marks) VALUES (?, ?, ?, ?)`, [
                        resultId, sm.subject_name, sm.marks_obtained, sm.max_marks
                    ]);
                }
            } catch (err) {
                // If unique key exists, skip
            }
        }

        // 4. Insert Attendance Details
        try {
            const dateStr = '2026-08-05';
            let [attRows] = await query('SELECT id FROM attendance WHERE class_name = ? AND section_name = ? AND date = ?', [
                className, sectionName, dateStr
            ]);
            let attId;
            if (attRows.length === 0) {
                const [resAtt] = await query('INSERT INTO attendance (class_name, section_name, date, teacher_id) VALUES (?, ?, ?, ?)', [
                    className, sectionName, dateStr, 'RAHULT01'
                ]);
                attId = resAtt.insertId;
            } else {
                attId = attRows[0].id;
            }

            const attStatus = (i % 7 === 0) ? 'Absent' : 'Present';
            await query('INSERT INTO attendance_details (attendance_id, student_id, status) VALUES (?, ?, ?)', [
                attId, userId, attStatus
            ]);
        } catch (e) { /* ignore duplicate */ }

        createdCount++;
    }

    console.log(`🎉 SUCCESSFULLY SEEDED ALL ${createdCount} STUDENTS & FULL MARKS ACROSS ALL CLASSES & SECTIONS!`);
    process.exit(0);
}

seed100Students().catch(err => {
    console.error('❌ Seeder error:', err);
    process.exit(1);
});
