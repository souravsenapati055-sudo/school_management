const PDFDocument = require('pdfkit');

/**
 * Generate Student Marksheet PDF Stream
 * @param {Object} studentData - Student profile info
 * @param {Object} resultData - Result header (exam_name, total_marks, percentage, grade, remarks)
 * @param {Array} subjectMarks - Array of { subject_name, marks_obtained, max_marks }
 * @param {Object} attendanceData - { overall_percentage }
 * @param {Response} res - Express response stream
 */
function generateMarksheetPDF(studentData, resultData, subjectMarks, attendanceData, res) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Set Response Headers
    const filename = `Marksheet_${studentData.user_id}_${resultData.exam_name.replace(/\s+/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Color Palette
    const primaryColor = '#1E3A8A';   // Deep Blue
    const secondaryColor = '#3B82F6'; // Light Accent Blue
    const darkTextColor = '#1F2937';  // Charcoal
    const grayBg = '#F3F4F6';         // Light Gray

    // 1. Header Banner Box
    doc.rect(40, 40, 515, 90).fill(primaryColor);

    // School Title & Subtitle
    doc.fillColor('#FFFFFF')
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('GREENWOOD HIGH SCHOOL', 50, 55, { align: 'center' });

    doc.fontSize(11)
       .font('Helvetica')
       .text('Affiliated to Central Board of Secondary Education (CBSE)', { align: 'center' })
       .text('123 Academic Enclave, Knowledge City | Email: info@greenwoodschool.edu', { align: 'center' });

    doc.moveDown(1.5);

    // 2. Marksheet Title
    const currentY = 145;
    doc.fillColor(primaryColor)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text(`OFFICIAL ACADEMIC REPORT CARD - ${resultData.exam_name.toUpperCase()}`, 40, currentY, { align: 'center' });

    // Decorative Line
    doc.moveTo(40, currentY + 22).lineTo(555, currentY + 22).strokeColor(secondaryColor).lineWidth(2).stroke();

    // 3. Student Profile Info Box
    const profileY = 180;
    doc.rect(40, profileY, 515, 80).fill(grayBg);

    doc.fillColor(darkTextColor).fontSize(10).font('Helvetica-Bold');
    
    // Left Column
    doc.text('Student Name:', 55, profileY + 12);
    doc.font('Helvetica').text(studentData.name.toUpperCase(), 145, profileY + 12);

    doc.font('Helvetica-Bold').text('Roll Number:', 55, profileY + 32);
    doc.font('Helvetica').text(String(studentData.roll_number), 145, profileY + 32);

    doc.font('Helvetica-Bold').text('User ID:', 55, profileY + 52);
    doc.font('Helvetica').text(studentData.user_id, 145, profileY + 52);

    // Right Column
    doc.font('Helvetica-Bold').text('Class & Section:', 320, profileY + 12);
    doc.font('Helvetica').text(`${studentData.class_name} - ${studentData.section_name}`, 420, profileY + 12);

    doc.font('Helvetica-Bold').text('Admission No:', 320, profileY + 32);
    doc.font('Helvetica').text(studentData.admission_number || 'N/A', 420, profileY + 32);

    doc.font('Helvetica-Bold').text('Attendance %:', 320, profileY + 52);
    doc.font('Helvetica').text(`${attendanceData.overall_percentage || 0}%`, 420, profileY + 52);

    // 4. Dynamic Subjects Performance Table
    const tableTop = 280;
    
    // Table Header
    doc.rect(40, tableTop, 515, 25).fill(secondaryColor);
    doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');
    doc.text('S.No.', 50, tableTop + 7, { width: 40 });
    doc.text('Subject Name', 100, tableTop + 7, { width: 200 });
    doc.text('Max Marks', 310, tableTop + 7, { width: 80, align: 'center' });
    doc.text('Marks Obtained', 410, tableTop + 7, { width: 100, align: 'center' });

    let yPosition = tableTop + 25;
    let slNo = 1;

    // Table Rows
    doc.fillColor(darkTextColor).font('Helvetica');

    subjectMarks.forEach((row) => {
        // Zebra striping
        if (slNo % 2 === 0) {
            doc.rect(40, yPosition, 515, 22).fill('#F9FAFB');
        }
        
        doc.fillColor(darkTextColor);
        doc.text(String(slNo), 50, yPosition + 6, { width: 40 });
        doc.text(row.subject_name, 100, yPosition + 6, { width: 200 });
        doc.text(String(row.max_marks || 100), 310, yPosition + 6, { width: 80, align: 'center' });
        doc.text(String(row.marks_obtained), 410, yPosition + 6, { width: 100, align: 'center' });

        yPosition += 22;
        slNo++;
    });

    // Divider
    doc.moveTo(40, yPosition).lineTo(555, yPosition).strokeColor('#E5E7EB').lineWidth(1).stroke();

    // 5. Total & Performance Summary Card
    const summaryY = yPosition + 15;
    doc.rect(40, summaryY, 515, 65).fill(grayBg);

    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold');
    doc.text('TOTAL MARKS:', 55, summaryY + 12);
    doc.fillColor(darkTextColor).font('Helvetica').text(`${resultData.total_marks} / ${subjectMarks.length * 100}`, 155, summaryY + 12);

    doc.fillColor(primaryColor).font('Helvetica-Bold').text('PERCENTAGE:', 320, summaryY + 12);
    doc.fillColor(darkTextColor).font('Helvetica').text(`${resultData.percentage}%`, 420, summaryY + 12);

    doc.fillColor(primaryColor).font('Helvetica-Bold').text('GRADE:', 55, summaryY + 36);
    doc.fillColor(darkTextColor).font('Helvetica-Bold').text(`${resultData.grade}`, 155, summaryY + 36);

    doc.fillColor(primaryColor).font('Helvetica-Bold').text('REMARKS:', 320, summaryY + 36);
    doc.fillColor(darkTextColor).font('Helvetica').text(`${resultData.remarks || 'Satisfactory'}`, 420, summaryY + 36);

    // 6. Signatures & Footer
    const footerY = summaryY + 110;

    doc.strokeColor('#9CA3AF').lineWidth(1);
    doc.dash(5, { space: 5 });
    doc.lineCap('butt').moveTo(60, footerY).lineTo(200, footerY).stroke();
    doc.moveTo(395, footerY).lineTo(535, footerY).stroke();
    doc.undash();

    doc.fillColor(darkTextColor).fontSize(9).font('Helvetica-Bold');
    doc.text('Class Teacher Signature', 60, footerY + 8, { width: 140, align: 'center' });
    doc.text('Principal Signature', 395, footerY + 8, { width: 140, align: 'center' });

    doc.fontSize(8).font('Helvetica').fillColor('#6B7280');
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })} | Computer Generated Official Document`, 40, footerY + 45, { align: 'center' });

    doc.end();
}

module.exports = {
    generateMarksheetPDF
};
