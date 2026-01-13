import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingBag, Coffee, Plus, Minus, Check } from 'lucide-react';

const OrderScreen = () => {
    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState([]);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        axios.get('http://localhost:3001/api/menu')
            .then(res => setMenu(res.data))
            .catch(err => console.error(err));
    }, []);

    const [selectedOptions, setSelectedOptions] = useState({}); // { menuId: [optionName, ...] }

    const toggleOption = (menuId, option) => {
        setSelectedOptions(prev => {
            const current = prev[menuId] || [];
            if (current.includes(option.name)) {
                return { ...prev, [menuId]: current.filter(o => o !== option.name) };
            }
            return { ...prev, [menuId]: [...current, option.name] };
        });
    };

    const addToCart = (item) => {
        const itemOptions = selectedOptions[item.id] || [];
        const optionPrice = (item.options || [])
            .filter(o => itemOptions.includes(o.name))
            .reduce((sum, o) => sum + o.price, 0);

        const cartItem = {
            ...item,
            price: item.price + optionPrice,
            selectedOptions: itemOptions,
            cartId: `${item.id}-${itemOptions.sort().join(',')}` // 옵션 조합별 유니크 키
        };

        setCart(prev => {
            const existing = prev.find(i => i.cartId === cartItem.cartId);
            if (existing) {
                return prev.map(i => i.cartId === cartItem.cartId ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...cartItem, quantity: 1 }];
        });

        // 옵션 선택 초기화
        setSelectedOptions(prev => ({ ...prev, [item.id]: [] }));
    };

    const updateCartQuantity = (cartId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.cartId === cartId) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const placeOrder = () => {
        const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        axios.post('http://localhost:3001/api/orders', { items: cart, totalAmount })
            .then(() => {
                setCart([]);
                setShowModal(true);
            })
            .catch(err => alert('주문 실패: ' + err.message));
    };

    return (
        <div className="container" style={{ paddingBottom: cart.length > 0 ? '300px' : '2rem' }}>
            <div className="section-wrapper">
                <div className="section-head">
                    <div>
                        <p className="section-label">Specialty Coffee</p>
                        <h2 className="section-title">Our Premium Menu</h2>
                    </div>
                </div>

                <div className="inventory-grid">
                    {menu.map(item => (
                        <div key={item.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <h3 className="item-name" style={{ fontSize: '1.25rem' }}>{item.name}</h3>
                                <Coffee size={20} color="var(--primary)" opacity={0.4} />
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>{item.description}</p>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '1rem' }}>{item.price.toLocaleString()}원</p>

                                {item.options && item.options.length > 0 && (
                                    <div style={{ background: 'rgba(61, 43, 31, 0.03)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '1px' }}>Options</p>
                                        {item.options.map(opt => (
                                            <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '0.4rem', cursor: 'pointer', fontWeight: '500' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={(selectedOptions[item.id] || []).includes(opt.name)}
                                                    onChange={() => toggleOption(item.id, opt)}
                                                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                                />
                                                {opt.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{opt.price > 0 ? `(+${opt.price.toLocaleString()}원)` : ''}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: item.stock < 5 ? '#e53935' : 'var(--text-muted)' }}>
                                        {item.stock === 0 ? '품절' : `재고: ${item.stock}개`}
                                    </span>
                                </div>
                            </div>

                            <button
                                className="btn-main"
                                onClick={() => addToCart(item)}
                                disabled={item.stock <= 0}
                                style={{ width: '100%', fontSize: '0.95rem' }}
                            >
                                {item.stock > 0 ? '장바구니 담기' : '잠시 품절'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Cart Bar - Fixed Footer Style to avoid overlapping */}
            {cart.length > 0 && (
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(25px)', borderRadius: '32px 32px 0 0', padding: '2rem 10%',
                    boxShadow: '0 -10px 40px rgba(0,0,0,0.1)', borderTop: '1px solid rgba(61,43,31,0.08)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1000
                }}>
                    {/* Left: Cart Title & Items (Vertical) */}
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '1.5rem', letterSpacing: '-0.5px' }}>장바구니</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '1rem' }}>
                            {cart.map(item => (
                                <div key={item.cartId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                        <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                                            {item.name}
                                            {item.selectedOptions.length > 0 && (
                                                <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '0.9rem' }}>
                                                    {' '}({item.selectedOptions.join(', ')})
                                                </span>
                                            )}
                                            <span style={{ color: 'var(--accent)', marginLeft: '0.5rem' }}>x {item.quantity}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                                            <button onClick={() => updateCartQuantity(item.cartId, -1)} className="ctrl-btn" style={{ width: '22px', height: '22px', borderRadius: '5px', fontSize: '0.8rem' }}><Minus size={10} /></button>
                                            <button onClick={() => updateCartQuantity(item.cartId, 1)} className="ctrl-btn" style={{ width: '22px', height: '22px', borderRadius: '5px', fontSize: '0.8rem' }}><Plus size={10} /></button>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--primary)', minWidth: '100px', textAlign: 'right' }}>
                                        {(item.price * item.quantity).toLocaleString()}원
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Total & Order Button (Vertical) */}
                    <div style={{ marginLeft: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%', minHeight: '120px' }}>
                        <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                            <p style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-muted)', marginRight: '0.5rem' }}>총금액 :</span>
                                {cart.reduce((sum, i) => sum + i.price * i.quantity, 0).toLocaleString()}원
                            </p>
                        </div>
                        <button className="btn-main" style={{ padding: '1.2rem 4rem', borderRadius: '15px', fontSize: '1.1rem', width: '100%', minWidth: '240px' }} onClick={placeOrder}>
                            주문하기
                        </button>
                    </div>
                </div>
            )}
            {/* Premium Success Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="success-icon">
                            <Check size={40} strokeWidth={3} />
                        </div>
                        <h3 className="modal-title">주문 완료!</h3>
                        <p className="modal-desc">
                            맛있는 커피를 정성껏 준비 중입니다.<br />
                            잠시만 기다려 주세요.
                        </p>
                        <button className="btn-main" style={{ width: '100%' }} onClick={() => setShowModal(false)}>
                            확인
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderScreen;
