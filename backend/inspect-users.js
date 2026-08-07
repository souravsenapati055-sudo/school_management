const { initDB, query } = require('./config/db');

async function inspect() {
    await initDB();
    const [users] = await query('SELECT user_id, role, password_hash FROM users WHERE role = "Student"');
    console.log('TOTAL STUDENTS IN USERS TABLE:', users.length);
    console.log('FIRST 10 USERS:', users.slice(0, 10));

    const [students] = await query('SELECT user_id, name, roll_number, class_name, section_name, admission_number FROM students');
    console.log('TOTAL IN STUDENTS TABLE:', students.length);
    console.log('FIRST 10 STUDENTS:', students.slice(0, 10));

    process.exit(0);
}

inspect().catch(err => {
    console.error(err);
    process.exit(1);
});
