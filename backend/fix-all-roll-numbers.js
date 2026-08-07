const { initDB, query } = require('./config/db');
const { generateStudentAdmissionNumber } = require('./utils/idGenerator');

async function fixAllStudentRollNumbers() {
    console.log('🚀 Fixing all duplicate student roll numbers across all classes & sections...');
    await initDB();

    // Fetch all distinct classes
    const [classes] = await query('SELECT DISTINCT class_name FROM students ORDER BY class_name ASC');

    let totalFixed = 0;

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
                const newAdmNo = generateStudentAdmissionNumber(st.name, roll, sectionName, 2026);
                
                await query(
                    'UPDATE students SET roll_number = ?, admission_number = ? WHERE id = ?',
                    [roll, newAdmNo, st.id]
                );

                console.log(`Updated [${className} - Sec ${sectionName}]: Roll #${roll} | Student: ${st.name} | Admission ID: ${newAdmNo}`);
                roll++;
                totalFixed++;
            }
        }
    }

    console.log(`🎉 COMPLETED! Cleaned and fixed roll numbers for all ${totalFixed} students! Zero duplicate roll numbers remain!`);
    process.exit(0);
}

fixAllStudentRollNumbers().catch(err => {
    console.error('❌ Error fixing roll numbers:', err);
    process.exit(1);
});
