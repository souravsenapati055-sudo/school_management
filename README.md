# 🎓 Greenwood High School Management System (Full Stack)

A complete, modern, responsive, role-based **School Management System** built with **React, Vite, Tailwind CSS, Node.js, Express, JWT, PDFKit**, and **MySQL**.

---

## 🌟 Key System Features

### 🏢 1. Public School Landing Page
- **Hero & Mission Statement**: Modern branding with dynamic glassmorphism design.
- **Facilities Showcase**: Smart Classrooms, Science Labs, Sports Grounds, Digital Library, Computer Center, GPS Transport.
- **Real-time Notice Board**: Live announcement feed fetched dynamically from the database.
- **Role-Based Fast Login Entry**: Explicit quick-login buttons for **Student**, **Teacher**, and **Officer**.

### 🔒 2. Authentication & Security (RBAC)
- **Role-Based Access Control (RBAC)**: Enforced via Express JWT middleware & React Protected Routes (`Officer`, `Teacher`, `Student`).
- **Bcrypt Password Hashing**: Passwords stored exclusively as secure bcrypt hashes.
- **Mandatory First-Login Password Change**: Teachers and Students are automatically redirected to forced password change screens on first login before accessing their dashboards.

### 👑 3. Officer (Admin) Module
- **Administrative Dashboard**: Enrolled student count, teacher count, attendance rates, exam counters, and class-wise distribution metrics.
- **Student Management**:
  - Auto User ID Generation: `UPPERCASE(FirstName + Class + Roll)` e.g., `SOURAV849`.
  - Collision Disambiguation: Automatically appends numeric suffixes (`SOURAV8491`) if duplicate names/rolls exist.
  - Full CRUD capabilities (Create, Edit, Delete, Search & Filter).
- **Teacher Management**: Auto-generates Teacher IDs (`RAHULT01`), manages qualifications, contact info, and subjects.
- **Class & Section Management**: Define classes (Class 1 to 12) and sections (A, B, C, D).
- **Subject Configuration Matrix**: Dynamically configure curriculum subjects for each class.
- **Exam Schedule Management**: Create exam terms (Unit Tests, Half Yearly, Annual).
- **Notice Publisher**: Post announcements for `All`, `Student`, or `Teacher`.
- **Global Search**: Search students, teachers, and subjects across the system.

### 👨‍🏫 4. Teacher Module
- **Class Attendance Tracker**: Mark student attendance (Present / Absent / Leave) by Class, Section, and Date. Automatic attendance percentage computation.
- **Homework & Notes Upload**: Post homework assignments with due dates and subject tags.
- **Dynamic Results Upload**: Upload exam marks according to the subjects configured by the Officer for that specific class. Calculates total marks, percentage, and grade (`A+`, `A`, `B+`, etc.) automatically.

### 🎓 5. Student Module
- **Interactive Student Dashboard**: Profile summary, overall attendance circular progress, monthly attendance breakdown, class homework feed, and school notices.
- **Dynamic PDF Marksheet Download**: One-click download of official branded academic marksheets powered by `PDFKit`. Automatically includes class subjects, marks obtained, percentage, grade, attendance %, and principal signature line.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Axios, React Router DOM v6 |
| **Backend** | Node.js, Express.js, JWT (`jsonwebtoken`), Bcrypt (`bcryptjs`), `PDFKit`, `helmet`, `cors`, `express-rate-limit` |
| **Database** | MySQL (Standard `mysql2/promise` pool with schema script & embedded SQLite local fallback) |
| **Deployment** | Vercel (Frontend), Railway (Backend & MySQL Database) |

---

## 🔑 Demo Login Credentials (Initial Seed Data)

| Role | User ID | Default Password | First Login Status |
| :--- | :--- | :--- | :--- |
| **Officer (Admin)** | `OFFICER01` | `OFFICER01` | Password Changed |
| **Teacher** | `RAHULT01` | `RAHULT01` | Forces Password Change |
| **Teacher** | `ANITAT02` | `ANITAT02` | Forces Password Change |
| **Student** | `SOURAV849` | `SOURAV849` | Forces Password Change |
| **Student** | `PRIYA812` | `PRIYA812` | Forces Password Change |

---

## 🚀 Quick Local Setup Instructions

### Prerequisites
- Node.js (v18 or higher recommended)
- MySQL Server (Optional for production; backend includes zero-config auto local fallback for immediate execution)

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
The backend server will start on **http://localhost:5000**. On initial startup, it automatically seeds default tables and accounts.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server will launch on **http://localhost:3000** with API proxying to port 5000.

---

## 🗄️ Database Schema & File Locations

- **SQL Schema File**: [`database/schema.sql`](file:///c:/Users/SOURAV%20SENAPATI/OneDrive/Desktop/school_management/database/schema.sql)
- **Seed Data File**: [`database/seed.sql`](file:///c:/Users/SOURAV%20SENAPATI/OneDrive/Desktop/school_management/database/seed.sql)

---

## 🌐 Production Deployment Guide

### Frontend Deployment (Vercel)
1. Push `frontend/` directory to GitHub repository.
2. Import project in **Vercel**.
3. Set Framework Preset to **Vite**.
4. Configure Build Command: `npm run build` and Output Directory: `dist`.
5. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-railway-backend.up.railway.app`

### Backend & MySQL Deployment (Railway)
1. Create a **New Project** on [Railway](https://railway.app).
2. Add a **MySQL** database service. Note the connection variables (`MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`).
3. Deploy the `backend/` Node.js application service.
4. Set Environment Variables in Railway:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `DB_HOST`: `${{MySQL.MYSQLHOST}}`
   - `DB_USER`: `${{MySQL.MYSQLUSER}}`
   - `DB_PASSWORD`: `${{MySQL.MYSQLPASSWORD}}`
   - `DB_NAME`: `${{MySQL.MYSQLDATABASE}}`
   - `DB_PORT`: `${{MySQL.MYSQLPORT}}`
   - `JWT_SECRET`: `your_secure_jwt_secret_key`
5. Connect to Railway MySQL CLI or Query Editor and execute `database/schema.sql` and `database/seed.sql`.
