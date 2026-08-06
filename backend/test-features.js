const http = require('http');

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : '';
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }, (res) => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(resData));
                } catch (e) {
                    resolve(resData);
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function run() {
    console.log('--- 1. Testing GET /api/announcements ---');
    const annRes = await request('GET', '/announcements');
    console.log('Announcements Response:', annRes);

    console.log('\n--- 2. Testing GET /api/notices ---');
    const notRes = await request('GET', '/notices');
    console.log('Notices Response:', notRes);
}

run();
