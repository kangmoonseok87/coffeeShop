-- [데이터베이스 초기화]
-- 기존에 테이블이 있다면 삭제합니다 (새로운 설정을 적용하기 위해 청소하는 단계입니다).
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS options CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menus CASCADE;

-- 1. 메뉴 테이블 (커피 메뉴의 기본 정보)
CREATE TABLE IF NOT EXISTS menus (
    id SERIAL PRIMARY KEY,            -- 고유 번호 (자동으로 1, 2, 3... 증가)
    name VARCHAR(100) NOT NULL,       -- 메뉴 이름 (예: 아메리카노)
    price INTEGER NOT NULL,            -- 가격
    category VARCHAR(50),             -- 카테고리 (Coffee, Desert 등)
    stock INTEGER DEFAULT 0,          -- 현재 남은 재고 수량
    image_url TEXT,                   -- 메뉴 이미지 경로
    description TEXT                  -- 메뉴에 대한 친절한 설명
);

-- 2. 옵션 테이블 (샷 추가, 시럽 등 메뉴에 딸린 추가 사항)
CREATE TABLE IF NOT EXISTS options (
    id SERIAL PRIMARY KEY,
    menu_id INTEGER REFERENCES menus(id) ON DELETE CASCADE, -- 어떤 메뉴의 옵션인지 연결
    name VARCHAR(50) NOT NULL,        -- 옵션 명칭
    price INTEGER DEFAULT 0           -- 옵션 추가 금액
);

-- 3. 주문 테이블 (주문 전체의 요약 정보)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    total_amount INTEGER NOT NULL,     -- 총 결제 금액
    status VARCHAR(20) DEFAULT '주문 접수', -- 상태 (주문 접수 -> 제조 중 -> 제조 완료 -> 취소됨)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 주문 시각 (자동 기록)
);

-- 4. 주문 상세 항목 테이블 (한 주문 안에 어떤 메뉴들을 담았는지 기록)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE, -- 어떤 주문에 속하는지
    menu_id INTEGER REFERENCES menus(id),                     -- 어떤 메뉴를 주문했는지
    quantity INTEGER NOT NULL,                                -- 몇 개 주문했는지
    price INTEGER NOT NULL,                                   -- 주문 당시의 가격
    selected_options TEXT                                     -- 선택한 옵션들 (예: "샷 추가, 시럽")
);

-- [초기 데이터 입력]
-- 테이블을 깨끗이 비우고 기본 메뉴 데이터들을 채워넣습니다.
TRUNCATE menus, options, orders, order_items RESTART IDENTITY CASCADE;

-- 기본 메뉴 입력
INSERT INTO menus (name, price, category, stock, image_url, description) VALUES
('아메리카노', 3000, 'Coffee', 100, '/americano.png', '진한 에스프레소와 물의 깔끔한 조화'),
('카페라떼', 3500, 'Coffee', 50, '/latte.png', '부드러운 우유와 에스프레소가 만난 고소한 맛'),
('카푸치노', 3800, 'Coffee', 30, '/cappuccino.png', '풍부한 우유 거품과 시나몬 가루의 완벽한 조화'),
('바닐라라떼', 4000, 'Coffee', 40, '/vanilla_latte.png', '달콤한 바닐라 시럽이 더해진 부드러운 라떼'),
('에스프레소', 2500, 'Coffee', 20, '/espresso.png', '커피의 본연의 맛을 가장 진하게 느낄 수 있는 기본 추출 커피');

-- 메뉴별 기본 옵션 연결
INSERT INTO options (menu_id, name, price)
SELECT id, '샷 추가', 500 FROM menus WHERE name IN ('아메리카노', '카페라떼', '카푸치노', '바닐라라떼');

INSERT INTO options (menu_id, name, price)
SELECT id, '시럽 추가', 0 FROM menus WHERE name IN ('아메리카노', '카페라떼', '바닐라라떼');

