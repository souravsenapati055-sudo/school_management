-- School Management System Seed Data
-- Note: Default passwords correspond to bcrypt hash for the initial user IDs or 'password123'
-- Hash below is for 'password123' or User ID matching: $2b$10$w8P4b6XwYg... (we handle bcrypt hashing in DB init script as well)

USE school_db;

-- 1. Initial Users
-- Password for all seed users is set to their User ID or 'password123' ($2b$10$q.F9bN52c.tP9.O0y1pL0.26xTq5S6H8P1q3Z2W7L0X.Q4K6R8Z9G)
-- We will use standard bcrypt hash for 'password123': $2a$10$zS393W5Y5.w7M8YxW... 
INSERT INTO users (user_id, password_hash, role, first_login) VALUES
('OFFICER01', '$2b$10$7R0Z4c8Z.aN9A7kP9xM1u.d4s7K9wL3m2N1P0q9R8S7T6U5V4W3X2', 'Officer', FALSE),
('RAHULT01', '$2b$10$7R0Z4c8Z.aN9A7kP9xM1u.d4s7K9wL3m2N1P0q9R8S7T6U5V4W3X2', 'Teacher', TRUE),
('ANITAT02', '$2b$10$7R0Z4c8Z.aN9A7kP9xM1u.d4s7K9wL3m2N1P0q9R8S7T6U5V4W3X2', 'Teacher', TRUE),
('SOURAV849', '$2b$10$7R0Z4c8Z.aN9A7kP9xM1u.d4s7K9wL3m2N1P0q9R8S7T6U5V4W3X2', 'Student', TRUE),
('PRIYA812', '$2b$10$7R0Z4c8Z.aN9A7kP9xM1u.d4s7K9wL3m2N1P0q9R8S7T6U5V4W3X2', 'Student', TRUE),
('ARAV805', '$2b$10$7R0Z4c8Z.aN9A7kP9xM1u.d4s7K9wL3m2N1P0q9R8S7T6U5V4W3X2', 'Student', TRUE);

-- 2. Officer Details
INSERT INTO officers (user_id, name, email, mobile, designation) VALUES
('OFFICER01', 'Principal S. K. Sharma', 'admin@greenwoodschool.edu', '9876543210', 'Headmaster / Admin');

-- 3. Teacher Details
INSERT INTO teachers (user_id, name, subject, designation, mobile, email, qualification) VALUES
('RAHULT01', 'Rahul Verma', 'Mathematics', 'Senior Mathematics Lecturer', '9812345678', 'rahul.v@greenwood.edu', 'M.Sc. Mathematics, B.Ed.'),
('ANITAT02', 'Anita Roy', 'English', 'Head of English Dept.', '9823456789', 'anita.r@greenwood.edu', 'M.A. English Literature');

-- 4. Student Details
INSERT INTO students (user_id, name, roll_number, class_name, section_name, age, gender, father_name, mother_name, address, mobile_number, email, admission_number, dob) VALUES
('SOURAV849', 'SOURAV SENAPATI', 49, 'Class 8', 'A', 14, 'Male', 'Rajesh Senapati', 'Sunita Senapati', '12 Park Street, City Center', '9988776655', 'sourav@student.edu', 'ADM20240849', '2011-04-15'),
('PRIYA812', 'PRIYA SHARMA', 12, 'Class 8', 'A', 13, 'Female', 'Manoj Sharma', 'Anita Sharma', '45 Lake View Road', '9977665544', 'priya@student.edu', 'ADM20240812', '2011-08-20'),
('ARAV805', 'ARAV PATEL', 5, 'Class 8', 'B', 14, 'Male', 'Vikram Patel', 'Meena Patel', '88 Green Avenue', '9966554433', 'arav@student.edu', 'ADM20240805', '2011-02-10');

-- 5. Classes
INSERT INTO classes (class_name) VALUES
('Class 1'), ('Class 2'), ('Class 3'), ('Class 4'), ('Class 5'), 
('Class 6'), ('Class 7'), ('Class 8'), ('Class 9'), ('Class 10'), ('Class 11'), ('Class 12');

