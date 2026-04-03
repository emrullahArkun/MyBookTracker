package com.example.mybooktracker.shared.security;

import com.example.mybooktracker.auth.domain.User;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtTokenService {

    private final JWSSigner signer;
    private final long ttlSeconds;
    private final String issuer;
    private final Clock clock;

    public JwtTokenService(@Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.ttl-seconds}") long ttlSeconds,
            @Value("${app.jwt.issuer}") String issuer,
            Clock clock) {
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 bytes long for HS256");
        }
        try {
            this.signer = new MACSigner(secret.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize JWT signer", e);
        }
        this.ttlSeconds = ttlSeconds;
        this.issuer = issuer;
        this.clock = clock;
    }

    public String createToken(User user) {
        try {
            Instant now = Instant.now(clock);
            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(user.getEmail())
                    .claim("userId", user.getId())
                    .claim("role", user.getRole().name())
                    .issuer(issuer)
                    .jwtID(UUID.randomUUID().toString())
                    .issueTime(Date.from(now))
                    .notBeforeTime(Date.from(now))
                    .expirationTime(Date.from(now.plusSeconds(ttlSeconds)))
                    .build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.HS256),
                    claimsSet);

            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (Exception e) {
            throw new TokenCreationException("Error creating JWT token", e);
        }
    }
}
