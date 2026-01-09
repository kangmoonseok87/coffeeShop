import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package } from 'lucide-react';

const AdminScreen = () => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000); // 5초마다 갱신
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = () => {
        axios.get('http://localhost:5000/api/admin/orders')
            .then(res => setOrders(res.data))
            .catch(err => console.error(err));
    };

    const updateStatus = (id, status) => {
        axios.patch(`http://localhost:5000/api/admin/orders/${id}`, { status })
            .then(() => fetchOrders())
            .catch(err => alert('상태 업데이트 실패: ' + err.message));
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Package size={32} color="#6F4E37" />
                <h2 style={{ fontSize: '2rem' }}>주문 관리 (관리자)</h2>
            </div>

            <div className="grid">
                {orders.map(order => (
                    <div key={order.id} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <strong>주문 #{order.id}</strong>
                            <span className={`badge badge-${order.status}`}>{order.status}</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                            {order.items.map(i => `${i.name} x ${i.quantity}`).join(', ')}
                        </div>
                        <p style={{ fontWeight: 'bold', marginBottom: '1rem' }}>
                            총합: {order.totalAmount.toLocaleString()}원
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-accent" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                onClick={() => updateStatus(order.id, 'completed')}>완료</button>
                            <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#ccc', color: '#333' }}
                                onClick={() => updateStatus(order.id, 'cancelled')}>취소</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminScreen;
