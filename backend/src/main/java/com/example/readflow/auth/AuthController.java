package com.example.readflow.auth;

import com.example.readflow.auth.dto.*;
import com.example.readflow.shared.security.JwtTokenService;
import com.example.readflow.shared.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtTokenService jwtTokenService;
    private final long ttlSeconds;
    private final boolean secureCookie;

    public AuthController(AuthService authService,
                          JwtTokenService jwtTokenService,
                          @Value("${app.jwt.ttl-seconds}") long ttlSeconds,
                          @Value("${app.jwt.cookie-secure:true}") boolean secureCookie) {
        this.authService = authService;
        this.jwtTokenService = jwtTokenService;
        this.ttlSeconds = ttlSeconds;
        this.secureCookie = secureCookie;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@RequestBody @Valid RegisterRequest request) {
        User user = authService.registerUser(request.email(), request.password());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RegisterResponse("Registration successful. Please login.", UserDto.from(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request) {
        User user = authService.login(request.email(), request.password());
        String jwt = jwtTokenService.createToken(user);

        ResponseCookie cookie = buildJwtCookie(jwt, ttlSeconds);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new AuthResponse(UserDto.from(user)));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        ResponseCookie cookie = buildJwtCookie("", 0);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }

    @GetMapping("/session")
    public ResponseEntity<SessionResponse> getSession(@CurrentUser User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(new SessionResponse(UserDto.from(user)));
    }

    private ResponseCookie buildJwtCookie(String value, long maxAge) {
        return ResponseCookie.from("jwt", value)
                .httpOnly(true)
                .secure(secureCookie)
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .build();
    }
}
