module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || 'school_management_jwt_secret_key_2026_super_secure',
    JWT_EXPIRES_IN: '24h',
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'school_management_refresh_secret_key_2026',
    REFRESH_TOKEN_EXPIRES_IN: '7d'
};
