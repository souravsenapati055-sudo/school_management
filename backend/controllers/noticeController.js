const { query } = require('../config/db');

const getNotices = async (req, res) => {
    try {
        const { audience } = req.query;
        let sql = 'SELECT * FROM notices';
        let params = [];

        if (audience) {
            sql += " WHERE target_audience IN ('All', ?)";
            params.push(audience);
        }

        sql += ' ORDER BY id DESC';
        const [notices] = await query(sql, params);
        return res.json({ success: true, notices: notices || [] });
    } catch (err) {
        console.error('getNotices error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

const createNotice = async (req, res) => {
    try {
        const { title, content, target_audience } = req.body;
        const authorName = req.user?.userId || 'Officer';

        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Title and Content are required' });
        }

        let pdfUrl = null;
        if (req.file) {
            pdfUrl = `/uploads/notices/${req.file.filename}`;
        }

        await query('INSERT INTO notices (title, content, target_audience, author_name, pdf_url) VALUES (?, ?, ?, ?, ?)', [
            title.trim(), 
            content.trim(), 
            target_audience || 'All', 
            authorName,
            pdfUrl
        ]);

        return res.status(201).json({ success: true, message: 'Notice published successfully' });
    } catch (err) {
        console.error('createNotice error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

const deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM notices WHERE id = ?', [id]);
        return res.json({ success: true, message: 'Notice deleted successfully' });
    } catch (err) {
        console.error('deleteNotice error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

module.exports = {
    getNotices,
    createNotice,
    deleteNotice
};
