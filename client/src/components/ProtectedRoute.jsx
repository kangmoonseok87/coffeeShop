import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

/**
 * 전용 라우트 (ProtectedRoute)
 * 로그인이 필요한 페이지나 권한이 필요한 페이지를 감싸서 보호하는 역할을 합니다.
 * 
 * @param {object} children - 보호된 페이지 내용
 * @param {string[]} allowedRoles - 이 페이지에 접근하기 위해 허용된 역할 리스트 (예: ['Admin', 'Manager'])
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>로딩 중...</div>; // 인증 확인 중일 때 보여줄 로딩 화면
    }

    // 1. 로그인이 안 되어 있다면 로그인 페이지로 보냅니다.
    if (!user) {
        // 로그인 후 다시 돌아오기 위해 현재 페이지 위치를 state로 넘길 수도 있습니다 (여기서는 생략)
        return <Navigate to="/login" replace />;
    }

    // 2. 권한이 필요한데, 사용자의 권한이 허용된 목록에 없다면 접근을 막습니다.
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        alert('접근 권한이 없습니다.');
        return <Navigate to="/" replace />;
    }

    // 3. 모든 조건을 통과했다면 원래 보여주려던 페이지를 보여줍니다.
    return children;
};

export default ProtectedRoute;
