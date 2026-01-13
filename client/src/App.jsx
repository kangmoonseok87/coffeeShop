import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import OrderScreen from './pages/OrderScreen';
import AdminScreen from './pages/AdminScreen';

const Header = () => {
  const location = useLocation();
  return (
    <header>
      <div className="container">
        <h1>COZY</h1>
        <nav>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>주문하기</Link>
          <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>관리자</Link>
        </nav>
      </div>
    </header>
  );
};

function App() {
  return (
    <Router>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<OrderScreen />} />
          <Route path="/admin" element={<AdminScreen />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
