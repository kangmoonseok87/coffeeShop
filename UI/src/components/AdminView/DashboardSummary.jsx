import React from 'react';

const DashboardSummary = ({ orders }) => {
    return (
        <section className="admin-section">
            <h2 className="admin-title">관리자 대시보드</h2>
            <div className="summary-grid">
                <div className="summary-card">
                    <span className="summary-label">총 주문 수</span>
                    <span className="summary-value">{orders.length}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">주문 접수</span>
                    <span className="summary-value">{orders.filter(o => o.status === '주문 접수').length}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">제조 중</span>
                    <span className="summary-value">{orders.filter(o => o.status === '제조 중').length}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">제조 완료</span>
                    <span className="summary-value">{orders.filter(o => o.status === '제조 완료').length}</span>
                </div>
            </div>
        </section>
    );
};

export default DashboardSummary;
