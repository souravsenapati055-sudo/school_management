const mysql = require('mysql2/promise');

async function testConnection(host) {
    console.log(`Testing connection to ${host}...`);
    try {
        const conn = await mysql.createConnection({
            host: host,
            user: 'root',
            password: 'Sourav@9002249524',
            port: 3306
        });
        console.log(`SUCCESS! Connected to MySQL on ${host}`);
        const [rows] = await conn.query('SELECT VERSION() as ver');
        console.log(`MySQL Version:`, rows[0].ver);
        await conn.end();
        return true;
    } catch (err) {
        console.error(`FAILED on ${host}:`, err.message);
        return false;
    }
}

async function run() {
    const res1 = await testConnection('127.0.0.1');
    if (!res1) {
        await testConnection('localhost');
    }
}

run();
