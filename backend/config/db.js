const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let mysqlPool = null;
let sqliteDb = null;
let dbType = 'mysql'; // 'mysql' or 'sqlite'

const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'railway',
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Parse MYSQL_URL or DATABASE_URL if provided by Railway
const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQL_PRIVATE_URL;
if (connectionUrl) {
    try {
        const parsed = new URL(connectionUrl);
        if (parsed.hostname) dbConfig.host = parsed.hostname;
        if (parsed.username) dbConfig.user = parsed.username;
        if (parsed.password) dbConfig.password = decodeURIComponent(parsed.password);
        if (parsed.port) dbConfig.port = parseInt(parsed.port);
        if (parsed.pathname && parsed.pathname.length > 1) {
            dbConfig.database = parsed.pathname.substring(1);
        }
    } catch (e) {
        console.warn('Failed to parse MYSQL_URL string:', e.message);
    }
}

// Initialize DB Connection with automatic MySQL setup & SQLite local fallback
async function initDB() {
    // Attempt MySQL first unless explicitly set to sqlite
    if (process.env.DB_TYPE !== 'sqlite') {
        try {
            // First connect without database selected to ensure DB exists
            const tempConn = await mysql.createConnection({
                host: dbConfig.host,
                user: dbConfig.user,
                password: dbConfig.password,
                port: dbConfig.port
            });
            await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
            await tempConn.end();

            mysqlPool = mysql.createPool(dbConfig);
            // Test connection
            const [rows] = await mysqlPool.query('SELECT 1 + 1 AS solution');
            console.log('Connected to MySQL Database successfully.');
            dbType = 'mysql';

            await initMysqlTables();
            await seedDatabaseIfEmpty();
            return;
        } catch (err) {
            console.warn('MySQL connection failed or not configured. Falling back to embedded SQLite for local execution.');
            console.warn('Error details:', err.message);
        }
    }

    // Fallback to SQLite
    dbType = 'sqlite';
    const dbPath = path.join(__dirname, '../school.sqlite');
    sqliteDb = new sqlite3.Database(dbPath);
    console.log('Connected to SQLite Database at:', dbPath);

    await initSqliteTables();
}

