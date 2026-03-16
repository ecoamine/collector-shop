package com.collectorshop.security;

import com.collectorshop.domain.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final String SECRET = "change-this-secret-key-for-prod-32-bytes-minimum-1234";
    private static final long EXPIRATION_MS = 3600000L;

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, EXPIRATION_MS);
    }

    @Test
    void generateToken_andExtractUsername_roundTrip() {
        String token = jwtService.generateToken("seller", Role.SELLER);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo("seller");
    }

    @Test
    void isTokenValid_whenValidUser_returnsTrue() {
        String token = jwtService.generateToken("buyer", Role.BUYER);
        UserDetails user = User.withUsername("buyer").password("").authorities("ROLE_BUYER").build();

        assertThat(jwtService.isTokenValid(token, user)).isTrue();
    }

    @Test
    void isTokenValid_whenWrongUsername_returnsFalse() {
        String token = jwtService.generateToken("seller", Role.SELLER);
        UserDetails user = User.withUsername("other").password("").authorities("ROLE_SELLER").build();

        assertThat(jwtService.isTokenValid(token, user)).isFalse();
    }
}
