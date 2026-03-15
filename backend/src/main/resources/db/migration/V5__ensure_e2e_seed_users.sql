-- Guarantees E2E users exist with password 'password' (BCrypt strength 10).
-- Idempotent: run on every env (Docker/CI) so login and E2E tests always work.
-- Hash must match E2ESeedPasswordTest and backend BCrypt(10).
INSERT INTO users (username, password, role)
VALUES
    ('seller', '$2a$10$6Gom9nVqetRlkyEFh2FlfOr2DYVzoki5LOlTNcqN5k5uuHJgFzBNC', 'SELLER'),
    ('buyer',  '$2a$10$6Gom9nVqetRlkyEFh2FlfOr2DYVzoki5LOlTNcqN5k5uuHJgFzBNC', 'BUYER'),
    ('admin',  '$2a$10$6Gom9nVqetRlkyEFh2FlfOr2DYVzoki5LOlTNcqN5k5uuHJgFzBNC', 'ADMIN')
ON CONFLICT (username) DO UPDATE SET
    password = EXCLUDED.password,
    role     = EXCLUDED.role;
