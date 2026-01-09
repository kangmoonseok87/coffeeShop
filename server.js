const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mock Data for Menu
let menu = [
    { id: 1, name: '아메리카노', price: 3000, category: 'Coffee', stock: 100 },
    { id: 2, name: '카페라떼', price: 3500, category: 'Coffee', stock: 50 },
    { id: 3, name: '카푸치노', price: 3800, category: 'Coffee', stock: 30 },
    { id: 4, name: '바닐라라떼', price: 4000, category: 'Coffee', stock: 40 },
    { id: 5, name: '에스프레소', price: 2500, category: 'Coffee', stock: 20 },
];

let orders = [];

// Routes
app.get('/api/menu', (req, res) => {
    res.json(menu);
});

app.post('/api/orders', (req, res) => {
    const { items, totalAmount } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ message: '주문 항목이 없습니다.' });
    }

    const newOrder = {
        id: orders.length + 1,
        items,
        totalAmount,
        status: 'pending',
        createdAt: new Date(),
    };

    orders.push(newOrder);

    // Update stock (simplification)
    items.forEach(orderItem => {
        const menuItem = menu.find(m => m.id === orderItem.id);
        if (menuItem) {
            menuItem.stock -= orderItem.quantity;
        }
    });

    res.status(201).json(newOrder);
});

app.get('/api/admin/orders', (req, res) => {
    res.json(orders);
});

app.patch('/api/admin/orders/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const order = orders.find(o => o.id === parseInt(id));

    if (!order) {
        return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    order.status = status;
    res.json(order);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
