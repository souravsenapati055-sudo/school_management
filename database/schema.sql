-- School Management System Database Schema (MySQL Compatible)

CREATE DATABASE IF NOT EXISTS school_db;
USE school_db;

-- 1. Users Table (Core Auth & RBAC)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Officer', 'Teacher', 'Student') NOT NULL,
    first_login BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_role (role)
);

-- 2. Officers Table
CREATE TABLE IF NOT EXISTS officers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    mobile VARCHAR(20),
    designation VARCHAR(50) DEFAULT 'Administrator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
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
);

-- 4. Students Table
CREATE TABLE IF NOT EXISTS students (
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
);

-- 5. Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Sections Table
CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(20) NOT NULL,
    section_name VARCHAR(10) NOT NULL,
    UNIQUE KEY uk_class_section (class_name, section_name)
);

-- 7. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20)
);

-- 8. Class Subjects Table (Mapping subjects for each class)
CREATE TABLE IF NOT EXISTS class_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(20) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    UNIQUE KEY uk_class_subject (class_name, subject_name)
);

-- 9. Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    session VARCHAR(20) DEFAULT '2025-2026',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Attendance Master Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(20) NOT NULL,
    section_name VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    teacher_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_class_sec_date (class_name, section_name, date)
);

-- 11. Attendance Details Table
CREATE TABLE IF NOT EXISTS attendance_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_id INT NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    status ENUM('Present', 'Absent', 'Leave') NOT NULL,
    FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY uk_att_student (attendance_id, student_id)
);

-- 12. Homework Table
CREATE TABLE IF NOT EXISTS homework (
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
);

-- 13. Notices Table
CREATE TABLE IF NOT EXISTS notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    target_audience ENUM('All', 'Student', 'Teacher') DEFAULT 'All',
    author_name VARCHAR(100) DEFAULT 'Officer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Results Master Table
CREATE TABLE IF NOT EXISTS results (
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
);

-- 15. Result Details Table
CREATE TABLE IF NOT EXISTS result_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    result_id INT NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL,
    max_marks DECIMAL(5,2) DEFAULT 100,
    FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE,
    UNIQUE KEY uk_res_subj (result_id, subject_name)
);
