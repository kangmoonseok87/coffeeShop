import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import OrderScreen from './pages/OrderScreen';
import AdminScreen from './pages/AdminScreen';

/**
 * 상단 헤더 컴포넌트
 * 로고와 메뉴 버튼이 있으며, 현재 내가 어떤 페이지에 있는지(active) 표시해줍니다.
 */
const Header = () => {
  const location = useLocation(); // 현재 주소창의 경로 정보를 가져옵니다.
  return (
    <header>
      <div className="container">
        <h1>COZY</h1>
        <nav>
          {/* 현재 경로가 '/' 이면 active 클래스를 붙여서 불이 들어오게 합니다. */}
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>주문하기</Link>
          <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>관리자</Link>
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
    <Router>
      <Header /> {/* 모든 페이지에서 공통으로 보이는 헤더 */}
      <main>
        <Routes>
          {/* 주소가 '/' 이면 주문하기 화면으로 연결 */}
          <Route path="/" element={<OrderScreen />} />
          {/* 주소가 '/admin' 이면 관리자 화면으로 연결 */}
          <Route path="/admin" element={<AdminScreen />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
