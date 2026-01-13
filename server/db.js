/**
 * 데이터베이스 연결 설정 파일 (db.js)
 * 이 파일은 PostgreSQL 데이터베이스와 서버를 연결해주는 통로 역할을 합니다.
 */

const { Pool } = require('pg'); // PostgreSQL과 통신하기 위한 도구(Pool)를 불러옵니다.
require('dotenv').config(); // .env 파일의 설정값들을 읽어옵니다.

// 1. 데이터베이스 접속 정보 설정 (Pool 생성)
// Pool이란? 매번 연결을 새로 만드는 대신, 미리 연결 통로를 여러 개 만들어두고 돌려쓰는 효율적인 방식입니다.
// 1. 데이터베이스 접속 정보 설정 (Pool 생성)
// DATABASE_URL이 있으면 (배포 환경) 이를 먼저 사용하고, 없으면 로컬 설정값들을 사용합니다.
const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false } // 배포 환경에서의 SSL 보안 연결 설정
        }
        : {
            user: process.env.DB_USER,      // 데이터베이스 사용자
            host: process.env.DB_HOST,      // 데이터베이스 서버 위치
            database: process.env.DB_NAME,  // 연결할 데이터베이스 이름
            password: process.env.DB_PASSWORD, // 데이터베이스 비밀번호
            port: process.env.DB_PORT,      // 포트 번호
        }
);

// 2. 외부에서 사용할 수 있게 내보내기
module.exports = {
    // query 함수: SQL 문을 실행할 때 사용합니다.
    query: (text, params) => pool.query(text, params),
    pool // 트랜잭션 등 복잡한 작업이 필요할 때 직접 접근하기 위해 pool 자체도 내보냅니다.
};
