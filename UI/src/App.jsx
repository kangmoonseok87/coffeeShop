import { useState } from 'react'
import './App.css'

const initialMenus = [
  {
    id: 1,
    name: '아메리카노 (ICE)',
    price: 4000,
    image: '/ice-americano.png',
    description: '깔끔하고 시원한 COZY의 시그니처 아메리카노',
    options: [
      { id: 'shot', name: '샷 추가', price: 500 },
      { id: 'syrup', name: '시럽 추가', price: 0 }
    ]
  },
  {
    id: 2,
    name: '아메리카노 (HOT)',
    price: 4000,
    image: '/hot-americano.png',
    description: '깊고 진한 풍미의 따뜻한 아메리카노',
    options: [
      { id: 'shot', name: '샷 추가', price: 500 },
      { id: 'syrup', name: '시럽 추가', price: 0 }
    ]
  },
  {
    id: 3,
    name: '카페라떼',
    price: 4500,
    image: '/cafe-latte.png',
    description: '부드러운 우유와 에스프레소의 완벽한 조화',
    options: [
      { id: 'shot', name: '샷 추가', price: 500 },
      { id: 'syrup', name: '시럽 추가', price: 0 }
    ]
  },
  {
    id: 4,
    name: '바닐라라떼',
    price: 5000,
    image: '/vanilla-latte.png',
    description: '달콤한 바닐라 향이 가득한 라떼',
    options: [
      { id: 'shot', name: '샷 추가', price: 500 },
      { id: 'syrup', name: '시럽 추가', price: 0 }
    ]
  }
];

function App() {
  const [menus] = useState(initialMenus);
  const [cart, setCart] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});

  const handleOptionChange = (menuId, optionId) => {
    setSelectedOptions(prev => {
      const currentMenuOptions = prev[menuId] || [];
      if (currentMenuOptions.includes(optionId)) {
        return { ...prev, [menuId]: currentMenuOptions.filter(id => id !== optionId) };
      } else {
        return { ...prev, [menuId]: [...currentMenuOptions, optionId] };
      }
    });
  };

  const addToCart = (menu) => {
    const activeOptions = selectedOptions[menu.id] || [];
    const optionNames = menu.options
      .filter(opt => activeOptions.includes(opt.id))
      .map(opt => opt.name);

    const optionPrice = menu.options
      .filter(opt => activeOptions.includes(opt.id))
      .reduce((acc, curr) => acc + curr.price, 0);

    // 메뉴 ID와 정렬된 옵션 ID들을 조합하여 유니크한 키 생성 (중복 체크용)
    const cartItemId = `${menu.id}-${activeOptions.sort().join('-')}`;

    setCart(prev => {
      const existingItem = prev.find(item => item.cartItemId === cartItemId);
      if (existingItem) {
        // 이미 같은 메뉴(옵션 포함)가 있으면 수량만 증가
        return prev.map(item =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // 없으면 새로 추가
        return [...prev, {
          cartItemId,
          id: menu.id,
          name: menu.name,
          basePrice: menu.price,
          optionPrice,
          totalItemPrice: menu.price + optionPrice,
          options: optionNames,
          quantity: 1
        }];
      }
    });
  };

  const updateQuantity = (cartItemId, change) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.cartItemId === cartItemId) {
          const newQuantity = Math.max(0, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0); // 수량이 0이면 장바구니에서 제거
    });
  };

  const totalAmount = cart.reduce((acc, curr) => acc + (curr.totalItemPrice * curr.quantity), 0);

  const handleOrder = () => {
    alert(`총 ${totalAmount.toLocaleString()}원 주문이 완료되었습니다!`);
    setCart([]);
    setSelectedOptions({});
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">COZY</div>
        <nav className="nav">
          <a href="#" className="nav-item active">주문하기</a>
          <a href="#" className="nav-item">관리자</a>
        </nav>
      </header>

      <main className="menu-grid">
        {menus.map(menu => (
          <div key={menu.id} className="menu-card">
            <div className="menu-image-container">
              <img src={menu.image} alt={menu.name} className="menu-image" />
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
                      checked={(selectedOptions[menu.id] || []).includes(opt.id)}
                      onChange={() => handleOptionChange(menu.id, opt.id)}
                    />
                    {opt.name} (+{opt.price.toLocaleString()}원)
                  </label>
                ))}
              </div>

              <button className="btn-add" onClick={() => addToCart(menu)}>
                담기
              </button>
            </div>
          </div>
        ))}
      </main>

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
    </div>
  )
}

export default App
