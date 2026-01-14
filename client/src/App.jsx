import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User, Coffee, Shield, UtensilsCrossed } from 'lucide-react';
import OrderScreen from './pages/OrderScreen';
import AdminScreen from './pages/AdminScreen';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import MenuManagement from './pages/MenuManagement';
import { AuthProvider, useAuth } from './AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

/**
 * 상단 헤더 컴포넌트
 * 로고와 메뉴 버튼이 있으며, 현재 내가 어떤 페이지에 있는지(active) 표시해줍니다.
 */
const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header>
      <div className="container">
        <h1>COZY</h1>
        <nav>
          {user ? (
            <>
              {/* 모든 사용자가 접근 가능 */}
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                <Coffee size={18} /> 주문하기
              </Link>

              {/* 관리자 권한이 있는 경우에만 표시 */}
              {user.role !== 'Staff' && (
                <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
                  <Shield size={18} /> 관리자
                </Link>
              )}

              {/* 관리자인 경우 사용자 관리 메뉴 추가 */}
              {user.role === 'Admin' && (
                <Link to="/admin/users" className={location.pathname === '/admin/users' ? 'active' : ''}>
                  <User size={18} /> 사용자 관리
                </Link>
              )}

              {/* Admin 또는 Manager인 경우 메뉴 관리 메뉴 추가 */}
              {(user.role === 'Admin' || user.role === 'Manager') && (
                <Link to="/admin/menu" className={location.pathname === '/admin/menu' ? 'active' : ''}>
                  <UtensilsCrossed size={18} /> 메뉴 관리
                </Link>
              )}

              <button onClick={handleLogout} className="nav-btn logout">
                <LogOut size={18} /> 로그아웃
              </button>
            </>
          ) : (
            <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>로그인</Link>
          )}
        </nav>
      </div>
    </header>
  );
};

/**
 * 앱의 전체 구조 (App.jsx)
 * 라우터(Router)를 통해 주소에 따라 다른 화면(OrderScreen, AdminScreen)을 보여주는 역할을 합니다.
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <Header /> {/* 모든 페이지에서 공통으로 보이는 헤더 */}
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* 주문하기 화면: 로그인한 누구나 접근 가능 */}
            <Route path="/" element={
              <ProtectedRoute>
                <OrderScreen />
              </ProtectedRoute>
            } />

            {/* 관리자 화면: Admin 또는 Manager 가능 */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <AdminScreen />
              </ProtectedRoute>
            } />

            {/* 사용자 관리: Admin만 접근 가능 */}
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <UserManagement />
              </ProtectedRoute>
            } />

            {/* 메뉴 관리: Admin 또는 Manager 가능 */}
            <Route path="/admin/menu" element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <MenuManagement />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
