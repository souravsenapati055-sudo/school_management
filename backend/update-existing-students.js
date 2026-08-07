const { initDB, query } = require('./config/db');
const { generateStudentAdmissionNumber } = require('./utils/idGenerator');

async function updateExistingStudentsData() {
    console.log('🚀 Migration: Updating all existing student admission IDs and roll numbers...');
    await initDB();

    // 1. Fetch all classes & sections to ensure unique roll numbers per class & section
    const [classes] = await query('SELECT DISTINCT class_name FROM students');

    let totalUpdated = 0;

    for (const cls of classes) {
        const className = cls.class_name;
        const [sections] = await query('SELECT DISTINCT section_name FROM students WHERE class_name = ?', [className]);

        for (const sec of sections) {
            const sectionName = sec.section_name;
            const [studentsInSec] = await query(
                'SELECT * FROM students WHERE class_name = ? AND section_name = ? ORDER BY id ASC',
                [className, sectionName]
            );

            // Re-assign distinct sequential roll numbers (1, 2, 3...) if duplicates exist
            const usedRolls = new Set();
            let currentRoll = 1;

            for (const st of studentsInSec) {
                let targetRoll = st.roll_number;
                if (!targetRoll || usedRolls.has(targetRoll)) {
                    while (usedRolls.has(currentRoll)) {
                        currentRoll++;
                    }
                    targetRoll = currentRoll;
                }
                usedRolls.add(targetRoll);

                // Calculate new formula Admission ID: UPPERCASE(FirstName + 2026 + Roll + Section) e.g. SOURAV202649A
                const newAdmNo = generateStudentAdmissionNumber(st.name, targetRoll, sectionName, 2026);

                await query(
                    'UPDATE students SET roll_number = ?, admission_number = ? WHERE id = ?',
                    [targetRoll, newAdmNo, st.id]
                );

                totalUpdated++;
            }
        }
    }

    console.log(`🎉 SUCCESSFULLY MIGRATED AND UPDATED ${totalUpdated} EXISTING STUDENT ADMISSION IDs & ROLL NUMBERS!`);
    process.exit(0);
}

updateExistingStudentsData().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
