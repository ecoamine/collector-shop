CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS item_listings (
    id           BIGSERIAL PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    description  TEXT,
    price        NUMERIC(10, 2) NOT NULL,
    image_url    VARCHAR(500),
    created_at   TIMESTAMPTZ   NOT NULL,
    seller_id    BIGINT        NOT NULL,
    category_id  BIGINT        NOT NULL REFERENCES categories (id)
);

INSERT INTO categories (name)
VALUES ('Cards'),
       ('Figures'),
       ('Comics')
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_listings (title, description, price, image_url, created_at, seller_id, category_id)
SELECT
    'Sample Item',
    'Sample collectible item for initial data.',
    9.99,
    'https://example.com/sample-item.png',
    NOW(),
    1,
    (SELECT id FROM categories WHERE name = 'Cards' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM item_listings);

