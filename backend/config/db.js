const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let mysqlPool = null;
let sqliteDb = null;
let dbType = 'mysql'; // 'mysql' or 'sqlite'

// Helper to get non-empty env var
const getEnv = (key) => (process.env[key] && process.env[key].trim() !== '') ? process.env[key].trim() : null;

function buildDbConfig(urlOverride = null) {
    const config = {
        host: getEnv('DB_HOST') || getEnv('MYSQLHOST') || 'localhost',
        user: getEnv('DB_USER') || getEnv('MYSQLUSER') || 'root',
        password: getEnv('DB_PASSWORD') || getEnv('MYSQLPASSWORD') || getEnv('MYSQL_ROOT_PASSWORD') || '',
        database: getEnv('DB_NAME') || getEnv('MYSQLDATABASE') || getEnv('MYSQL_DATABASE') || 'railway',
        port: parseInt(getEnv('DB_PORT') || getEnv('MYSQLPORT') || '3306'),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };

    const targetUrl = urlOverride || getEnv('MYSQL_URL') || getEnv('MYSQL_PRIVATE_URL') || getEnv('MYSQL_PUBLIC_URL') || getEnv('DATABASE_URL');
    if (targetUrl) {
        try {
            const parsed = new URL(targetUrl);
            if (parsed.hostname) config.host = parsed.hostname;
            if (parsed.username) config.user = parsed.username;
            if (parsed.password) config.password = decodeURIComponent(parsed.password);
            if (parsed.port) config.port = parseInt(parsed.port);
            if (parsed.pathname && parsed.pathname.length > 1) {
                config.database = parsed.pathname.substring(1);
            }
        } catch (e) {
            console.warn('Failed to parse connection URL string:', e.message);
        }
    }

    return config;
}

// Initialize DB Connection with automatic MySQL setup & SQLite local fallback
async function initDB() {
    const isExplicitMysql = Boolean(
        getEnv('MYSQLHOST') || 
        getEnv('MYSQL_URL') || 
        getEnv('MYSQL_PUBLIC_URL') || 
        getEnv('MYSQL_PRIVATE_URL') || 
        getEnv('DATABASE_URL') || 
        getEnv('DB_HOST') ||
        getEnv('MYSQLPASSWORD') ||
        getEnv('MYSQL_ROOT_PASSWORD')
    );

    // Array of connection candidate configs: Primary (internal/env), Public URL fallback
    const candidateConfigs = [];
    candidateConfigs.push({ name: 'Primary Config', config: buildDbConfig() });

    const publicUrl = getEnv('MYSQL_PUBLIC_URL');
    if (publicUrl) {
        candidateConfigs.push({ name: 'Public Proxy Fallback', config: buildDbConfig(publicUrl) });
    }

    if (process.env.DB_TYPE !== 'sqlite' || isExplicitMysql) {
        for (const candidate of candidateConfigs) {
            const cfg = candidate.config;
            console.log(`[DB Setup Info] Trying ${candidate.name}: Host=${cfg.host}, Port=${cfg.port}, User=${cfg.user}, DB=${cfg.database}`);
            
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                attempts++;
                try {
                    console.log(`Connecting to MySQL database '${cfg.database}' at ${cfg.host}:${cfg.port}... (Attempt ${attempts}/${maxAttempts})`);
                    
                    mysqlPool = mysql.createPool(cfg);
                    const [rows] = await mysqlPool.query('SELECT 1 + 1 AS solution');
                    console.log(`Successfully connected to MySQL Database via ${candidate.name}!`);
                    dbType = 'mysql';

                    await initMysqlTables();
                    await seedDatabaseIfEmpty();
                    await ensureSequentialRollNumbers();
                    return;
                } catch (err) {
                    console.error(`MySQL connection attempt ${attempts} for ${candidate.name} failed:`, err.message);
                    if (attempts < maxAttempts) {
                        await new Promise(res => setTimeout(res, 2000));
                    }
                }
            }
        }

        if (isExplicitMysql) {
            console.error('Fatal: Could not connect to MySQL database via any configuration.');
        } else {
            console.warn('Falling back to embedded SQLite for local execution.');
        }
    }

    // Fallback to SQLite (only if no explicit MySQL variables provided)
    dbType = 'sqlite';
    const dbPath = path.join(__dirname, '../school.sqlite');
    sqliteDb = new sqlite3.Database(dbPath);
    console.log('Connected to SQLite Database at:', dbPath);

    await initSqliteTables();
}

