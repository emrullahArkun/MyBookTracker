package com.example.mybooktracker.auth.application;

import com.example.mybooktracker.auth.domain.Role;
import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.auth.infra.persistence.UserRepository;
import com.example.mybooktracker.shared.exception.DomainValidationException;
import com.example.mybooktracker.shared.exception.DuplicateResourceException;
import com.example.mybooktracker.shared.exception.InvalidCredentialsException;
import com.example.mybooktracker.shared.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@Slf4j
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String dummyHash;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.dummyHash = passwordEncoder.encode("invalid-user-placeholder");
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    @Transactional
    public User registerUser(String email, String password) {
        String normalized = normalizeEmail(email);
        if (userRepository.existsByEmail(normalized)) {
            throw new DuplicateResourceException("Email already taken");
        }
        if (!PasswordPolicy.isValid(password)) {
            throw new DomainValidationException(PasswordPolicy.USER_FACING_MESSAGE);
        }

        User user = new User();
        user.setEmail(normalized);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(Role.USER);
        user.setEnabled(true);

        return userRepository.save(user);
    }

    public User login(String email, String password) {
        String normalized = normalizeEmail(email);
        User user = userRepository.findByEmail(normalized).orElse(null);

        // Always run BCrypt to prevent timing-based user enumeration
        String hashToCheck = user != null ? user.getPassword() : dummyHash;
        boolean passwordMatches = passwordEncoder.matches(password, hashToCheck);

        if (user == null || !passwordMatches) {
            log.warn("Failed login attempt for: {}", maskEmail(email));
            throw new InvalidCredentialsException("Invalid credentials");
        }

        if (!user.isEnabled()) {
            log.warn("Login attempt for disabled account: {}", maskEmail(email));
            throw new InvalidCredentialsException("Invalid credentials");
        }

        log.info("Login successful for user ID: {}", user.getId());
        return user;
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***@***";
        String[] parts = email.split("@", 2);
        if (parts[0].length() <= 2) return parts[0] + "***@" + parts[1];
        return parts[0].substring(0, 2) + "***@" + parts[1];
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
