const { initDB, query } = require('./backend/config/db');
const { generateStudentAdmissionNumber, generateStudentAdmissionNumberSync } = require('./backend/utils/idGenerator');

async function testAll() {
    console.log('🚀 Running Feature Verification Tests...');
    await initDB();

    // 1. Test Admission Number Formula & Conflict Resolution
    const set1 = new Set();
    const id1 = generateStudentAdmissionNumberSync('Sourav', 'Class 9', 'B', 2026, set1);
    console.log('1a. First student (Sourav, 2026, Class 9, Sec B) Admission ID:', id1);
    if (id1 !== 'SOURAV20269B') {
        throw new Error(`Admission ID formula test failed! Expected SOURAV20269B, got ${id1}`);
    }

    const id2 = generateStudentAdmissionNumberSync('Sourav', 'Class 9', 'B', 2026, set1);
    console.log('1b. Second student conflict (Sourav, 2026, Class 9, Sec B) Admission ID:', id2);
    if (id2 !== 'SOURAV20269B1') {
        throw new Error(`Admission ID conflict test 1 failed! Expected SOURAV20269B1, got ${id2}`);
    }

    const id3 = generateStudentAdmissionNumberSync('Sourav', 'Class 9', 'B', 2026, set1);
    console.log('1c. Third student conflict (Sourav, 2026, Class 9, Sec B) Admission ID:', id3);
    if (id3 !== 'SOURAV20269B2') {
        throw new Error(`Admission ID conflict test 2 failed! Expected SOURAV20269B2, got ${id3}`);
    }

    // 2. Test DOB Presence in Students Table
    const [stWithDob] = await query('SELECT user_id, name, dob FROM students LIMIT 1');
    console.log('2. Sample student with DOB:', stWithDob[0]);
    if (!stWithDob[0] || !stWithDob[0].dob) {
        throw new Error('DOB field verification test failed!');
    }

    console.log('🎉 ALL FEATURE VERIFICATION TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
}

testAll().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
