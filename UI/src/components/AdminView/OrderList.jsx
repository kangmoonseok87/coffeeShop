import React from 'react';

const OrderList = ({ orders, updateOrderStatus }) => {
    return (
        <section className="admin-section">
            <h2 className="admin-title">주문 현황</h2>
            <div className="order-list">
                {orders.length === 0 ? (
                    <p className="no-orders" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>접수된 주문이 없습니다.</p>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="admin-order-card">
                            <div className="order-header">
                                <span className="order-time">{order.date} {order.time}</span>
                                <span className={`order-status-tag ${order.status === '제조 완료' ? 'done' : ''}`}>{order.status}</span>
                            </div>
                            <div className="order-content">
                                <div className="order-items">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="order-item-row">
                                            <span>{item.name} {item.options.length > 0 ? `(${item.options.join(', ')})` : ''} - {item.quantity}개</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="order-footer">
                                    <span className="order-total">금액: {order.totalAmount.toLocaleString()}원</span>
                                    {order.status === '주문 접수' && (
                                        <button className="btn-transition" onClick={() => updateOrderStatus(order.id, '제조 중')}>제조 시작</button>
                                    )}
                                    {order.status === '제조 중' && (
                                        <button className="btn-transition finish" onClick={() => updateOrderStatus(order.id, '제조 완료')}>제조 완료</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};

export default OrderList;
