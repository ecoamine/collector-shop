-- Seed users for E2E and local testing (password: 'password', BCrypt strength 10)
-- Password is fixed by V4__ensure_e2e_passwords.sql so login works
INSERT INTO users (username, password, role)
VALUES
    ('seller', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'SELLER'),
    ('buyer',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'BUYER')
ON CONFLICT (username) DO NOTHING;
