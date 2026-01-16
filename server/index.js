/**
 * 서버 메인 실행 파일 (index.js)
 * 이 파일은 Express 서버를 설정하고, 클라이언트(프론트엔드)의 요청을 처리하는 통로(API)를 정의합니다.
 */

// 1. 환경 변수 및 외부 라이브러리 불러오기
require('dotenv').config(); // .env 파일에 저장된 비밀번호나 포트 번호를 프로그램에서 사용할 수 있게 로드합니다.
const express = require('express'); // 웹 서버 기능을 제공하는 express 라이브러리를 가져옵니다.
const cors = require('cors'); // 다른 도메인(예: 3000번 포트의 프론트엔드)에서 접근할 수 있게 허용해주는 라이브러리입니다.
const db = require('./db'); // 우리가 만든 db.js 파일(데이터베이스 연결 도구)을 가져옵니다.
const bcrypt = require('bcryptjs'); // 비밀번호 암호화 및 비교를 위한 라이브러리입니다.
const jwt = require('jsonwebtoken'); // 인증을 위한 토큰(JWT) 생성 및 검증 라이브러리입니다.
const { verifyToken, isAdmin, isManager } = require('./authMiddleware'); // 인증 및 권한 검증 미들웨어입니다.
const multer = require('multer'); // 파일 업로드를 처리하는 라이브러리입니다.
const path = require('path'); // 경로 처리를 위한 Node.js 기본 모듈입니다.


const app = express(); // express 앱 객체를 생성합니다.
const PORT = process.env.PORT || 5000; // 서버가 사용할 포트 번호를 결정합니다. (.env에 없으면 5000번 사용)

// 2. 미들웨어 설정
// CORS: 브라우저에서 다른 도메인의 주소로 요청을 보낼 수 있게 허용해줍니다.
// 배포 환경에서는 모든 도메인을 허용하거나 특정 도메인만 고정할 수 있습니다.
app.use(cors());
app.use(express.json()); // 요청 본문의 JSON 데이터를 해석해줍니다.

// Multer 설정: 이미지 파일 업로드 처리
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../client/public/uploads')); // 업로드된 파일 저장 위치
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName); // 고유한 파일명 생성
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 최대 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('이미지 파일만 업로드 가능합니다 (jpeg, jpg, png, webp).'));
    }
});

// 3. API 라우트(통로) 정의
// [헬스 체크] 서버가 잘 작동하고 있는지 확인하는 테스트용 주소입니다.
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend server is running with DB integration' });
});

// [로그인] 사용자 인증 후 토큰을 발급합니다.
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. 사용자 조회 (권한 정보 포함)
        const query = `
            SELECT u.*, r.name as role
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.username = $1
        `;
        const result = await db.query(query, [username]);

        if (result.rowCount === 0) {
            return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }

        const user = result.rows[0];

        // 2. 비밀번호 확인
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }

        // 3. JWT 토큰 생성
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, role_id: user.role_id },
            process.env.JWT_SECRET || 'your_default_jwt_secret',
            { expiresIn: '1d' } // 토큰 유효 기간: 1일
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                role_id: user.role_id
            }
        });
    } catch (err) {
        console.error('로그인 실패:', err);
        res.status(500).json({ message: '로그인 도중 서버 오류가 발생했습니다.' });
    }
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
        console.error('메뉴 로딩 실패:', err);
        res.status(500).json({
            message: '메뉴 정보를 가져오는데 실패했습니다.',
            error: err.message // 원인 파악을 위해 상세 에러 메시지 포함
        });
    }
});

// [관리자 전용: 이미지 업로드] 메뉴 이미지를 업로드하고 URL을 반환합니다.
app.post('/api/admin/upload', verifyToken, isManager, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
        }
        // 클라이언트에서 접근 가능한 상대 경로 반환
        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ imageUrl });
    } catch (err) {
        console.error('이미지 업로드 실패:', err);
        res.status(500).json({ message: '이미지 업로드에 실패했습니다.' });
    }
});

