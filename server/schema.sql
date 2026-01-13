-- Drop tables if they exist to ensure clean schema update
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS options CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menus CASCADE;

-- Create Menus table
CREATE TABLE IF NOT EXISTS menus (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL,
    category VARCHAR(50),
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    description TEXT
);

-- Create Options table
CREATE TABLE IF NOT EXISTS options (
    id SERIAL PRIMARY KEY,
    menu_id INTEGER REFERENCES menus(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    price INTEGER DEFAULT 0
);

-- Create Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    total_amount INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT '주문 접수',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    menu_id INTEGER REFERENCES menus(id),
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL,
    selected_options TEXT -- 추가된 옵션 정보 저장을 위해 (JSON 또는 구분자 문자열)
);

-- Seed Initial Data
TRUNCATE menus, options, orders, order_items RESTART IDENTITY CASCADE;

INSERT INTO menus (name, price, category, stock, image_url, description) VALUES
('아메리카노', 3000, 'Coffee', 100, '/americano.png', '진한 에스프레소와 물의 깔끔한 조화'),
('카페라떼', 3500, 'Coffee', 50, '/latte.png', '부드러운 우유와 에스프레소가 만난 고소한 맛'),
('카푸치노', 3800, 'Coffee', 30, '/cappuccino.png', '풍부한 우유 거품과 시나몬 가루의 완벽한 조화'),
('바닐라라떼', 4000, 'Coffee', 40, '/vanilla_latte.png', '달콤한 바닐라 시럽이 더해진 부드러운 라떼'),
('에스프레소', 2500, 'Coffee', 20, '/espresso.png', '커피의 본연의 맛을 가장 진하게 느낄 수 있는 기본 추출 커피');

-- 옵션 데이터 추가
INSERT INTO options (menu_id, name, price)
SELECT id, '샷 추가', 500 FROM menus WHERE name IN ('아메리카노', '카페라떼', '카푸치노', '바닐라라떼');

INSERT INTO options (menu_id, name, price)
SELECT id, '시럽 추가', 0 FROM menus WHERE name IN ('아메리카노', '카페라떼', '바닐라라떼');

