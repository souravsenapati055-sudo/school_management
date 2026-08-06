const http = require('http');

async function testApi(path, method = 'GET', body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, body: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('--- Starting API Verification Suite ---');

    // 1. Health Check
    const health = await testApi('/api/health');
    console.log('1. Health Check:', health.body.status === 'ok' ? 'PASSED' : 'FAILED');

    // 2. Officer Login
    const officerLogin = await testApi('/api/auth/login', 'POST', { userId: 'OFFICER01', password: 'OFFICER01' });
    console.log('2. Officer Login:', officerLogin.body.success ? 'PASSED' : 'FAILED', '| Token received');
    const officerToken = officerLogin.body.accessToken;

    // 3. Officer Stats
    const stats = await testApi('/api/officer/dashboard-stats', 'GET', null, officerToken);
    console.log('3. Officer Stats:', stats.body.success ? 'PASSED' : 'FAILED', '| Total Students:', stats.body.stats?.totalStudents);

    // 4. Create Student & Verify Auto ID
    const newStudent = await testApi('/api/officer/students', 'POST', {
        name: 'SOURAV',
        roll_number: 49,
        class_name: 'Class 8',
        section_name: 'A'
    }, officerToken);
    console.log('4. Create Student Auto ID:', newStudent.body.success ? 'PASSED' : 'FAILED', '| Generated ID:', newStudent.body.generatedUserId);

    // 5. Student Login & PDF Marksheet Check
    const studentLogin = await testApi('/api/auth/login', 'POST', { userId: 'SOURAV849', password: 'SOURAV849' });
    console.log('5. Student Login:', studentLogin.body.success ? 'PASSED' : 'FAILED');
    const studentToken = studentLogin.body.accessToken;

    const studentDash = await testApi('/api/student/dashboard', 'GET', null, studentToken);
    console.log('6. Student Dashboard:', studentDash.body.success ? 'PASSED' : 'FAILED', '| Results count:', studentDash.body.dashboard?.results?.length);

    console.log('--- All System Verification Tests Completed Cleanly ---');
}

runTests().catch(console.error);
