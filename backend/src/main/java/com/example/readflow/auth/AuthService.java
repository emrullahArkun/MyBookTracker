package com.example.readflow.auth;

import com.example.readflow.shared.exception.DuplicateResourceException;
import com.example.readflow.shared.exception.InvalidCredentialsException;
import com.example.readflow.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Pre-encoded dummy hash for timing attack prevention.
    // Ensures login always runs BCrypt regardless of whether the user exists.
    private static final String DUMMY_HASH =
            "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345";

    @Transactional
    public User registerUser(String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already taken");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(Role.USER);
        user.setEnabled(true);

        return userRepository.save(user);
    }

    public User login(String email, String password) {
        User user = userRepository.findByEmail(email).orElse(null);

        // Always run BCrypt to prevent timing-based user enumeration
        String hashToCheck = user != null ? user.getPassword() : DUMMY_HASH;
        boolean passwordMatches = passwordEncoder.matches(password, hashToCheck);

        if (user == null || !passwordMatches) {
            log.warn("Failed login attempt for: {}", email);
            throw new InvalidCredentialsException("Invalid credentials");
        }

        if (!user.isEnabled()) {
            log.warn("Login attempt for disabled account: {}", email);
            throw new InvalidCredentialsException("Invalid credentials");
        }

        log.info("Login successful for: {}", email);
        return user;
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
