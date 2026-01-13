/**
 * 데이터베이스 연결 설정 파일 (db.js)
 * 이 파일은 PostgreSQL 데이터베이스와 서버를 연결해주는 통로 역할을 합니다.
 */

const { Pool } = require('pg'); // PostgreSQL과 통신하기 위한 도구(Pool)를 불러옵니다.
require('dotenv').config(); // .env 파일의 설정값들을 읽어옵니다.

// 1. 데이터베이스 접속 정보 설정 (Pool 생성)
// DATABASE_URL이 있으면 (배포 환경) 이를 먼저 사용하고, 없으면 로컬 설정값들을 사용합니다.
const dbConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // 클라우드 DB용 SSL 설정
    }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    };

const pool = new Pool(dbConfig);

// 2. 외부에서 사용할 수 있게 내보내기
module.exports = {
    // query 함수: SQL 문을 실행할 때 사용하며, 에러 발생 시 로그를 남깁니다.
    query: async (text, params) => {
        try {
            return await pool.query(text, params);
        } catch (err) {
            console.error('❌ [DB 쿼리 에러]:', err.message);
            throw err;
        }
    },
    pool
};
