package com.example.readflow.auth;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataInitializerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private DataInitializer dataInitializer;

    @Test
    void initData_ShouldCreateAdminUser_WhenNotExists() throws Exception {
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");

        CommandLineRunner runner = dataInitializer.initData();
        runner.run();

        verify(userRepository).save(any(User.class));
    }

    @Test
    void initData_ShouldNotCreateAdminUser_WhenAlreadyExists() throws Exception {
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(new User()));

        CommandLineRunner runner = dataInitializer.initData();
        runner.run();

        verify(userRepository, never()).save(any(User.class));
    }
}
