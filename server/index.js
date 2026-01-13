/**
 * 서버 메인 실행 파일 (index.js)
 * 이 파일은 Express 서버를 설정하고, 클라이언트(프론트엔드)의 요청을 처리하는 통로(API)를 정의합니다.
 */

// 1. 환경 변수 및 외부 라이브러리 불러오기
require('dotenv').config(); // .env 파일에 저장된 비밀번호나 포트 번호를 프로그램에서 사용할 수 있게 로드합니다.
const express = require('express'); // 웹 서버 기능을 제공하는 express 라이브러리를 가져옵니다.
const cors = require('cors'); // 다른 도메인(예: 3000번 포트의 프론트엔드)에서 접근할 수 있게 허용해주는 라이브러리입니다.
const db = require('./db'); // 우리가 만든 db.js 파일(데이터베이스 연결 도구)을 가져옵니다.

const app = express(); // express 앱 객체를 생성합니다.
const PORT = process.env.PORT || 5000; // 서버가 사용할 포트 번호를 결정합니다. (.env에 없으면 5000번 사용)

// 2. 미들웨어 설정 (서버가 통신할 때 거쳐가는 중간 단계)
app.use(cors()); // 위에서 가져온 CORS 설정을 적용합니다.
app.use(express.json()); // 클라이언트가 보낸 JSON 데이터를 서버가 알아들을 수 있게 변환해줍니다. (예: 장바구니 데이터)

// 3. API 라우트(통로) 정의
// [헬스 체크] 서버가 잘 작동하고 있는지 확인하는 테스트용 주소입니다.
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend server is running with DB integration' });
});

// [메뉴 조회] 전체 메뉴와 각 메뉴에 매핑된 옵션(샷 추가 등) 정보를 가공해서 가져옵니다.
app.get('/api/menu', async (req, res) => {
    try {
        // SQL 설명: 메뉴 테이블과 옵션 테이블을 합쳐서(JOIN) 하나의 리스트로 만듭니다.
        const query = `
            SELECT m.*, 
                   COALESCE(json_agg(json_build_object('id', o.id, 'name', o.name, 'price', o.price)) 
                   FILTER (WHERE o.id IS NOT NULL), '[]') as options
            FROM menus m
            LEFT JOIN options o ON m.id = o.menu_id
            GROUP BY m.id
            ORDER BY m.id ASC
        `;
        const result = await db.query(query); // 데이터베이스에 위 질문(SQL)을 보냅니다.
        res.json(result.rows); // 결과를 클라이언트(화면)에 돌려줍니다.
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '메뉴 정보를 가져오는데 실패했습니다.' });
    }
});

// [관리자 전용: 재고 수정] 특정 메뉴의 재고 수량을 강제로 변경합니다.
app.patch('/api/admin/menu/:id/stock', async (req, res) => {
    const { id } = req.params; // 주소에 포함된 메뉴 ID를 가져옵니다.
    const { stock } = req.body; // 화면에서 입력한 새로운 재고 숫자를 가져옵니다.

    try {
        const result = await db.query(
            'UPDATE menus SET stock = $1 WHERE id = $2 RETURNING *',
            [stock, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: '메뉴를 찾을 수 없습니다.' });
        }

        res.json(result.rows[0]); // 업데이트 성공한 데이터를 돌려줍니다.
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '재고 업데이트에 실패했습니다.' });
    }
});

