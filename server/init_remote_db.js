const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSchema() {
    console.log('--- Render DB 초기화 시작 ---');

    // 연결 설정 뭉치
    const dbConfig = process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        }
        : {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
            ssl: { rejectUnauthorized: false }
        };

    const pool = new Pool(dbConfig);
    let client;

    try {
        console.log('데이터베이스 연결 중...');
        client = await pool.connect();
        console.log('✅ 연결 성공!');

        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

        console.log('SQL 실행 중 (테이블 생성 및 초기 데이터 삽입)...');
        await client.query(schemaSql);

        console.log('✅ 모든 테이블이 성공적으로 생성되었고 데이터가 삽입되었습니다!');
    } catch (err) {
        console.error('❌ 작업 실패:', err.message);
        console.log('\n--- 도움말 ---');
        console.log('1. 로컬의 server/.env 파일이 Render의 DB 정보로 설정되어 있는지 확인해 주세요.');
        console.log('2. 또는 DATABASE_URL이 정확한 링크인지 확인해 주세요.');
    } finally {
        if (client) client.release();
        await pool.end();
        console.log('--- 작업 종료 ---');
    }
}

runSchema();
