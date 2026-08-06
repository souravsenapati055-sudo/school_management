const mysql = require('mysql2/promise');

const candidates = [
    { user: 'root', password: 'sourav@9002249524' },
    { user: 'root', password: 'Sourav9002249524' },
    { user: 'root', password: 'sourav9002249524' },
    { user: 'root', password: 'admin' },
    { user: 'root', password: '1234' },
    { user: 'root', password: '123456' },
    { user: 'root', password: '12345678' },
    { user: 'admin', password: 'Sourav@9002249524' },
    { user: 'admin', password: 'admin' }
];

async function testAuth() {
    for (const c of candidates) {
        try {
            const conn = await mysql.createConnection({
                host: '127.0.0.1',
                user: c.user,
                password: c.password,
                port: 3306
            });
            console.log(`>>> MATCH FOUND! User: '${c.user}', Password: '${c.password}' <<<`);
            const [rows] = await conn.query('SELECT VERSION() as ver');
            console.log('MySQL Version:', rows[0].ver);
            await conn.end();
            return c;
        } catch (err) {
            // silent fail
        }
    }
    console.log('No match found in variation set.');
}

testAuth();
