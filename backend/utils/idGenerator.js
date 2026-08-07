const { query } = require('../config/db');

// Clean student class string e.g. "Class 8" -> "8"
function parseClassNum(className) {
    if (!className) return '';
    const match = className.match(/\d+/);
    return match ? match[0] : className.replace(/\s+/g, '');
}

// Generate Student ID: UPPERCASE(FirstName + ClassNum + RollNumber)
// Auto-append numeric suffix if duplicate exists (SOURAV849 -> SOURAV8491)
async function generateStudentId(name, className, rollNumber) {
    const firstName = name.trim().split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase();
    const classNum = parseClassNum(className);
    const roll = String(rollNumber).trim();

    let baseId = `${firstName}${classNum}${roll}`.toUpperCase();
    let candidateId = baseId;
    let counter = 1;

    while (true) {
        const [rows] = await query('SELECT user_id FROM users WHERE user_id = ?', [candidateId]);
        if (rows.length === 0) {
            return candidateId;
        }
        candidateId = `${baseId}${counter}`;
        counter++;
    }
}

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
    generateStudentId,
    generateTeacherId,
    generateStudentDefaultPassword
};

