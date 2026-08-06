const { query } = require('../config/db');

// Public: Get all ticker announcements
const getAnnouncements = async (req, res) => {
    try {
        const [announcements] = await query('SELECT * FROM announcements ORDER BY id DESC');
        return res.json({ success: true, announcements: announcements || [] });
    } catch (err) {
        console.error('getAnnouncements error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

// Officer: Create ticker announcement
const createAnnouncement = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: 'Announcement text is required' });
        }

        await query('INSERT INTO announcements (text) VALUES (?)', [text.trim()]);
        return res.status(201).json({ success: true, message: 'Ticker announcement created successfully' });
    } catch (err) {
        console.error('createAnnouncement error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

// Officer: Delete ticker announcement
const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM announcements WHERE id = ?', [id]);
        return res.json({ success: true, message: 'Announcement deleted successfully' });
    } catch (err) {
        console.error('deleteAnnouncement error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }
};

module.exports = {
    getAnnouncements,
    createAnnouncement,
    deleteAnnouncement
};
