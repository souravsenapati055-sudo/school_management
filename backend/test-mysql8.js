const mysql = require('mysql2/promise');

async function testConn(host) {
    console.log(`Testing MySQL connection to ${host}:3306 with user 'root'...`);
    try {
        const conn = await mysql.createConnection({
            host: host,
            user: 'root',
            password: 'Sourav@9002249524',
            port: 3306
        });
        console.log(`SUCCESS! Connected to MySQL on ${host}`);
        const [rows] = await conn.query('SELECT VERSION() as version');
        console.log('MySQL Server Version:', rows[0].version);
        await conn.end();
        return true;
    } catch (err) {
        console.error(`FAILED on ${host}: Code=${err.code}, Number=${err.errno}, Message=${err.message}`);
        return false;
    }
}

async function run() {
    await testConn('127.0.0.1');
    await testConn('localhost');
}

run();
