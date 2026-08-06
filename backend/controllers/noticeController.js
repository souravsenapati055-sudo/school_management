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
        return res.json({ success: true, notices });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const createNotice = async (req, res) => {
    try {
        const { title, content, target_audience } = req.body;
        const authorName = req.user.userId || 'Officer';

        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Title and Content are required' });
        }

        await query('INSERT INTO notices (title, content, target_audience, author_name) VALUES (?, ?, ?, ?)', [
            title, content, target_audience || 'All', authorName
        ]);

        return res.status(201).json({ success: true, message: 'Notice published successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM notices WHERE id = ?', [id]);
        return res.json({ success: true, message: 'Notice deleted successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getNotices,
    createNotice,
    deleteNotice
};