// [관리자 전용: 메뉴 추가] 새로운 메뉴와 옵션을 등록합니다.
app.post('/api/admin/menu', verifyToken, isManager, async (req, res) => {
    const { name, price, category, stock, image_url, description, options } = req.body;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. 메뉴 추가
        const menuResult = await client.query(
            'INSERT INTO menus (name, price, category, stock, image_url, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, price, category || 'Coffee', stock || 0, image_url, description]
        );
        const menuId = menuResult.rows[0].id;

        // 2. 옵션 추가 (있는 경우)
        if (options && options.length > 0) {
            for (const option of options) {
                await client.query(
                    'INSERT INTO options (menu_id, name, price) VALUES ($1, $2, $3)',
                    [menuId, option.name, option.price || 0]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json(menuResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('메뉴 추가 실패:', err);
        res.status(500).json({ message: '메뉴 추가에 실패했습니다.' });
    } finally {
        client.release();
    }
});

// [관리자 전용: 메뉴 수정] 기존 메뉴 정보와 옵션을 수정합니다.
app.patch('/api/admin/menu/:id', verifyToken, isManager, async (req, res) => {
    const { id } = req.params;
    const { name, price, category, stock, image_url, description, options } = req.body;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. 메뉴 정보 수정
        const menuResult = await client.query(
            'UPDATE menus SET name = $1, price = $2, category = $3, stock = $4, image_url = $5, description = $6 WHERE id = $7 RETURNING *',
            [name, price, category, stock, image_url, description, id]
        );

        if (menuResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: '메뉴를 찾을 수 없습니다.' });
        }

        // 2. 기존 옵션 삭제 후 새로 추가
        await client.query('DELETE FROM options WHERE menu_id = $1', [id]);
        if (options && options.length > 0) {
            for (const option of options) {
                await client.query(
                    'INSERT INTO options (menu_id, name, price) VALUES ($1, $2, $3)',
                    [id, option.name, option.price || 0]
                );
            }
        }

        await client.query('COMMIT');
        res.json(menuResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('메뉴 수정 실패:', err);
        res.status(500).json({ message: '메뉴 수정에 실패했습니다.' });
    } finally {
        client.release();
    }
});

// [관리자 전용: 메뉴 삭제] 메뉴와 관련된 옵션을 삭제합니다 (CASCADE로 자동 삭제됨).
app.delete('/api/admin/menu/:id', verifyToken, isManager, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM menus WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: '메뉴를 찾을 수 없습니다.' });
        }
        res.json({ message: '메뉴가 삭제되었습니다.' });
    } catch (err) {
        console.error('메뉴 삭제 실패:', err);
        res.status(500).json({ message: '메뉴 삭제에 실패했습니다.' });
    }
});

// [관리자 전용: 재고 수정] 특정 메뉴의 재고 수량을 강제로 변경합니다.
app.patch('/api/admin/menu/:id/stock', verifyToken, isManager, async (req, res) => {
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
app.get('/api/admin/orders', verifyToken, isManager, async (req, res) => {
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
app.patch('/api/admin/orders/:id', verifyToken, isManager, async (req, res) => {
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

// [관리자 전용: 사용자 목록 조회]
app.get('/api/admin/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.username, u.created_at, r.name as role, r.id as role_id
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.id ASC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '사용자 목록을 가져오는데 실패했습니다.' });
    }
});

// [관리자 전용: 권한 목록 조회]
app.get('/api/admin/roles', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM roles ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '권한 목록을 가져오는데 실패했습니다.' });
    }
});

// [관리자 전용: 사용자 추가]
app.post('/api/admin/users', verifyToken, isAdmin, async (req, res) => {
    const { username, password, role_id } = req.body;

    try {
        const password_hash = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (username, password_hash, role_id) VALUES ($1, $2, $3) RETURNING id, username',
            [username, password_hash, role_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // 고유 제약 조건 위반 (username 중복)
            return res.status(400).json({ message: '이미 존재하는 사용자 이름입니다.' });
        }
        res.status(500).json({ message: '사용자 추가에 실패했습니다.' });
    }
});

// [관리자 전용: 사용자 정보 수정]
app.patch('/api/admin/users/:id', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { password, role_id } = req.body;

    try {
        // 자기 자신의 권한(Role)을 수정하려고 하면 막습니다 (실수로 관리자가 권한을 잃는 것 방지)
        // 단, 비밀번호 변경은 허용할 수 있습니다.
        if (parseInt(id) === req.user.id && role_id !== undefined && role_id !== req.user.role_id) {
            // 현재 간단한 구현을 위해 자신의 역할 변경은 일단 막습니다.
            // 필요하다면 조회 후 role이 바뀌는지 체크하는 로직 추가 가능.
        }

        let query = 'UPDATE users SET ';
        const values = [];
        let paramIndex = 1;

        if (password) {
            const password_hash = await bcrypt.hash(password, 10);
            query += `password_hash = $${paramIndex++}, `;
            values.push(password_hash);
        }

        if (role_id) {
            query += `role_id = $${paramIndex++}, `;
            values.push(role_id);
        }

        // 변경할 내용이 없으면 에러 혹은 그대로 리턴
        if (values.length === 0) {
            return res.status(400).json({ message: '수정할 내용이 없습니다.' });
        }

        // 마지막 콤마 제거 및 WHERE 절 추가
        query = query.slice(0, -2);
        query += ` WHERE id = $${paramIndex} RETURNING id, username, role_id`;
        values.push(id);

        const result = await db.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '사용자 정보 수정에 실패했습니다.' });
    }
});

// [관리자 전용: 사용자 삭제]
app.delete('/api/admin/users/:id', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // 자기 자신은 삭제할 수 없게 방어
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: '자기 자신은 삭제할 수 없습니다.' });
        }

        const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        res.json({ message: '사용자가 삭제되었습니다.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '사용자 삭제에 실패했습니다.' });
    }
});

// 4. 서버 시작 (귀를 기울여 기다리기)
app.listen(PORT, () => {
    console.log(`서버가 성공적으로 실행되었습니다! : http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('서버 실행 중 오류 발생:', err);
});
