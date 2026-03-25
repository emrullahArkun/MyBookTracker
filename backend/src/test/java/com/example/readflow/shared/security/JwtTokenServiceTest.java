package com.example.readflow.shared.security;

import com.example.readflow.auth.Role;
import com.example.readflow.auth.User;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.text.ParseException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenServiceTest {

    private static final String SECRET = "my-super-secret-key-that-is-long-enough-for-hs256!";
    private static final Instant FIXED_NOW = Instant.parse("2026-03-25T12:00:00Z");
    private JwtTokenService jwtTokenService;
    private Clock clock;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
        jwtTokenService = new JwtTokenService(SECRET, 3600L, clock);
    }

    @Test
    void createToken_ShouldReturnValidJwt() throws ParseException {
        User user = new User("test@example.com", "password", Role.USER);

        String token = jwtTokenService.createToken(user);

        assertNotNull(token);
        assertFalse(token.isEmpty());

        SignedJWT signedJWT = SignedJWT.parse(token);
        JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

        assertEquals("test@example.com", claims.getSubject());
        assertEquals("USER", claims.getStringClaim("role"));
        assertEquals(Date.from(FIXED_NOW), claims.getIssueTime());
        assertEquals(Date.from(FIXED_NOW.plusSeconds(3600L)), claims.getExpirationTime());
    }

    @Test
    void createToken_ShouldContainCorrectRole_ForAdmin() throws ParseException {
        User user = new User("admin@example.com", "password", Role.ADMIN);

        String token = jwtTokenService.createToken(user);
        SignedJWT signedJWT = SignedJWT.parse(token);
        JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

        assertEquals("ADMIN", claims.getStringClaim("role"));
    }

    @Test
    void constructor_ShouldThrow_WhenSecretTooShort() {
        assertThrows(IllegalStateException.class, () -> new JwtTokenService("short", 3600L, clock));
    }
}
