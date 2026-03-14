-- Ensure E2E users always have password 'password' (BCrypt strength 10)
-- Fixes DBs where seller/buyer existed with a different password before V3
UPDATE users
SET password = '$2a$10$6Gom9nVqetRlkyEFh2FlfOr2DYVzoki5LOlTNcqN5k5uuHJgFzBNC'
WHERE username IN ('seller', 'buyer');
