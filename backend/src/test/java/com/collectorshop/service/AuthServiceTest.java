package com.collectorshop.service;

import com.collectorshop.domain.Role;
import com.collectorshop.domain.User;
import com.collectorshop.dto.AuthResponse;
import com.collectorshop.dto.LoginRequest;
import com.collectorshop.dto.RegisterRequest;
import com.collectorshop.repository.UserRepository;
import com.collectorshop.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    @Test
    void register_whenUsernameExists_throws() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("existing");
        request.setPassword("pass");
        when(userRepository.existsByUsername("existing")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_whenUsernameNew_returnsToken() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setPassword("pass");
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(passwordEncoder.encode("pass")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(jwtService.generateToken("newuser", Role.BUYER)).thenReturn("jwt-token");

        AuthResponse response = authService.register(request);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getRole()).isEqualTo("BUYER");
        verify(userRepository).save(argThat(u -> u.getUsername().equals("newuser") && u.getRole() == Role.BUYER));
    }

    @Test
    void login_whenAuthenticated_returnsToken() {
        LoginRequest request = new LoginRequest();
        request.setUsername("seller");
        request.setPassword("password");
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("seller");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        User user = User.builder().id(1L).username("seller").role(Role.SELLER).build();
        when(userRepository.findByUsername("seller")).thenReturn(Optional.of(user));
        when(jwtService.generateToken("seller", Role.SELLER)).thenReturn("token");

        AuthResponse response = authService.login(request);

        assertThat(response.getToken()).isEqualTo("token");
        assertThat(response.getRole()).isEqualTo("SELLER");
    }

    @Test
    void login_whenUserNotFoundAfterAuth_throws() {
        LoginRequest request = new LoginRequest();
        request.setUsername("unknown");
        request.setPassword("pass");
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("unknown");
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> authService.login(request));
    }
}
