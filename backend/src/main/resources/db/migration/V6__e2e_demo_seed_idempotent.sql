-- E2E/Demo seed: idempotent, safe on empty or existing DB.
-- Guarantees: users buyer/seller/admin (password 'password'), 1+ category, 1+ item.
-- Hash = BCrypt strength 10, matches E2ESeedPasswordTest and SecurityConfig BCryptPasswordEncoder.

-- 1. Users (buyer, seller, admin) with password 'password'
INSERT INTO users (username, password, role)
VALUES
    ('seller', '$2a$10$6Gom9nVqetRlkyEFh2FlfOr2DYVzoki5LOlTNcqN5k5uuHJgFzBNC', 'SELLER'),
    ('buyer',  '$2a$10$6Gom9nVqetRlkyEFh2FlfOr2DYVzoki5LOlTNcqN5k5uuHJgFzBNC', 'BUYER'),
    ('admin',  '$2a$10$6Gom9nVqetRlkyEFh2FlfOr2DYVzoki5LOlTNcqN5k5uuHJgFzBNC', 'ADMIN')
ON CONFLICT (username) DO UPDATE SET
    password = EXCLUDED.password,
    role     = EXCLUDED.role;

-- 2. At least one category (for seller form categoryId and catalog)
INSERT INTO categories (name)
VALUES ('Cards'), ('Figures'), ('Comics')
ON CONFLICT (name) DO NOTHING;

-- 3. At least one item in catalog (for catalog.spec.js item-title)
INSERT INTO item_listings (title, description, price, image_url, created_at, seller_id, category_id)
SELECT
    'E2E Sample Item',
    'Sample item for E2E and demo.',
    9.99,
    'https://picsum.photos/seed/e2e/600/400',
    NOW(),
    (SELECT id FROM users WHERE username = 'seller' LIMIT 1),
    (SELECT id FROM categories LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM item_listings)
  AND EXISTS (SELECT 1 FROM users WHERE username = 'seller')
  AND EXISTS (SELECT 1 FROM categories);
