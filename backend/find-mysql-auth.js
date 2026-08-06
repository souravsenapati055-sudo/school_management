const mysql = require('mysql2/promise');

const candidates = [
    { user: 'root', password: 'Sourav@9002249524' },
    { user: 'root', password: '' },
    { user: 'root', password: 'root' },
    { user: 'root', password: 'password' },
    { user: 'sourav', password: 'Sourav@9002249524' },
    { user: 'SOURAV', password: 'Sourav@9002249524' }
];

async function testAuth() {
    for (const c of candidates) {
        try {
            console.log(`Testing user: '${c.user}', password: '${c.password}'...`);
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
            console.log(`  Failed (${err.code}): ${err.message}`);
        }
    }
    console.log('No matching MySQL auth found from candidate list.');
    return null;
}

testAuth();
