require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend server is running with DB integration' });
});

// 1. Get Menu with Options
app.get('/api/menu', async (req, res) => {
    try {
        const query = `
            SELECT m.*, 
                   COALESCE(json_agg(json_build_object('id', o.id, 'name', o.name, 'price', o.price)) 
                   FILTER (WHERE o.id IS NOT NULL), '[]') as options
            FROM menus m
            LEFT JOIN options o ON m.id = o.menu_id
            GROUP BY m.id
            ORDER BY m.id ASC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '메뉴 정보를 가져오는데 실패했습니다.' });
    }
});

// 1-1. Update Menu Stock (Admin Only)
app.patch('/api/admin/menu/:id/stock', async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;

    try {
        const result = await db.query(
            'UPDATE menus SET stock = $1 WHERE id = $2 RETURNING *',
            [stock, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: '메뉴를 찾을 수 없습니다.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '재고 업데이트에 실패했습니다.' });
    }
});

// 2. Place Order
app.post('/api/orders', async (req, res) => {
    const { items, totalAmount } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: '주문 항목이 없습니다.' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // Insert into orders table
        const orderRes = await client.query(
            'INSERT INTO orders (total_amount, status) VALUES ($1, $2) RETURNING id',
            [totalAmount, '주문 접수']
        );
        const orderId = orderRes.rows[0].id;

        // Process each item
        for (const item of items) {
            // Options as a string or JSON (PRD 5.1/5.2)
            const optionsText = item.selectedOptions ? item.selectedOptions.join(', ') : '';

            // Insert into order_items
            await client.query(
                'INSERT INTO order_items (order_id, menu_id, quantity, price, selected_options) VALUES ($1, $2, $3, $4, $5)',
                [orderId, item.id, item.quantity, item.price, optionsText]
            );

            // Update stock in menus table
            const stockRes = await client.query(
                'UPDATE menus SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING stock',
                [item.quantity, item.id]
            );

            if (stockRes.rowCount === 0) {
                throw new Error(`${item.name}의 재고가 부족합니다.`);
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ id: orderId, message: '주문이 완료되었습니다.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: err.message || '주문 처리 중 오류가 발생했습니다.' });
    } finally {
        client.release();
    }
});

// 3. Get Admin Orders
app.get('/api/admin/orders', async (req, res) => {
    try {
        // Use a join to get order items for each order
        const query = `
            SELECT o.*, 
                   json_agg(json_build_object(
                       'id', m.id, 
                       'name', m.name, 
                       'quantity', oi.quantity, 
                       'price', oi.price,
                       'selectedOptions', oi.selected_options
                   )) as items
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN menus m ON oi.menu_id = m.id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `;
        const result = await db.query(query);

        // Match the frontend's expected totalAmount camelCase
        const formattedOrders = result.rows.map(row => ({
            id: row.id,
            totalAmount: row.total_amount,
            status: row.status,
            createdAt: row.created_at,
            items: row.items
        }));

        res.json(formattedOrders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '주문 목록을 가져오는데 실패했습니다.' });
    }
});

// 4. Update Order Status (PRD Progress flow + Restocking for Cancellation)
app.patch('/api/admin/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // '제조 중', '제조 완료', '취소됨'

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. 상태 업데이트
        const updateResult = await client.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (updateResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
        }

        // 2. 만약 상태가 '취소됨'이라면 재고 복구 로직 실행
        if (status === '취소됨') {
            const itemsResult = await client.query(
                'SELECT menu_id, quantity FROM order_items WHERE order_id = $1',
                [id]
            );

            for (const item of itemsResult.rows) {
                await client.query(
                    'UPDATE menus SET stock = stock + $1 WHERE id = $2',
                    [item.quantity, item.menu_id]
                );
            }
        }

        await client.query('COMMIT');
        res.json(updateResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: '주문 상태 업데이트 혹은 재고 복구에 실패했습니다.' });
    } finally {
        client.release();
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
