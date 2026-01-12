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

-- Create Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    total_amount INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Order Items table (to store items per order)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    menu_id INTEGER REFERENCES menus(id),
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL
);

-- Seed Initial Data
INSERT INTO menus (name, price, category, stock) VALUES
('아메리카노', 3000, 'Coffee', 100),
('카페라떼', 3500, 'Coffee', 50),
('카푸치노', 3800, 'Coffee', 30),
('바닐라라떼', 4000, 'Coffee', 40),
('에스프레소', 2500, 'Coffee', 20)
ON CONFLICT DO NOTHING;
