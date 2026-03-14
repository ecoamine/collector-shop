package com.collectorshop.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies the BCrypt hash used in V3/V4 for E2E users matches password "password".
 */
class E2ESeedPasswordTest {

    private static final String E2E_PASSWORD = "password";
    // Must match hash in V3__seed_e2e_users.sql and V4__ensure_e2e_passwords.sql (BCrypt strength 10)
    private static final String E2E_BCRYPT_HASH = "$2a$10$6Gom9nVqetRlkyEFh2FlfOr2DYVzoki5LOlTNcqN5k5uuHJgFzBNC";

    @Test
    void e2eSeedHash_matchesPassword() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
        assertThat(encoder.matches(E2E_PASSWORD, E2E_BCRYPT_HASH))
                .as("E2E seed hash in V3/V4 must match password '%s'", E2E_PASSWORD)
                .isTrue();
    }
}
