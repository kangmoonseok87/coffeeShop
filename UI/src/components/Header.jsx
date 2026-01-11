import React from 'react';

const Header = ({ view, setView }) => {
    return (
        <header className="header">
            <div
                className="logo"
                onClick={() => setView('order')}
                style={{ cursor: 'pointer' }}
            >
                COZY
            </div>
            <nav className="nav">
                <button
                    className={`nav-item ${view === 'order' ? 'active' : ''}`}
                    onClick={() => setView('order')}
                >
                    주문하기
                </button>
                <button
                    className={`nav-item ${view === 'admin' ? 'active' : ''}`}
                    onClick={() => setView('admin')}
                >
                    관리자
                </button>
            </nav>
        </header>
    );
};

export default Header;
