import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingBag, Coffee, Plus, Minus, Check } from 'lucide-react'; // 아이콘 라이브러리

/**
 * 주문하기 화면 (OrderScreen)
 * 사용자가 메뉴를 보고 옵션을 선택하여 장바구니에 담고 주문을 완료하는 모든 과정을 담당합니다.
 */
const OrderScreen = () => {
    // --- 1. 상태(State) 관리: 화면에서 변하는 데이터를 담는 상자들 ---
    const [menu, setMenu] = useState([]);      // 서버에서 가져온 전체 메뉴 리스트
    const [cart, setCart] = useState([]);      // 사용자가 장바구니에 담은 항목들
    const [showModal, setShowModal] = useState(false); // 주문 완료 성공 모달창 노출 여부
    const [selectedOptions, setSelectedOptions] = useState({}); // 현재 메뉴별로 선택된 체크박스 옵션 정보

    // --- 2. 서버 데이터 가져오기 (useEffect) ---
    // 배포 환경의 주소를 사용하고, 없으면 기본 로컬 주소를 사용합니다.
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    useEffect(() => {
        axios.get(`${API_URL}/api/menu`)
            .then(res => setMenu(res.data))
            .catch(err => console.error(err));
    }, [API_URL]);

    // --- 3. 주요 기능 로직 (함수들) ---

    /** [옵션 선택/취소 토글] 메뉴 카드 내 체크박스를 클릭했을 때 실행됩니다. */
    const toggleOption = (menuId, option) => {
        setSelectedOptions(prev => {
            const current = prev[menuId] || []; // 해당 메뉴에 선택된 기존 옵션들
            if (current.includes(option.name)) {
                // 이미 있다면 제거 (체크 해제)
                return { ...prev, [menuId]: current.filter(o => o !== option.name) };
            }
            // 없다면 추가 (체크 선택)
            return { ...prev, [menuId]: [...current, option.name] };
        });
    };

    /** [장바구니 담기] 선택한 옵션값과 함께 메뉴를 장바구니에 추가합니다. */
    const addToCart = (item) => {
        const itemOptions = selectedOptions[item.id] || [];

        // 선택한 옵션들의 추가 가격을 합산합니다.
        const optionPrice = (item.options || [])
            .filter(o => itemOptions.includes(o.name))
            .reduce((sum, o) => sum + o.price, 0);

        // 장바구니에 들어갈 아이템 객체를 생성합니다.
        const cartItem = {
            ...item,
            price: item.price + optionPrice, // 기본가 + 옵션가
            selectedOptions: itemOptions,
            cartId: `${item.id}-${itemOptions.sort().join(',')}` // 옵션이 다르면 다른 상품으로 취급하기 위한 고유 키
        };

        setCart(prev => {
            // 이미 장바구니에 똑같은 메뉴(옵션까지 동일)가 있는지 확인합니다.
            const existing = prev.find(i => i.cartId === cartItem.cartId);
            if (existing) {
                // 있다면 수량만 1 증가시킵니다.
                return prev.map(i => i.cartId === cartItem.cartId ? { ...i, quantity: i.quantity + 1 } : i);
            }
            // 없다면 장바구니 리스트의 맨 뒤에 새 아이템(수량 1개)을 추가합니다.
            return [...prev, { ...cartItem, quantity: 1 }];
        });

        // 장바구니에 담은 직후, 해당 메뉴의 옵션 선택 상태를 초기화합니다.
        setSelectedOptions(prev => ({ ...prev, [item.id]: [] }));
    };

    /** [장바구니 수량 조절] +, - 버튼을 눌렀을 때 실행됩니다. */
    const updateCartQuantity = (cartId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.cartId === cartId) {
                // 0개 미만으로 내려가지 않게 막으면서 수량을 변경합니다.
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0)); // 수량이 0개가 된 항목은 장바구니에서 삭제합니다.
    };

    /** [최종 주문하기] 서버로 주문 데이터를 전송합니다. */
    const placeOrder = () => {
        const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // 서버의 POST /api/orders 통로로 데이터를 보냅니다.
        axios.post(`${API_URL}/api/orders`, { items: cart, totalAmount })
            .then(() => {
                setCart([]); // 장바구니 비우기
                setShowModal(true); // 성공 모달 띄우기
            })
            .catch(err => alert('주문 실패: ' + err.message));
    };

    // --- 4. 화면 렌더링 (JSX) ---
    return (
        <div className="container" style={{ paddingBottom: cart.length > 0 ? '300px' : '2rem' }}>
            <div className="section-wrapper">
                <div className="section-head">
                    <div>
                        <p className="section-label">Specialty Coffee</p>
                        <h2 className="section-title">Our Premium Menu</h2>
                    </div>
                </div>

                {/* 메뉴 목록 그리드 */}
                <div className="inventory-grid">
                    {menu.map(item => (
                        <div key={item.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0', overflow: 'hidden' }}>
                            {/* 메뉴 이미지 영역 */}
                            <div style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: '#f5f5f5', overflow: 'hidden' }}>
                                {item.image_url ? (
                                    <img
                                        src={item.image_url}
                                        alt={item.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                                        className="menu-card-img"
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-cream)' }}>
                                        <Coffee size={48} color="var(--primary)" opacity={0.2} />
                                    </div>
                                )}
                            </div>

                            {/* 메뉴 정보 영역 */}
                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <h3 className="item-name" style={{ fontSize: '1.25rem' }}>{item.name}</h3>
                                    <Coffee size={20} color="var(--primary)" opacity={0.4} />
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>{item.description}</p>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '1rem' }}>{item.price.toLocaleString()}원</p>

                                    {/* 옵션 체크박스 리스트 */}
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

                                    {/* 재고 정보 */}
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
                        </div>
                    ))}
                </div>
            </div>

            {/* 하단 고정 장바구니 바 (Cart Bar) */}
            {cart.length > 0 && (
                <div className="cart-bar">
                    {/* 왼쪽: 담은 상품 목록 */}
                    <div className="cart-items-container">
                        <h3>장바구니</h3>
                        <div className="cart-items-scroll">
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
                                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--primary)', minWidth: '80px', textAlign: 'right' }}>
                                        {(item.price * item.quantity).toLocaleString()}원
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 오른쪽: 총합계 및 주문 버튼 */}
                    <div className="cart-summary">
                        <div>
                            <p>
                                <span>총금액 :</span>
                                <strong>{cart.reduce((sum, i) => sum + i.price * i.quantity, 0).toLocaleString()}원</strong>
                            </p>
                        </div>
                        <button className="btn-main" onClick={placeOrder}>
                            주문하기
                        </button>
                    </div>
                </div>
            )}

            {/* 주문 성공 시 나타나는 프리미엄 모달 */}
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
