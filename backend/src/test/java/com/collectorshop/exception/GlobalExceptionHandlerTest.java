package com.collectorshop.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    void handleNotFound_returns404() {
        ProblemDetail result = handler.handleNotFound(new NotFoundException("Not found"));

        assertThat(result.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
        assertThat(result.getDetail()).isEqualTo("Not found");
    }

    @Test
    void handleBadCredentials_returns401() {
        ProblemDetail result = handler.handleBadCredentials(new BadCredentialsException("Bad"));

        assertThat(result.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
        assertThat(result.getDetail()).isEqualTo("Invalid username or password");
    }

    @Test
    void handleIllegalArgument_returns400() {
        ProblemDetail result = handler.handleIllegalArgument(new IllegalArgumentException("Invalid"));

        assertThat(result.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(result.getDetail()).isEqualTo("Invalid");
    }

    @Test
    void handleGeneric_returns500() {
        ProblemDetail result = handler.handleGeneric(new RuntimeException("Unexpected"));

        assertThat(result.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR.value());
        assertThat(result.getDetail()).startsWith("Unexpected error");
        assertThat(result.getDetail()).contains("RuntimeException");
        assertThat(result.getDetail()).contains("Unexpected");
    }

    @Test
    void handleDataIntegrity_returns400() {
        Exception cause = new RuntimeException("constraint violation");
        DataIntegrityViolationException ex = new DataIntegrityViolationException("msg", cause);

        ProblemDetail result = handler.handleDataIntegrity(ex);

        assertThat(result.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(result.getDetail()).contains("constraint violation");
    }
}
