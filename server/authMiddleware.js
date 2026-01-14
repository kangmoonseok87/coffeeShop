/**
 * 인증 및 권한 검증 미들웨어 (authMiddleware.js)
 * JWT 토큰을 확인하고 사용자의 역할을 검증하는 기능을 제공합니다.
 */

const jwt = require('jsonwebtoken');

// 1. JWT 토큰 검증 미들웨어
// 클라이언트에서 보낸 토큰이 유효한지 확인합니다.
const verifyToken = (req, res, next) => {
    // 헤더에서 토큰을 가져옵니다 (보통 Authorization: Bearer <token> 형식)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '인증 토큰이 없습니다. 로그인이 필요합니다.' });
    }

    try {
        // 토큰 해독 및 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_jwt_secret');
        req.user = decoded; // 다음 미들웨어에서 사용할 수 있도록 사용자 정보를 저장합니다.
        next();
    } catch (err) {
        return res.status(403).json({ message: '유효하지 않거나 만료된 토큰입니다.' });
    }
};

// 2. 관리자 권한 검증 미들웨어
// 현재 사용자가 'Admin' 역할인지 확인합니다. (사용자 관리 등 민감한 기능용)
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: '관리자(Admin) 권한이 필요합니다.' });
    }
};

// 3. 매니저급 권한 검증 미들웨어
// 현재 사용자가 'Admin' 또는 'Manager' 역할인지 확인합니다. (주문/메뉴 관리용)
const isManager = (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Manager')) {
        next();
    } else {
        res.status(403).json({ message: '매니저 또는 관리자 권한이 필요합니다.' });
    }
};

module.exports = {
    verifyToken,
    isAdmin,
    isManager
};
