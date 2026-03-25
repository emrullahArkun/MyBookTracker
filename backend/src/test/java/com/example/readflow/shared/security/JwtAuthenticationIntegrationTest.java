package com.example.readflow.shared.security;

import com.example.readflow.auth.Role;
import com.example.readflow.auth.User;
import com.example.readflow.auth.UserRepository;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import com.example.readflow.books.BookRepository;
import com.example.readflow.sessions.ReadingSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class JwtAuthenticationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private ReadingSessionRepository sessionRepository;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    private User testUser;

    @BeforeEach
    void setUp() {
        sessionRepository.deleteAll();
        bookRepository.deleteAll();
        userRepository.deleteAll();

        testUser = new User();
        testUser.setEmail("auth-test@example.com");
        testUser.setPassword(passwordEncoder.encode("password"));
        testUser.setRole(Role.USER);
        testUser.setEnabled(true);
        testUser = userRepository.save(testUser);
    }

    @Test
    void validJwtCookie_ShouldAllowAccess() throws Exception {
        String token = jwtTokenService.createToken(testUser);

        mockMvc.perform(get("/api/sessions/active")
                .cookie(new Cookie("jwt", token)))
                .andExpect(status().isNoContent()); // No active session, but auth passed
    }

    @Test
    void expiredJwtCookie_ShouldReturn401() throws Exception {
        String expiredToken = createExpiredToken(testUser);

        mockMvc.perform(get("/api/sessions/active")
                .cookie(new Cookie("jwt", expiredToken)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void missingJwtCookie_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/sessions/active"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void missingJwtCookie_ShouldReturn401_ForAuthSession() throws Exception {
        mockMvc.perform(get("/api/auth/session"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void validJwtCookie_ShouldAllowAccess_ToAuthSession() throws Exception {
        String token = jwtTokenService.createToken(testUser);

        mockMvc.perform(get("/api/auth/session")
                .cookie(new Cookie("jwt", token)))
                .andExpect(status().isOk());
    }

    @Test
    void tamperedJwtCookie_ShouldReturn401() throws Exception {
        String token = jwtTokenService.createToken(testUser);
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";

        mockMvc.perform(get("/api/sessions/active")
                .cookie(new Cookie("jwt", tampered)))
                .andExpect(status().isUnauthorized());
    }

    private String createExpiredToken(User user) {
        try {
            Instant past = Instant.now().minusSeconds(7200);
            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(user.getEmail())
                    .claim("userId", user.getId())
                    .claim("role", user.getRole().name())
                    .issueTime(Date.from(past))
                    .expirationTime(Date.from(past.plusSeconds(3600))) // expired 1h ago
                    .build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.HS256), claimsSet);
            signedJWT.sign(new MACSigner(jwtSecret.getBytes(StandardCharsets.UTF_8)));
            return signedJWT.serialize();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