async function initMysqlTables() {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf-8');
    const statements = schemaSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.toUpperCase().startsWith('CREATE DATABASE') && !s.toUpperCase().startsWith('USE'));

    for (const stmt of statements) {
        try {
            await mysqlPool.query(stmt);
        } catch (e) {
            // ignore table exists or syntax warnings
        }
    }
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
        const count = users[0].cnt || users[0]['COUNT(*)'];
        if (count > 0) return;

        console.log('Seeding initial data...');
        
        // Hash passwords for seed users
        const officerPass = await bcrypt.hash('OFFICER01', 10);
        const rahulPass = await bcrypt.hash('RAHULT01', 10);
        const anitaPass = await bcrypt.hash('ANITAT02', 10);
        const souravPass = await bcrypt.hash('SOURAV849', 10);
        const priyaPass = await bcrypt.hash('PRIYA812', 10);
        const aravPass = await bcrypt.hash('ARAV805', 10);

        // Users
        await query(`INSERT INTO users (user_id, password_hash, role, first_login) VALUES 
            ('OFFICER01', ?, 'Officer', 0),
            ('RAHULT01', ?, 'Teacher', 1),
            ('ANITAT02', ?, 'Teacher', 1),
            ('SOURAV849', ?, 'Student', 1),
            ('PRIYA812', ?, 'Student', 1),
            ('ARAV805', ?, 'Student', 1)`, 
            [officerPass, rahulPass, anitaPass, souravPass, priyaPass, aravPass]);

        // Officers
        await query(`INSERT INTO officers (user_id, name, email, mobile, designation) VALUES
            ('OFFICER01', 'Principal S. K. Sharma', 'admin@greenwoodschool.edu', '9876543210', 'Headmaster / Admin')`);

        // Teachers
        await query(`INSERT INTO teachers (user_id, name, subject, designation, mobile, email, qualification) VALUES
            ('RAHULT01', 'Rahul Verma', 'Mathematics', 'Senior Mathematics Lecturer', '9812345678', 'rahul.v@greenwood.edu', 'M.Sc. Mathematics, B.Ed.'),
            ('ANITAT02', 'Anita Roy', 'English', 'Head of English Dept.', '9823456789', 'anita.r@greenwood.edu', 'M.A. English Literature')`);

        // Students
        await query(`INSERT INTO students (user_id, name, roll_number, class_name, section_name, age, gender, father_name, mother_name, address, mobile_number, email, admission_number, dob) VALUES
            ('SOURAV849', 'SOURAV SENAPATI', 49, 'Class 8', 'A', 14, 'Male', 'Rajesh Senapati', 'Sunita Senapati', '12 Park Street, City Center', '9988776655', 'sourav@student.edu', 'ADM20240849', '2011-04-15'),
            ('PRIYA812', 'PRIYA SHARMA', 12, 'Class 8', 'A', 13, 'Female', 'Manoj Sharma', 'Anita Sharma', '45 Lake View Road', '9977665544', 'priya@student.edu', 'ADM20240812', '2011-08-20'),
            ('ARAV805', 'ARAV PATEL', 5, 'Class 8', 'B', 14, 'Male', 'Vikram Patel', 'Meena Patel', '88 Green Avenue', '9966554433', 'arav@student.edu', 'ADM20240805', '2011-02-10')`);

        // Classes
        const classNames = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
        for (const cls of classNames) {
            await query(`INSERT INTO classes (class_name) VALUES (?)`, [cls]);
        }

        // Sections
        await query(`INSERT INTO sections (class_name, section_name) VALUES 
            ('Class 8', 'A'), ('Class 8', 'B'), ('Class 8', 'C'), ('Class 10', 'A'), ('Class 10', 'B')`);

        // Master Subjects
        const subjects = ['English', 'Bengali', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer'];
        for (const sub of subjects) {
            await query(`INSERT INTO subjects (name, code) VALUES (?, ?)`, [sub, sub.substring(0, 4).toUpperCase()]);
        }

        // Class Subjects for Class 8
        for (const sub of subjects) {
            await query(`INSERT INTO class_subjects (class_name, subject_name) VALUES ('Class 8', ?)`, [sub]);
        }

        // Exams
        const exams = ['Unit Test 1', 'Half Yearly Exam', 'Unit Test 2', 'Annual Exam'];
        for (const ex of exams) {
            await query(`INSERT INTO exams (name, session) VALUES (?, '2025-2026')`, [ex]);
        }

        // Notices
        await query(`INSERT INTO notices (title, content, target_audience, author_name) VALUES
            ('Annual Sports Day 2025', 'The Annual Sports Meet will be held on 25th August. Interested students register with your sports teacher.', 'All', 'Principal S. K. Sharma'),
            ('Half Yearly Exam Schedule', 'Half Yearly Examinations start from 15th September. Detailed datesheet is available on notice board.', 'Student', 'Officer'),
            ('Staff Meeting Notice', 'All teachers are requested to attend the academic review meeting in Conference Room B at 3 PM today.', 'Teacher', 'Officer')`);

        // Sample Result for SOURAV849
        const [res] = await query(`INSERT INTO results (exam_name, class_name, section_name, student_id, total_marks, percentage, grade, remarks) VALUES
            ('Half Yearly Exam', 'Class 8', 'A', 'SOURAV849', 825.00, 91.67, 'A+', 'Outstanding performance! Keep up the good work.')`);

        const resultId = res.insertId || 1;
        const marksData = [
            ['English', 88.00], ['Bengali', 92.00], ['Mathematics', 98.00],
            ['Physics', 94.00], ['Chemistry', 90.00], ['Biology', 86.00],
            ['History', 89.00], ['Geography', 93.00], ['Computer', 95.00]
        ];

        for (const [sub, marks] of marksData) {
            await query(`INSERT INTO result_details (result_id, subject_name, marks_obtained, max_marks) VALUES (?, ?, ?, 100.00)`, [resultId, sub, marks]);
        }

        // Attendance records
        const [att1] = await query(`INSERT INTO attendance (class_name, section_name, date, teacher_id) VALUES ('Class 8', 'A', '2026-08-01', 'RAHULT01')`);
        const [att2] = await query(`INSERT INTO attendance (class_name, section_name, date, teacher_id) VALUES ('Class 8', 'A', '2026-08-02', 'RAHULT01')`);
        
        await query(`INSERT INTO attendance_details (attendance_id, student_id, status) VALUES 
            (?, 'SOURAV849', 'Present'), (?, 'PRIYA812', 'Present'),
            (?, 'SOURAV849', 'Present'), (?, 'PRIYA812', 'Absent')`, 
            [att1.insertId || 1, att1.insertId || 1, att2.insertId || 2, att2.insertId || 2]);

        // Homework
        await query(`INSERT INTO homework (class_name, section_name, subject_name, title, description, due_date, teacher_id) VALUES
            ('Class 8', 'A', 'Mathematics', 'Quadratic Equations Ex 4.2', 'Solve questions 1 through 15 in homework notebook.', '2026-08-10', 'RAHULT01'),
            ('Class 8', 'A', 'English', 'Essay on Renewable Energy', 'Write 300 words essay on benefits of solar and wind energy.', '2026-08-12', 'ANITAT02')`);

        console.log('Database initial seed complete!');
    } catch (err) {
        console.error('Error seeding database:', err.message);
    }
}

module.exports = {
    initDB,
    query
};
