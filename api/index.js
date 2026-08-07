const app = require('../backend/server');
const { initDB } = require('../backend/config/db');

let isDbInitialized = false;

module.exports = async (req, res) => {
    if (!isDbInitialized) {
        try {
            await initDB();
        } catch (e) {
            console.warn('Vercel serverless DB init warning:', e.message);
        }
        isDbInitialized = true;
    }
    return app(req, res);
};
