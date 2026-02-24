-- Update existing sample item to use a web image if it still has placeholder
UPDATE item_listings
SET image_url = 'https://picsum.photos/seed/collector1/600/400'
WHERE image_url IS NULL OR image_url = 'https://example.com/sample-item.png';

-- Insert extra sample items with web images
INSERT INTO item_listings (title, description, price, image_url, created_at, seller_id, category_id)
SELECT
    'Vintage Trading Card',
    'Rare collectible trading card in good condition.',
    24.99,
    'https://picsum.photos/seed/card2/600/400',
    NOW(),
    1,
    (SELECT id FROM categories WHERE name = 'Cards' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM item_listings WHERE title = 'Vintage Trading Card');

INSERT INTO item_listings (title, description, price, image_url, created_at, seller_id, category_id)
SELECT
    'Action Figure',
    'Limited edition action figure, mint in box.',
    49.99,
    'https://picsum.photos/seed/figure3/600/400',
    NOW(),
    1,
    (SELECT id FROM categories WHERE name = 'Figures' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM item_listings WHERE title = 'Action Figure');

INSERT INTO item_listings (title, description, price, image_url, created_at, seller_id, category_id)
SELECT
    'Classic Comic',
    'First edition comic book, carefully preserved.',
    89.99,
    'https://picsum.photos/seed/comic4/600/400',
    NOW(),
    1,
    (SELECT id FROM categories WHERE name = 'Comics' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM item_listings WHERE title = 'Classic Comic');
