const fs = require('fs');
const path = require('path');
const { initDB, query } = require('./config/db');

async function resetAndSeedFresh() {
    console.log('🔄 Wiping all previous database data and creating freshly...');

    const sqlitePath = path.join(__dirname, 'school.sqlite');
    if (fs.existsSync(sqlitePath)) {
        try {
            fs.unlinkSync(sqlitePath);
            console.log('✅ Deleted existing school.sqlite database file.');
        } catch (err) {
            console.warn('Notice when deleting sqlite file:', err.message);
        }
    }

    // Initialize DB (creates fresh tables and seeds database)
    await initDB();

    // Query and verify clean fresh counts
    const [students] = await query('SELECT COUNT(*) as cnt FROM students');
    const [teachers] = await query('SELECT COUNT(*) as cnt FROM teachers');
    const [officers] = await query('SELECT COUNT(*) as cnt FROM officers');
    const [exams] = await query('SELECT COUNT(*) as cnt FROM exams');

    console.log('📊 FRESH DATABASE CREATION SUMMARY:');
    console.log(`- Total Fresh Students Seeded: ${students[0].cnt}`);
    console.log(`- Total Teachers: ${teachers[0].cnt}`);
    console.log(`- Total Officers: ${officers[0].cnt}`);
    console.log(`- Total Exams: ${exams[0].cnt}`);

    // Print first 5 sample students from Class 1 - Section A
    const [class1A] = await query('SELECT name, class_name, section_name, roll_number, admission_number FROM students WHERE class_name = ? AND section_name = ? ORDER BY roll_number ASC LIMIT 5', ['Class 1', 'A']);
    console.log('✨ Fresh Class 1 - Section A Students:');
    console.table(class1A);

    console.log('🎉 ALL PREVIOUS DATA DELETED & BRAND NEW FRESH DATA CREATED SUCCESSFULLY!');
    process.exit(0);
}

resetAndSeedFresh().catch(err => {
    console.error('❌ Reset failed:', err);
    process.exit(1);
});
