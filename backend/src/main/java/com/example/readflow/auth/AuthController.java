package com.example.readflow.auth;

import com.example.readflow.auth.dto.*;
import com.example.readflow.shared.security.JwtTokenService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtTokenService jwtTokenService;

    public AuthController(AuthService authService, JwtTokenService jwtTokenService) {
        this.authService = authService;
        this.jwtTokenService = jwtTokenService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@RequestBody @Valid RegisterRequest request) {
        User user = authService.registerUser(request.email(), request.password());
        return ResponseEntity.ok(new RegisterResponse("Registration successful. Please login.", UserDto.from(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request) {
        User user = authService.login(request.email(), request.password());
        String jwt = jwtTokenService.createToken(user);
        return ResponseEntity.ok(new AuthResponse(jwt, UserDto.from(user)));
    }

    @GetMapping("/session")
    public ResponseEntity<SessionResponse> getSession(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User user = authService.getUserByEmail(principal.getName());
        return ResponseEntity.ok(new SessionResponse(UserDto.from(user)));
    }
}
