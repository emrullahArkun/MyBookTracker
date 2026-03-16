package com.example.readflow.auth;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UserTest {

    @Test
    void threeArgConstructor_ShouldSetFields() {
        User user = new User("test@example.com", "secret", Role.USER);

        assertEquals("test@example.com", user.getEmail());
        assertEquals("secret", user.getPassword());
        assertEquals(Role.USER, user.getRole());
        assertTrue(user.isEnabled());
    }

    @Test
    void noArgConstructor_ShouldCreateEmptyUser() {
        User user = new User();

        assertNull(user.getId());
        assertNull(user.getEmail());
        assertNull(user.getPassword());
        assertNull(user.getRole());
    }

    @Test
    void allArgsConstructor_ShouldSetAllFields() {
        User user = new User(1L, "admin@test.com", "pass", Role.ADMIN, false);

        assertEquals(1L, user.getId());
        assertEquals("admin@test.com", user.getEmail());
        assertEquals("pass", user.getPassword());
        assertEquals(Role.ADMIN, user.getRole());
        assertFalse(user.isEnabled());
    }

    @Test
    void settersAndGetters_ShouldWork() {
        User user = new User();
        user.setId(5L);
        user.setEmail("user@test.com");
        user.setPassword("pwd");
        user.setRole(Role.USER);
        user.setEnabled(false);

        assertEquals(5L, user.getId());
        assertEquals("user@test.com", user.getEmail());
        assertEquals("pwd", user.getPassword());
        assertEquals(Role.USER, user.getRole());
        assertFalse(user.isEnabled());
    }
}
