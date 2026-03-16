package com.collectorshop.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class AuthResponse {

    private final String token;
    private final String role;

    public AuthResponse(String token) {
        this.token = token;
        this.role = null;
    }
}

