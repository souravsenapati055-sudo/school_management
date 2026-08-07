const { query } = require('../config/db');

function parseClassNum(className) {
    if (!className) return '9';
    const match = String(className).match(/\d+/);
    return match ? match[0] : String(className).replace(/\D/g, '') || '9';
}

function formatStudentAdmissionBase(name, className, sectionName, year = 2026) {
    const firstName = name ? String(name).trim().split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase() : 'STUDENT';
    const classNum = parseClassNum(className);
    const section = sectionName ? String(sectionName).trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : 'B';
    const admYear = year || 2026;

    return `${firstName}${admYear}${classNum}${section}`.toUpperCase();
}

function generateStudentAdmissionNumberSync(name, className, sectionName, year = 2026, existingSet = new Set()) {
    const baseId = formatStudentAdmissionBase(name, className, sectionName, year);
    let candidateId = baseId;
    let counter = 1;

    while (existingSet.has(candidateId.toLowerCase())) {
        candidateId = `${baseId}${counter}`;
        counter++;
    }

    existingSet.add(candidateId.toLowerCase());
    return candidateId;
}

// Generate Student Admission ID: UPPERCASE(FirstName + Year + ClassNum + Section)
// Conflict resolution: SOURAV20269B -> SOURAV20269B1 -> SOURAV20269B2...
async function generateStudentAdmissionNumber(name, className, sectionName, year = 2026, excludeUserId = null) {
    const baseId = formatStudentAdmissionBase(name, className, sectionName, year);
    let candidateId = baseId;
    let counter = 1;

    while (true) {
        let sql1 = 'SELECT user_id FROM users WHERE LOWER(user_id) = LOWER(?)';
        let params1 = [candidateId];
        if (excludeUserId) {
            sql1 += ' AND LOWER(user_id) != LOWER(?)';
            params1.push(excludeUserId);
        }
        const [rows1] = await query(sql1, params1);

        if (!rows1 || rows1.length === 0) {
            let sql2 = 'SELECT id FROM students WHERE LOWER(admission_number) = LOWER(?)';
            let params2 = [candidateId];
            if (excludeUserId) {
                sql2 += ' AND LOWER(user_id) != LOWER(?)';
                params2.push(excludeUserId);
            }
            const [rows2] = await query(sql2, params2);

            if (!rows2 || rows2.length === 0) {
                return candidateId;
            }
        }

        candidateId = `${baseId}${counter}`;
        counter++;
    }
}

// Alias generateStudentId to generateStudentAdmissionNumber
const generateStudentId = generateStudentAdmissionNumber;

// Generate Teacher ID: UPPERCASE(FirstName + 'T' + TwoDigitNumber) e.g. RAHULT01
async function generateTeacherId(name) {
    const firstName = name.trim().split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase();
    const prefix = `${firstName}T`;

    const [rows] = await query(`SELECT user_id FROM users WHERE user_id LIKE ? ORDER BY user_id DESC`, [`${prefix}%`]);

    if (rows.length === 0) {
        return `${prefix}01`;
    }

    let maxNum = 0;
    for (const r of rows) {
        const numStr = r.user_id.replace(prefix, '');
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNum) {
            maxNum = num;
        }
    }

    const nextNum = String(maxNum + 1).padStart(2, '0');
    return `${prefix}${nextNum}`;
}

// Generate Student Default Password: UPPERCASE(FirstName + ClassNum + RollNumber + Section)
// Example: Sourav, Class 9, Roll 49, Section A -> SOURAV949A
function generateStudentDefaultPassword(name, className, rollNumber, sectionName) {
    const firstName = name ? name.trim().split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase() : '';
    const classNum = parseClassNum(className);
    const roll = rollNumber !== undefined && rollNumber !== null ? String(rollNumber).trim() : '';
    const section = sectionName ? String(sectionName).trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

    return `${firstName}${classNum}${roll}${section}`;
}

module.exports = {
    parseClassNum,
    formatStudentAdmissionBase,
    generateStudentAdmissionNumberSync,
    generateStudentAdmissionNumber,
    generateStudentId,
    generateTeacherId,
    generateStudentDefaultPassword
};


