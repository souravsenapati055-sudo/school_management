const http = require('http');

function post(path, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api' + path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }, (res) => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => resolve(JSON.parse(resData)));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function run() {
    console.log('1. Requesting OTP for SOURAV8491...');
    const reqRes = await post('/auth/forgot-password/request-otp', { userId: 'SOURAV8491' });
    console.log('Request OTP response:', reqRes);

    if (reqRes.success && reqRes.devOtp) {
        console.log(`2. Verifying OTP ${reqRes.devOtp} for SOURAV8491...`);
        const verifyRes = await post('/auth/forgot-password/verify-otp', {
            userId: 'SOURAV8491',
            otp: reqRes.devOtp
        });
        console.log('Verify OTP response:', verifyRes);

        if (verifyRes.success) {
            console.log('3. Resetting password...');
            const resetRes = await post('/auth/forgot-password/reset-password', {
                userId: 'SOURAV8491',
                otp: reqRes.devOtp,
                newPassword: 'newpassword123'
            });
            console.log('Reset password response:', resetRes);
        }
    }
}

run();
