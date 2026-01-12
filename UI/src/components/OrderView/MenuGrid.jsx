import React from 'react';

const MenuGrid = ({ menus, inventory, selectedOptions, handleOptionChange, addToCart }) => {
    return (
        <main className="menu-grid">
            {menus.map(menu => {
                const count = inventory[menu.id] || 0;
                const isSoldOut = count === 0;

                return (
                    <div key={menu.id} className={`menu-card ${isSoldOut ? 'sold-out' : ''}`}>
                        <div className="menu-image-container">
                            <img src={menu.image} alt={menu.name} className="menu-image" />
                            {isSoldOut && <div className="sold-out-overlay">품절</div>}
                        </div>
                        <div className="menu-info">
                            <h3 className="menu-name">{menu.name}</h3>
                            <p className="menu-price">{menu.price.toLocaleString()}원</p>
                            <p className="menu-desc">{menu.description}</p>

                            <div className="options">
                                {menu.options.map(opt => (
                                    <label key={opt.id} className="option-item">
                                        <input
                                            type="checkbox"
                                            disabled={isSoldOut}
                                            checked={(selectedOptions[menu.id] || []).includes(opt.id)}
                                            onChange={() => handleOptionChange(menu.id, opt.id)}
                                        />
                                        {opt.name} (+{opt.price.toLocaleString()}원)
                                    </label>
                                ))}
                            </div>

                            <button
                                className="btn-add"
                                onClick={() => addToCart(menu)}
                                disabled={isSoldOut}
                            >
                                {isSoldOut ? '품절' : '담기'}
                            </button>
                        </div>
                    </div>
                );
            })}
        </main>
    );
};

export default MenuGrid;
