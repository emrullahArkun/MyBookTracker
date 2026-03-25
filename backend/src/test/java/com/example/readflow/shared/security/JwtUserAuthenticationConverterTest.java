package com.example.readflow.shared.security;

import com.example.readflow.auth.Role;
import com.example.readflow.auth.User;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class JwtUserAuthenticationConverterTest {

    private final JwtUserAuthenticationConverter converter = new JwtUserAuthenticationConverter();

    @Test
    void convert_ShouldReturnUserAuthenticationToken() {
        Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "HS256")
                .subject("test@example.com")
                .claim("userId", 1L)
                .claim("role", "USER")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        AbstractAuthenticationToken result = converter.convert(jwt);

        assertInstanceOf(UserAuthenticationToken.class, result);
        UserAuthenticationToken token = (UserAuthenticationToken) result;
        User user = token.getUser();
        assertEquals(1L, user.getId());
        assertEquals("test@example.com", user.getEmail());
        assertEquals(Role.USER, user.getRole());
        assertTrue(token.isAuthenticated());
    }

    @Test
    void convert_ShouldSetAuthorities() {
        Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "HS256")
                .subject("admin@example.com")
                .claim("userId", 2L)
                .claim("role", "ADMIN")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        AbstractAuthenticationToken result = converter.convert(jwt);

        assertEquals(1, result.getAuthorities().size());
        assertTrue(result.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    void convert_ShouldExposeUserAsPrincipal() {
        Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "HS256")
                .subject("test@example.com")
                .claim("userId", 5L)
                .claim("role", "USER")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        AbstractAuthenticationToken result = converter.convert(jwt);

        assertInstanceOf(User.class, result.getPrincipal());
        assertEquals(5L, ((User) result.getPrincipal()).getId());
    }
}
