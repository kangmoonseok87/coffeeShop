import { useState, useEffect } from 'react'
import './App.css'

// Components
import Header from './components/Header';
import MenuGrid from './components/OrderView/MenuGrid';
import Cart from './components/OrderView/Cart';
import DashboardSummary from './components/AdminView/DashboardSummary';
import InventoryTable from './components/AdminView/InventoryTable';
import OrderList from './components/AdminView/OrderList';
import Toast from './components/common/Toast';

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

const initialInventory = {
  1: 20, // 아메리카노 (ICE)
  2: 15, // 아메리카노 (HOT)
  3: 3,  // 카페라떼
  4: 0   // 바닐라라떼
};

function App() {
  const [menus] = useState(initialMenus);
  const [cart, setCart] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [view, setView] = useState('order'); // 'order' or 'admin'
  const [toast, setToast] = useState('');

  // Persistent States with LocalStorage
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('cozy_inventory');
    return saved ? JSON.parse(saved) : initialInventory;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('cozy_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('cozy_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('cozy_orders', JSON.stringify(orders));
  }, [orders]);

  const showToast = (message) => {
    setToast(message);
  };

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
    showToast(`${menu.name}가 담겼습니다!`);
  };

  const updateInventory = (menuId, change) => {
    setInventory(prev => ({
      ...prev,
      [menuId]: Math.max(0, prev[menuId] + change)
    }));
  };

  const updateOrderStatus = (orderId, nextStatus) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: nextStatus } : order
    ));
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
    // 1. Inventory Check
    for (const item of cart) {
      if ((inventory[item.id] || 0) < item.quantity) {
        alert(`${item.name}의 재고가 부족합니다!`);
        return;
      }
    }

    // 2. Create Order
    const newOrder = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: [...cart],
      totalAmount,
      status: '주문 접수'
    };

    // 3. Deduct Inventory
    setInventory(prev => {
      const next = { ...prev };
      cart.forEach(item => {
        next[item.id] = Math.max(0, (next[item.id] || 0) - item.quantity);
      });
      return next;
    });

    setOrders(prev => [newOrder, ...prev]);
    showToast(`총 ${totalAmount.toLocaleString()}원 주문이 완료되었습니다!`);
    setCart([]);
    setSelectedOptions({});
  };

  return (
    <div className="app-container">
      <Header view={view} setView={setView} />

      {view === 'order' ? (
        <>
          <MenuGrid
            menus={menus}
            inventory={inventory}
            selectedOptions={selectedOptions}
            handleOptionChange={handleOptionChange}
            addToCart={addToCart}
          />
          <Cart
            cart={cart}
            updateQuantity={updateQuantity}
            totalAmount={totalAmount}
            handleOrder={handleOrder}
          />
        </>
      ) : (
        <div className="admin-container">
          <DashboardSummary orders={orders} />
          <InventoryTable
            menus={menus}
            inventory={inventory}
            updateInventory={updateInventory}
          />
          <OrderList
            orders={orders}
            updateOrderStatus={updateOrderStatus}
          />
        </div>
      )}

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
}

export default App
