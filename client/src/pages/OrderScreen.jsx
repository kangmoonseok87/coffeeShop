import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Coffee } from 'lucide-react';

const OrderScreen = () => {
    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:5000/api/menu')
            .then(res => setMenu(res.data))
            .catch(err => console.error(err));
    }, []);

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const placeOrder = () => {
        const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        axios.post('http://localhost:5000/api/orders', { items: cart, totalAmount })
            .then(() => {
                alert('주문이 성공적으로 완료되었습니다!');
                setCart([]);
            })
            .catch(err => alert('주문 실패: ' + err.message));
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Coffee size={32} color="#6F4E37" />
                <h2 style={{ fontSize: '2rem' }}>메뉴판</h2>
            </div>

            <div className="grid">
                {menu.map(item => (
                    <div key={item.id} className="card">
                        <h3 style={{ marginBottom: '0.5rem' }}>{item.name}</h3>
                        <p style={{ color: '#666', marginBottom: '1rem' }}>{item.price.toLocaleString()}원</p>
                        <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>남은 수량: {item.stock}</p>
                        <button className="btn" onClick={() => addToCart(item)} disabled={item.stock <= 0}>
                            {item.stock > 0 ? '장바구니 담기' : '품절'}
                        </button>
                    </div>
                ))}
            </div>

            {cart.length > 0 && (
                <div className="cart-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <ShoppingCart size={24} />
                        <h3 style={{ fontSize: '1.5rem' }}>장바구니</h3>
                    </div>
                    {cart.map(item => (
                        <div key={item.id} className="order-item">
                            <span>{item.name} x {item.quantity}</span>
                            <span>{(item.price * item.quantity).toLocaleString()}원</span>
                        </div>
                    ))}
                    <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                            총합: {cart.reduce((sum, i) => sum + i.price * i.quantity, 0).toLocaleString()}원
                        </p>
                        <button className="btn btn-accent" onClick={placeOrder}>주문하기</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderScreen;
