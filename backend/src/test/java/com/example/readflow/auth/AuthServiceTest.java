package com.example.readflow.auth;

import com.example.readflow.shared.exception.DuplicateResourceException;
import com.example.readflow.shared.exception.InvalidCredentialsException;
import com.example.readflow.shared.exception.ResourceNotFoundException;
import com.example.readflow.auth.Role;
import com.example.readflow.auth.User;
import com.example.readflow.auth.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

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
    @InjectMocks
    private AuthService authService;

    // --- registerUser ---

    @Test
    void registerUser_ShouldCreateUser() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User user = authService.registerUser("test@example.com", "password");

        assertEquals("test@example.com", user.getEmail());
        assertEquals("encoded", user.getPassword());
        assertEquals(Role.USER, user.getRole());
        assertTrue(user.isEnabled());
    }

    @Test
    void registerUser_ShouldThrow_WhenEmailTaken() {
        when(userRepository.findByEmail("taken@example.com")).thenReturn(Optional.of(new User()));

        assertThrows(DuplicateResourceException.class,
                () -> authService.registerUser("taken@example.com", "password"));
    }

    // --- login ---

    @Test
    void login_ShouldReturnUser_WhenCredentialsValid() {
        User user = new User("test@example.com", "encoded", Role.USER);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "encoded")).thenReturn(true);

        User result = authService.login("test@example.com", "password");
        assertEquals("test@example.com", result.getEmail());
    }

    @Test
    void login_ShouldThrow_WhenUserNotFound() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class,
                () -> authService.login("missing@example.com", "password"));
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
    void login_ShouldAutoEnable_WhenUserDisabled() {
        User user = new User("test@example.com", "encoded", Role.USER);
        user.setEnabled(false);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "encoded")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User result = authService.login("test@example.com", "password");
        assertTrue(result.isEnabled());
        verify(userRepository).save(user);
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
}
