const { initDB, query } = require('./config/db');
const { generateStudentAdmissionNumberSync } = require('./utils/idGenerator');

async function updateExistingStudentsData() {
    console.log('🚀 Migration: Updating all existing student admission IDs and roll numbers...');
    await initDB();

    const usedAdmissionIds = new Set();
    const [nonStudents] = await query('SELECT user_id FROM users WHERE role != "Student"');
    if (Array.isArray(nonStudents)) {
        nonStudents.forEach(u => usedAdmissionIds.add(String(u.user_id).toLowerCase()));
    }

    const [classes] = await query('SELECT DISTINCT class_name FROM students ORDER BY class_name ASC');

    let totalUpdated = 0;

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
                const newAdmNo = generateStudentAdmissionNumberSync(st.name, className, sectionName, 2026, usedAdmissionIds);
                const oldUserId = st.user_id;

                await query(
                    'UPDATE users SET user_id = ? WHERE LOWER(user_id) = LOWER(?)',
                    [newAdmNo, oldUserId]
                );
                await query(
                    'UPDATE students SET user_id = ?, roll_number = ?, admission_number = ? WHERE id = ?',
                    [newAdmNo, roll, newAdmNo, st.id]
                );
                try {
                    await query(
                        'UPDATE results SET student_id = ? WHERE LOWER(student_id) = LOWER(?)',
                        [newAdmNo, oldUserId]
                    );
                } catch (e) {}
                try {
                    await query(
                        'UPDATE attendance_details SET student_id = ? WHERE LOWER(student_id) = LOWER(?)',
                        [newAdmNo, oldUserId]
                    );
                } catch (e) {}

                roll++;
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
