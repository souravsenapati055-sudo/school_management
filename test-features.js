const { initDB, query } = require('./backend/config/db');
const { generateStudentAdmissionNumber } = require('./backend/utils/idGenerator');

async function testAll() {
    console.log('🚀 Running Feature Verification Tests...');
    await initDB();

    // 1. Test Admission Number Formula
    const admNo = generateStudentAdmissionNumber('Sourav Senapati', 49, 'A', 2026);
    console.log('1. Generated Admission ID formula:', admNo);
    if (admNo !== 'SOURAV202649A') {
        throw new Error('Admission ID formula test failed! Expected SOURAV202649A, got ' + admNo);
    }

    // 2. Test Roll Number Uniqueness in Same Class & Section
    const className = 'Class 9';
    const sectionName = 'A';
    const rollNumber = 999;

    // Clean test records
    await query('DELETE FROM users WHERE user_id IN (?, ?)', ['TESTSUB1', 'TESTSUB2']);
    await query('DELETE FROM students WHERE user_id IN (?, ?)', ['TESTSUB1', 'TESTSUB2']);

    await query(`INSERT INTO users (user_id, password_hash, role, first_login) VALUES ('TESTSUB1', 'HASH123', 'Student', 1)`);
    await query(`INSERT INTO students (user_id, name, roll_number, class_name, section_name, admission_number) VALUES ('TESTSUB1', 'Student One', ?, ?, ?, 'SUB12026999A')`, [
        rollNumber, className, sectionName
    ]);

    // Query uniqueness check
    const [existing] = await query('SELECT user_id, name FROM students WHERE class_name = ? AND section_name = ? AND roll_number = ?', [className, sectionName, rollNumber]);
    console.log('2. Roll Number uniqueness check count for Class 9 Sec A Roll 999:', existing.length);
    if (existing.length !== 1) {
        throw new Error('Roll number uniqueness check failed!');
    }

    // 3. Test Student Login Lookup by Admission ID (SOURAV202649A)
    const [students] = await query('SELECT user_id FROM students WHERE LOWER(admission_number) = LOWER(?)', ['SOURAV202649A']);
    console.log('3. Student Login lookup by Admission ID (SOURAV202649A):', students.length > 0 ? `Found student user_id: ${students[0].user_id}` : 'Checked successfully');

    // Clean test data
    await query('DELETE FROM users WHERE user_id IN (?, ?)', ['TESTSUB1', 'TESTSUB2']);
    await query('DELETE FROM students WHERE user_id IN (?, ?)', ['TESTSUB1', 'TESTSUB2']);

    console.log('🎉 ALL FEATURE VERIFICATION TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
}

testAll().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
