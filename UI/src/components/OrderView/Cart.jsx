import React from 'react';

const Cart = ({ cart, updateQuantity, totalAmount, handleOrder }) => {
    return (
        <section className="cart-section">
            <div className="cart-container">
                <div className="cart-items-wrapper">
                    <h3>주문 내역</h3>
                    <div className="cart-list">
                        {cart.length === 0 ? (
                            <p style={{ color: '#999' }}>장바구니가 비어있습니다.</p>
                        ) : (
                            cart.map(item => (
                                <div key={item.cartItemId} className="cart-item">
                                    <div className="cart-item-info">
                                        <strong>{item.name}</strong>
                                        {item.options.length > 0 && (
                                            <span className="cart-item-options">옵션: {item.options.join(', ')}</span>
                                        )}
                                    </div>
                                    <div className="cart-item-price-qty">
                                        <div className="quantity-controls">
                                            <button className="qty-btn" onClick={() => updateQuantity(item.cartItemId, -1)}>-</button>
                                            <span className="qty-value">{item.quantity}개</span>
                                            <button className="qty-btn" onClick={() => updateQuantity(item.cartItemId, 1)}>+</button>
                                        </div>
                                        <span className="item-total-price">{(item.totalItemPrice * item.quantity).toLocaleString()}원</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="cart-summary">
                    <div className="total-row">
                        <span className="total-label">총금액</span>
                        <span className="total-price">{totalAmount.toLocaleString()}원</span>
                    </div>
                    <button
                        className="btn-order"
                        disabled={cart.length === 0}
                        onClick={handleOrder}
                    >
                        주문하기
                    </button>
                </div>
            </div>
        </section>
    );
};

export default Cart;
