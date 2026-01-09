import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import OrderScreen from './pages/OrderScreen';
import AdminScreen from './pages/AdminScreen';

function App() {
  return (
    <Router>
      <header>
        <div className="container">
          <h1>Coffee Shop</h1>
          <nav>
            <Link to="/">주문하기</Link>
            <Link to="/admin">관리자</Link>
          </nav>
        </div>
      </header>
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