-- 6. Sections
INSERT INTO sections (class_name, section_name) VALUES
('Class 8', 'A'), ('Class 8', 'B'), ('Class 8', 'C'),
('Class 10', 'A'), ('Class 10', 'B');

-- 7. Master Subjects
INSERT INTO subjects (name, code) VALUES
('English', 'ENG'),
('Bengali', 'BEN'),
('Mathematics', 'MATH'),
('Physics', 'PHY'),
('Chemistry', 'CHEM'),
('Biology', 'BIO'),
('History', 'HIST'),
('Geography', 'GEO'),
('Computer', 'COMP');

-- 8. Class Subjects for Class 8
INSERT INTO class_subjects (class_name, subject_name) VALUES
('Class 8', 'English'),
('Class 8', 'Bengali'),
('Class 8', 'Mathematics'),
('Class 8', 'Physics'),
('Class 8', 'Chemistry'),
('Class 8', 'Biology'),
('Class 8', 'History'),
('Class 8', 'Geography'),
('Class 8', 'Computer');

-- 9. Exams
INSERT INTO exams (name, session) VALUES
('Unit Test 1', '2025-2026'),
('Half Yearly Exam', '2025-2026'),
('Unit Test 2', '2025-2026'),
('Annual Exam', '2025-2026');

-- 10. Notices
INSERT INTO notices (title, content, target_audience, author_name) VALUES
('Annual Sports Day 2025', 'The Annual Sports Meet will be held on 25th August. Interested students register with your sports teacher.', 'All', 'Principal S. K. Sharma'),
('Half Yearly Exam Schedule', 'Half Yearly Examinations start from 15th September. Detailed datesheet is available on notice board.', 'Student', 'Officer'),
('Staff Meeting Notice', 'All teachers are requested to attend the academic review meeting in Conference Room B at 3 PM today.', 'Teacher', 'Officer');

-- 11. Sample Results for SOURAV849
INSERT INTO results (exam_name, class_name, section_name, student_id, total_marks, percentage, grade, remarks) VALUES
('Half Yearly Exam', 'Class 8', 'A', 'SOURAV849', 825.00, 91.67, 'A+', 'Outstanding performance! Keep up the good work.');

INSERT INTO result_details (result_id, subject_name, marks_obtained, max_marks) VALUES
(1, 'English', 88.00, 100.00),
(1, 'Bengali', 92.00, 100.00),
(1, 'Mathematics', 98.00, 100.00),
(1, 'Physics', 94.00, 100.00),
(1, 'Chemistry', 90.00, 100.00),
(1, 'Biology', 86.00, 100.00),
(1, 'History', 89.00, 100.00),
(1, 'Geography', 93.00, 100.00),
(1, 'Computer', 95.00, 100.00);

-- 12. Sample Attendance
INSERT INTO attendance (class_name, section_name, date, teacher_id) VALUES
('Class 8', 'A', '2026-08-01', 'RAHULT01'),
('Class 8', 'A', '2026-08-02', 'RAHULT01'),
('Class 8', 'A', '2026-08-03', 'RAHULT01');

INSERT INTO attendance_details (attendance_id, student_id, status) VALUES
(1, 'SOURAV849', 'Present'), (1, 'PRIYA812', 'Present'),
(2, 'SOURAV849', 'Present'), (2, 'PRIYA812', 'Absent'),
(3, 'SOURAV849', 'Present'), (3, 'PRIYA812', 'Present');

-- 13. Homework
INSERT INTO homework (class_name, section_name, subject_name, title, description, due_date, teacher_id) VALUES
('Class 8', 'A', 'Mathematics', 'Quadratic Equations Exercise 4.2', 'Complete questions 1 to 15 from Chapter 4 in your homework notebook.', '2026-08-10', 'RAHULT01'),
('Class 8', 'A', 'English', 'Essay Writing on Climate Change', 'Write a 300-word essay on Climate Change and its Impact on global agriculture.', '2026-08-12', 'ANITAT02');