// [주문하기] 사용자가 장바구니에 담은 내용을 실제로 주문 처리합니다.
app.post('/api/orders', async (req, res) => {
    const { items, totalAmount } = req.body; // 주문 리스트와 총 결제 금액을 받습니다.

    if (!items || items.length === 0) {
        return res.status(400).json({ message: '주문 항목이 없습니다.' });
    }

    const client = await db.pool.connect(); // DB 연결 객체를 하나 가져옵니다.

    try {
        await client.query('BEGIN'); // 트랜잭션 시작! (여러 단계가 모두 성공해야 하나로 인정됩니다)

        // 1. 주문 메인 정보 저장 (orders 테이블)
        const orderRes = await client.query(
            'INSERT INTO orders (total_amount, status) VALUES ($1, $2) RETURNING id',
            [totalAmount, '주문 접수']
        );
        const orderId = orderRes.rows[0].id; // 새로 생성된 주문번호(ID)를 가져옵니다.

        // 2. 주문한 메뉴들 하나씩 처리 (order_items 테이블)
        for (const item of items) {
            // 선택한 옵션들을 글자로 합칩니다 (예: "샷 추가, 시럽")
            const optionsText = item.selectedOptions ? item.selectedOptions.join(', ') : '';

            // 주문 상세 항목 저장
            await client.query(
                'INSERT INTO order_items (order_id, menu_id, quantity, price, selected_options) VALUES ($1, $2, $3, $4, $5)',
                [orderId, item.id, item.quantity, item.price, optionsText]
            );

            // 3. 재고 차감 (menus 테이블)
            // 현재 재고가 주문 수량보다 많을 때만 빼줍니다.
            const stockRes = await client.query(
                'UPDATE menus SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING stock',
                [item.quantity, item.id]
            );

            if (stockRes.rowCount === 0) {
                // 재고가 부족하면 오류를 발생시키고 롤백(전부 취소)합니다.
                throw new Error(`${item.name}의 재고가 부족합니다.`);
            }
        }

        await client.query('COMMIT'); // 모든 작업이 성공했으므로 최종 반영합니다.
        res.status(201).json({ id: orderId, message: '주문이 완료되었습니다.' });
    } catch (err) {
        await client.query('ROLLBACK'); // 하나라도 실패하면 이전 상태로 되돌립니다.
        console.error(err);
        res.status(500).json({ message: err.message || '주문 처리 중 오류가 발생했습니다.' });
    } finally {
        client.release(); // 사용한 DB 연결을 반납합니다.
    }
});

// [관리자용: 주문 목록 조회] 들어온 모든 주문 내역을 가져옵니다.
app.get('/api/admin/orders', async (req, res) => {
    try {
        // 복잡한 JOIN: 주문 정보와 그 상세 아이템들을 한 번에 세트로 가져옵니다.
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

        // 프론트엔드에서 읽기 편하게 데이터 형식을 조금 다듬습니다 (CamelCase 적용)
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

// [관리자용: 주문 상태 변경] 주문의 상태를 '제조 중', '제조 완료' 등으로 변경하고 취소 시 재고를 돌려줍니다.
app.patch('/api/admin/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN'); // 트랜잭션 시작

        // 1. 주문 테이블의 상태 필드 업데이트
        const updateResult = await client.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (updateResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
        }

        // 2. 만약 관리자가 주문을 '취소됨'으로 바꿨다면?
        // 고객이 뺏어간 재고를 다시 메뉴판에 돌려줘야 합니다. (자동 복구)
        if (status === '취소됨') {
            const itemsResult = await client.query(
                'SELECT menu_id, quantity FROM order_items WHERE order_id = $1',
                [id]
            );

            for (const item of itemsResult.rows) {
                // 메뉴 테이블의 재고 수량을 주문 수량만큼 다시 더해줍니다.
                await client.query(
                    'UPDATE menus SET stock = stock + $1 WHERE id = $2',
                    [item.quantity, item.menu_id]
                );
            }
        }

        await client.query('COMMIT'); // 성공 반영
        res.json(updateResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK'); // 실패 시 롤백
        console.error(err);
        res.status(500).json({ message: '주문 상태 업데이트 혹은 재고 복구에 실패했습니다.' });
    } finally {
        client.release();
    }
});

// 4. 서버 시작 (귀를 기울여 기다리기)
app.listen(PORT, () => {
    console.log(`서버가 성공적으로 실행되었습니다! : http://localhost:${PORT}`);
});
