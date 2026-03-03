package com.example.minilibrary.shared.security;

import com.example.minilibrary.auth.Role;
import com.example.minilibrary.auth.User;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.text.ParseException;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenServiceTest {

    private static final String SECRET = "my-super-secret-key-that-is-long-enough-for-hs256!";
    private JwtTokenService jwtTokenService;

    @BeforeEach
    void setUp() {
        jwtTokenService = new JwtTokenService(SECRET, 3600L);
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
        assertNotNull(claims.getIssueTime());
        assertNotNull(claims.getExpirationTime());
        assertTrue(claims.getExpirationTime().after(claims.getIssueTime()));
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
        assertThrows(IllegalStateException.class, () -> new JwtTokenService("short", 3600L));
    }
}
