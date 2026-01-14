import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Context 생성
// 로그인 정보와 관련된 데이터와 함수들을 전역에서 사용할 수 있는 통로를 만듭니다.
const AuthContext = createContext(null);

// 2. AuthProvider 컴포넌트
// 앱 전체를 감싸서 어디서든 로그인 정보를 사용할 수 있게 해주는 제공자입니다.
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // 현재 로그인한 사용자 정보
    const [loading, setLoading] = useState(true); // 로딩 상태 (새로고침 시 토큰 확인 등)

    // 앱이 시작될 때 로컬 스토리지에 저장된 토큰이 있는지 확인합니다.
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    // 로그인 함수
    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
    };

    // 로그아웃 함수
    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    // 값이 변경될 때마다 Context를 통해 전파됩니다.
    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// 3. 커스텀 훅 (useAuth)
// 각 컴포넌트에서 useContext(AuthContext)를 매번 쓰는 대신 더 편하게 사용할 수 있게 만든 도구입니다.
export const useAuth = () => {
    return useContext(AuthContext);
};
