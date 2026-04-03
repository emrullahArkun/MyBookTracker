package com.example.mybooktracker.auth.application;

import com.example.mybooktracker.auth.domain.Role;
import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.auth.infra.persistence.UserRepository;
import com.example.mybooktracker.shared.exception.DomainValidationException;
import com.example.mybooktracker.shared.exception.DuplicateResourceException;
import com.example.mybooktracker.shared.exception.InvalidCredentialsException;
import com.example.mybooktracker.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private AuthService authService;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        lenient().when(passwordEncoder.encode("invalid-user-placeholder")).thenReturn("dummy_encoded");
        authService = new AuthService(userRepository, passwordEncoder);
    }

    // --- registerUser ---

    @Test
    void registerUser_ShouldCreateUser() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password1234")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User user = authService.registerUser("test@example.com", "Password1234");

        assertEquals("test@example.com", user.getEmail());
        assertEquals("encoded", user.getPassword());
        assertEquals(Role.USER, user.getRole());
        assertTrue(user.isEnabled());
    }

    @Test
    void registerUser_ShouldThrow_WhenEmailTaken() {
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> authService.registerUser("taken@example.com", "Password1234"));
    }

    @Test
    void registerUser_ShouldThrow_WhenPasswordWeak() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);

        DomainValidationException exception = assertThrows(DomainValidationException.class,
                () -> authService.registerUser("test@example.com", "password123"));

        assertEquals(PasswordPolicy.USER_FACING_MESSAGE, exception.getMessage());
    }

    // --- login ---

    @Test
    void login_ShouldReturnUser_WhenCredentialsValid() {
        User user = new User("test@example.com", "encoded", Role.USER);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password1234", "encoded")).thenReturn(true);

        User result = authService.login("test@example.com", "Password1234");
        assertEquals("test@example.com", result.getEmail());
    }

    @Test
    void login_ShouldThrow_WhenUserNotFound() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThrows(InvalidCredentialsException.class,
                () -> authService.login("missing@example.com", "Password1234"));
    }

    @Test
    void login_ShouldThrow_WhenPasswordWrong() {
        User user = new User("test@example.com", "encoded", Role.USER);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class,
                () -> authService.login("test@example.com", "wrong"));
    }

    @Test
    void login_ShouldThrow_WhenEmailHasNoAtSign() {
        when(userRepository.findByEmail("invalid-email")).thenReturn(Optional.empty());
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThrows(InvalidCredentialsException.class,
                () -> authService.login("invalid-email", "Password1234"));
    }

    @Test
    void login_ShouldThrow_WhenEmailPrefixIsShort() {
        User user = new User("ab@example.com", "encoded", Role.USER);
        when(userRepository.findByEmail("ab@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class,
                () -> authService.login("ab@example.com", "wrong"));
    }

    @Test
    void login_ShouldThrow_WhenUserDisabled() {
        User user = new User("test@example.com", "encoded", Role.USER);
        user.setEnabled(false);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password1234", "encoded")).thenReturn(true);

        assertThrows(InvalidCredentialsException.class,
                () -> authService.login("test@example.com", "Password1234"));
    }

    // --- getUserByEmail ---

    @Test
    void getUserByEmail_ShouldReturnUser() {
        User user = new User("test@example.com", "pw", Role.USER);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        assertEquals(user, authService.getUserByEmail("test@example.com"));
    }

    @Test
    void getUserByEmail_ShouldThrow_WhenNotFound() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> authService.getUserByEmail("missing@example.com"));
    }

    @Test
    void maskEmail_ShouldReturnMaskedPlaceholder_WhenEmailIsNull() {
        String masked = (String) ReflectionTestUtils.invokeMethod(authService, "maskEmail", (String) null);

        assertEquals("***@***", masked);
    }
}