async function initMysqlTables() {
    const tableQueries = [
        `CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(50) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('Officer', 'Teacher', 'Student') NOT NULL,
            first_login BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_role (role)
        )`,
        `CREATE TABLE IF NOT EXISTS officers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(50) NOT NULL UNIQUE,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100),
            mobile VARCHAR(20),
            designation VARCHAR(50) DEFAULT 'Administrator',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS teachers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(50) NOT NULL UNIQUE,
            name VARCHAR(100) NOT NULL,
            subject VARCHAR(100),
            designation VARCHAR(50) DEFAULT 'Teacher',
            mobile VARCHAR(20),
            email VARCHAR(100),
            qualification VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(50) NOT NULL UNIQUE,
            name VARCHAR(100) NOT NULL,
            roll_number INT NOT NULL,
            class_name VARCHAR(20) NOT NULL,
            section_name VARCHAR(10) NOT NULL,
            age INT,
            gender VARCHAR(15),
            father_name VARCHAR(100),
            mother_name VARCHAR(100),
            address TEXT,
            mobile_number VARCHAR(20),
            email VARCHAR(100),
            admission_number VARCHAR(50),
            dob DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            INDEX idx_class_sec (class_name, section_name)
        )`,
        `CREATE TABLE IF NOT EXISTS classes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_name VARCHAR(20) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS sections (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_name VARCHAR(20) NOT NULL,
            section_name VARCHAR(10) NOT NULL,
            UNIQUE KEY uk_class_section (class_name, section_name)
        )`,
        `CREATE TABLE IF NOT EXISTS subjects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            code VARCHAR(20)
        )`,
        `CREATE TABLE IF NOT EXISTS class_subjects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_name VARCHAR(20) NOT NULL,
            subject_name VARCHAR(100) NOT NULL,
            UNIQUE KEY uk_class_subject (class_name, subject_name)
        )`,
        `CREATE TABLE IF NOT EXISTS exams (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            session VARCHAR(20) DEFAULT '2025-2026',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_name VARCHAR(20) NOT NULL,
            section_name VARCHAR(10) NOT NULL,
            date DATE NOT NULL,
            teacher_id VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_class_sec_date (class_name, section_name, date)
        )`,
        `CREATE TABLE IF NOT EXISTS attendance_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            attendance_id INT NOT NULL,
            student_id VARCHAR(50) NOT NULL,
            status ENUM('Present', 'Absent', 'Leave') NOT NULL,
            FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
            UNIQUE KEY uk_att_student (attendance_id, student_id)
        )`,
        `CREATE TABLE IF NOT EXISTS homework (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_name VARCHAR(20) NOT NULL,
            section_name VARCHAR(10) NOT NULL,
            subject_name VARCHAR(100) NOT NULL,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            due_date DATE NOT NULL,
            teacher_id VARCHAR(50) NOT NULL,
            attachment_url VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS notices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            content TEXT NOT NULL,
            target_audience ENUM('All', 'Student', 'Teacher') DEFAULT 'All',
            author_name VARCHAR(100) DEFAULT 'Officer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS results (
            id INT AUTO_INCREMENT PRIMARY KEY,
            exam_name VARCHAR(100) NOT NULL,
            class_name VARCHAR(20) NOT NULL,
            section_name VARCHAR(10) NOT NULL,
            student_id VARCHAR(50) NOT NULL,
            total_marks DECIMAL(6,2) DEFAULT 0,
            percentage DECIMAL(5,2) DEFAULT 0,
            grade VARCHAR(5),
            remarks VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_exam_student (exam_name, student_id)
        )`,
        `CREATE TABLE IF NOT EXISTS result_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            result_id INT NOT NULL,
            subject_name VARCHAR(100) NOT NULL,
            marks_obtained DECIMAL(5,2) NOT NULL,
            max_marks DECIMAL(5,2) DEFAULT 100,
            FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE,
            UNIQUE KEY uk_res_subj (result_id, subject_name)
        )`,
        `CREATE TABLE IF NOT EXISTS password_otps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(50) NOT NULL,
            email VARCHAR(100) NOT NULL,
            otp VARCHAR(10) NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_otp (user_id, otp)
        )`,
        `CREATE TABLE IF NOT EXISTS announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            text TEXT NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    for (const q of tableQueries) {
        try {
            await mysqlPool.query(q);
        } catch (e) {
            console.warn('MySQL table creation query notice:', e.message);
        }
    }

    // Safely add pdf_url column to notices table if not present
    try {
        await mysqlPool.query(`ALTER TABLE notices ADD COLUMN pdf_url VARCHAR(255) AFTER content`);
    } catch (e) {
        // Ignored if column already exists
    }

    console.log('MySQL schema tables verified/created successfully.');
}

function query(sql, params = []) {
    if (dbType === 'mysql') {
        return mysqlPool.query(sql, params);
    } else {
        return new Promise((resolve, reject) => {
            // Convert MySQL syntax to SQLite compatible if needed
            let sqliteSql = sql
                .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
                .replace(/ENGINE=InnoDB/gi, '')
                .replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '')
                .replace(/ENUM\([^)]+\)/gi, 'TEXT');

            // Determine if SELECT or modification query
            const trimmed = sqliteSql.trim().toUpperCase();
            if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('SHOW')) {
                sqliteDb.all(sqliteSql, params, (err, rows) => {
                    if (err) return reject(err);
                    resolve([rows, []]);
                });
            } else {
                sqliteDb.run(sqliteSql, params, function (err) {
                    if (err) return reject(err);
                    resolve([{ insertId: this.lastID, affectedRows: this.changes }, []]);
                });
            }
        });
    }
}

async function initSqliteTables() {
    return new Promise(async (resolve, reject) => {
        sqliteDb.serialize(async () => {
            sqliteDb.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                first_login INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            sqliteDb.run(`CREATE TABLE IF NOT EXISTS officers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                email TEXT,
                mobile TEXT,
                designation TEXT DEFAULT 'Administrator',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            sqliteDb.run(`CREATE TABLE IF NOT EXISTS teachers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                subject TEXT,
                designation TEXT DEFAULT 'Teacher',
                mobile TEXT,
                email TEXT,
                qualification TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            sqliteDb.run(`CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                roll_number INTEGER NOT NULL,
                class_name TEXT NOT NULL,
                section_name TEXT NOT NULL,
                age INTEGER,
                gender TEXT,
                father_name TEXT,
                mother_name TEXT,
                address TEXT,
                mobile_number TEXT,
                email TEXT,
                admission_number TEXT,
                dob DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            sqliteDb.run(`CREATE TABLE IF NOT EXISTS classes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                class_name TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            sqliteDb.run(`CREATE TABLE IF NOT EXISTS sections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                class_name TEXT NOT NULL,
                section_name TEXT NOT NULL,
                UNIQUE(class_name, section_name)
            )`);

            sqliteDb.run(`CREATE TABLE IF NOT EXISTS subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                code TEXT
            )`);

            sqliteDb.run(`CREATE TABLE IF NOT EXISTS class_subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                class_name TEXT NOT NULL,
                subject_name TEXT NOT NULL,
                UNIQUE(class_name, subject_name)
            )`);

            sqliteDb.run(`CREATE TABLE IF NOT EXISTS exams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                session TEXT DEFAULT '2025-2026',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            sqliteDb.run(`CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                class_name TEXT NOT NULL,
                section_name TEXT NOT NULL,
                date DATE NOT NULL,
                teacher_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(class_name, section_name, date)
            )`);

            sqliteDb.run(`CREATE TABLE IF NOT EXISTS attendance_details (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                attendance_id INTEGER NOT NULL,
                student_id TEXT NOT NULL,
                status TEXT NOT NULL,
                UNIQUE(attendance_id, student_id)
            )`);

            sqliteDb.run(`CREATE TABLE IF NOT EXISTS homework (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                class_name TEXT NOT NULL,
                section_name TEXT NOT NULL,
                subject_name TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                due_date DATE NOT NULL,
                teacher_id TEXT NOT NULL,
                attachment_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            sqliteDb.run(`CREATE TABLE IF NOT EXISTS notices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                target_audience TEXT DEFAULT 'All',
                author_name TEXT DEFAULT 'Officer',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            sqliteDb.run(`CREATE TABLE IF NOT EXISTS results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                exam_name TEXT NOT NULL,
                class_name TEXT NOT NULL,
                section_name TEXT NOT NULL,
                student_id TEXT NOT NULL,
                total_marks REAL DEFAULT 0,
                percentage REAL DEFAULT 0,
                grade TEXT,
                remarks TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(exam_name, student_id)
            )`);

            sqliteDb.run(`CREATE TABLE IF NOT EXISTS result_details (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                result_id INTEGER NOT NULL,
                subject_name TEXT NOT NULL,
                marks_obtained REAL NOT NULL,
                max_marks REAL DEFAULT 100,
                UNIQUE(result_id, subject_name)
            )`);

            sqliteDb.run(`CREATE TABLE IF NOT EXISTS password_otps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                email TEXT NOT NULL,
                otp TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, async (err) => {
                if (err) return reject(err);
                await seedDatabaseIfEmpty();
                resolve();
            });
        });
    });
}

async function seedDatabaseIfEmpty() {
    try {
        const [users] = await query('SELECT COUNT(*) as cnt FROM users');
        const count = users[0].cnt || users[0]['COUNT(*)'] || 0;
        
        if (count === 0) {
            console.log('Seeding initial admin and teacher users...');
            const officerPass = await bcrypt.hash('OFFICER01', 10);
            const rahulPass = await bcrypt.hash('RAHULT01', 10);
            const anitaPass = await bcrypt.hash('ANITAT02', 10);

            await query(`INSERT INTO users (user_id, password_hash, role, first_login) VALUES 
                ('OFFICER01', ?, 'Officer', 0),
                ('RAHULT01', ?, 'Teacher', 1),
                ('ANITAT02', ?, 'Teacher', 1)`, 
                [officerPass, rahulPass, anitaPass]);

            await query(`INSERT INTO officers (user_id, name, email, mobile, designation) VALUES
                ('OFFICER01', 'Principal S. K. Sharma', 'admin@greenwoodschool.edu', '9876543210', 'Headmaster / Admin')`);

            await query(`INSERT INTO teachers (user_id, name, subject, designation, mobile, email, qualification) VALUES
                ('RAHULT01', 'Rahul Verma', 'Mathematics', 'Senior Mathematics Lecturer', '9812345678', 'rahul.v@greenwood.edu', 'M.Sc. Mathematics, B.Ed.'),
                ('ANITAT02', 'Anita Roy', 'English', 'Head of English Dept.', '9823456789', 'anita.r@greenwood.edu', 'M.A. English Literature')`);

            await query(`INSERT INTO notices (title, content, target_audience, author_name) VALUES
                ('Annual Sports Day 2026', 'The Annual Sports Meet will be held on 25th August. Interested students register with your sports teacher.', 'All', 'Principal S. K. Sharma'),
                ('Half Yearly Exam Schedule', 'Half Yearly Examinations start from 15th September. Detailed datesheet is available on notice board.', 'Student', 'Officer')`);
        }

        // Always check and auto-seed 100 students if missing or less than 20
        await seed100StudentsIfMissing();
        await ensureSequentialRollNumbers();
    } catch (err) {
        console.error('Error seeding database:', err.message);
    }
}

async function ensureSequentialRollNumbers() {
    try {
        const { generateStudentAdmissionNumberSync, generateStudentDefaultPassword } = require('../utils/idGenerator');

        // Disable foreign key checks for bulk update transaction (MySQL / SQLite safe)
        try { await query('SET FOREIGN_KEY_CHECKS = 0'); } catch (e) {}
        try { await query('PRAGMA foreign_keys = OFF'); } catch (e) {}

        const usedAdmissionIds = new Set();
        // Add non-student user_ids to set to prevent collisions with teachers/officers
        const [nonStudents] = await query('SELECT user_id FROM users WHERE role != "Student"');
        if (Array.isArray(nonStudents)) {
            nonStudents.forEach(u => usedAdmissionIds.add(String(u.user_id).toLowerCase()));
        }

        // Step 1: Temporarily prefix all existing student user_ids with TEMP_ to prevent UNIQUE constraint collisions during updates
        const [allStudents] = await query('SELECT id, user_id FROM students');
        for (const st of allStudents) {
            if (!st.user_id.startsWith('TEMP_')) {
                const tempUserId = 'TEMP_' + st.user_id;
                await query('UPDATE users SET user_id = ? WHERE LOWER(user_id) = LOWER(?)', [tempUserId, st.user_id]);
                await query('UPDATE students SET user_id = ? WHERE id = ?', [tempUserId, st.id]);
                try { await query('UPDATE results SET student_id = ? WHERE LOWER(student_id) = LOWER(?)', [tempUserId, st.user_id]); } catch (e) {}
                try { await query('UPDATE attendance_details SET student_id = ? WHERE LOWER(student_id) = LOWER(?)', [tempUserId, st.user_id]); } catch (e) {}
            }
        }

        // Step 2: Assign new admission IDs and roll numbers per class and section
        const [classes] = await query('SELECT DISTINCT class_name FROM students ORDER BY class_name ASC');

        for (const cls of classes) {
            const className = cls.class_name;
            const [sections] = await query('SELECT DISTINCT section_name FROM students WHERE class_name = ? ORDER BY section_name ASC', [className]);

            for (const sec of sections) {
                const sectionName = sec.section_name;
                const [studentsInSec] = await query(
                    'SELECT * FROM students WHERE class_name = ? AND section_name = ? ORDER BY id ASC',
                    [className, sectionName]
                );

                let roll = 1;
                for (const st of studentsInSec) {
                    const newAdmNo = generateStudentAdmissionNumberSync(st.name, className, sectionName, 2026, usedAdmissionIds);
                    const newDefaultPass = generateStudentDefaultPassword(st.name, className, roll, sectionName);
                    const newPassHash = await bcrypt.hash(newDefaultPass, 10);
                    const oldUserId = st.user_id;

                    // Update users table credentials
                    await query(
                        'UPDATE users SET user_id = ?, password_hash = ? WHERE LOWER(user_id) = LOWER(?)',
                        [newAdmNo, newPassHash, oldUserId]
                    );
                    // Update students table details
                    await query(
                        'UPDATE students SET user_id = ?, roll_number = ?, admission_number = ? WHERE id = ?',
                        [newAdmNo, roll, newAdmNo, st.id]
                    );
                    // Update results table student_id references
                    try {
                        await query(
                            'UPDATE results SET student_id = ? WHERE LOWER(student_id) = LOWER(?)',
                            [newAdmNo, oldUserId]
                        );
                    } catch (errRes) {}
                    // Update attendance_details table student_id references
                    try {
                        await query(
                            'UPDATE attendance_details SET student_id = ? WHERE LOWER(student_id) = LOWER(?)',
                            [newAdmNo, oldUserId]
                        );
                    } catch (errAtt) {}

                    roll++;
                }
            }
        }

        try { await query('SET FOREIGN_KEY_CHECKS = 1'); } catch (e) {}
        try { await query('PRAGMA foreign_keys = ON'); } catch (e) {}
    } catch (e) {
        console.error('Error ensuring sequential roll numbers:', e.message);
    }
}

async function seed100StudentsIfMissing() {
    try {
        const [rows] = await query('SELECT COUNT(*) as cnt FROM students');
        const count = rows[0]?.cnt || rows[0]?.['COUNT(*)'] || 0;

        if (count >= 20) {
            await ensureSequentialRollNumbers();
            return;
        }

        console.log('Seeding 100 students and full exam results into database...');

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

        for (const sub of subjectList) {
            try { await query('INSERT INTO subjects (name, code) VALUES (?, ?)', [sub, sub.substring(0, 4).toUpperCase()]); } catch (e) {}
            for (const cls of classList) {
                try { await query('INSERT INTO class_subjects (class_name, subject_name) VALUES (?, ?)', [cls, sub]); } catch (e) {}
            }
        }

        for (const cls of classList) {
            try { await query('INSERT INTO classes (class_name) VALUES (?)', [cls]); } catch (e) {}
            for (const sec of sectionList) {
                try { await query('INSERT INTO sections (class_name, section_name) VALUES (?, ?)', [cls, sec]); } catch (e) {}
            }
        }

        for (const ex of examList) {
            try { await query('INSERT INTO exams (name, session) VALUES (?, ?)', [ex, '2025-2026']); } catch (e) {}
        }

        const sectionRollTracker = {};

        for (let i = 1; i <= 100; i++) {
            const fn = firstNames[(i - 1) % firstNames.length];
            const ln = lastNames[(i - 1) % lastNames.length];
            const fullName = `${fn} ${ln}`;
            
            const className = classList[(i - 1) % classList.length];
            const sectionName = sectionList[(i - 1) % sectionList.length];
            
            const trackerKey = `${className}-${sectionName}`;
            sectionRollTracker[trackerKey] = (sectionRollTracker[trackerKey] || 0) + 1;
            const rollNumber = sectionRollTracker[trackerKey];

            const classNum = className.match(/\d+/) ? className.match(/\d+/)[0] : '1';
            const cleanFn = fn.replace(/[^a-zA-Z]/g, '').toUpperCase();
            
            const admissionNo = `${cleanFn}2026${rollNumber}${sectionName}`;
            let userId = admissionNo;
            let suffix = 1;
            while (true) {
                const [exist] = await query('SELECT user_id FROM users WHERE user_id = ?', [userId]);
                if (exist.length === 0) break;
                userId = `${admissionNo}${suffix++}`;
            }

            const plainPassword = `${cleanFn}${classNum}${rollNumber}${sectionName}`;
            const passwordHash = await bcrypt.hash(plainPassword, 4);

            await query(`INSERT INTO users (user_id, password_hash, role, first_login) VALUES (?, ?, 'Student', 1)`, [
                userId, passwordHash
            ]);

            const age = Math.min(18, Math.max(6, parseInt(classNum) + 5));
            const gender = (i % 2 === 0) ? 'Female' : 'Male';
            const fatherName = `Rajesh ${ln}`;
            const motherName = `Sunita ${ln}`;
            const mobileNumber = `98${String(10000000 + i).padStart(8, '0')}`;
            const email = `${cleanFn.toLowerCase()}${i}@student.edu`;
            const dob = `20${String(15 - Math.min(12, parseInt(classNum))).padStart(2, '0')}-05-15`;

            await query(`INSERT INTO students (
                user_id, name, roll_number, class_name, section_name, age, gender,
                father_name, mother_name, address, mobile_number, email, admission_number, dob
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                userId, fullName, rollNumber, className, sectionName, age, gender,
                fatherName, motherName, `House No. ${i}, Main Road`, mobileNumber, email, admissionNo, dob
            ]);

            for (const examName of examList) {
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
                } catch (err) {}
            }
        }
        console.log('Auto-seeded 100 students and exam records successfully!');
    } catch (err) {
        console.error('seed100StudentsIfMissing error:', err.message);
    }
}

module.exports = {
    initDB,
    query
};
