const { initDB } = require('./config/db');
const { login } = require('./controllers/authController');

async function testApiLogin() {
    await initDB();

    const mockReq = {
        body: {
            userId: 'SOURAV20261A',
            password: 'SOURAV11A'
        }
    };

    const mockRes = {
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            console.log(`[API RESPONSE ${this.statusCode || 200}]`, data);
            return this;
        }
    };

    console.log('Testing authController login API with SOURAV20261A / SOURAV11A...');
    await login(mockReq, mockRes);
    process.exit(0);
}

testApiLogin().catch(err => {
    console.error('Test API Login error:', err);
    process.exit(1);
});
