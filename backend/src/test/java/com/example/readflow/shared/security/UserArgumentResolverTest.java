package com.example.readflow.shared.security;

import com.example.readflow.auth.Role;
import com.example.readflow.auth.User;
import com.example.readflow.auth.AuthService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserArgumentResolverTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private UserArgumentResolver resolver;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // --- supportsParameter tests ---

    @Test
    void supportsParameter_ShouldReturnTrue_WhenAnnotatedWithCurrentUserAndTypeIsUser() throws Exception {
        MethodParameter param = getMethodParameter("withCurrentUser");
        assertTrue(resolver.supportsParameter(param));
    }

    @Test
    void supportsParameter_ShouldReturnFalse_WhenNotAnnotated() throws Exception {
        MethodParameter param = getMethodParameter("withoutAnnotation");
        assertFalse(resolver.supportsParameter(param));
    }

    @Test
    void supportsParameter_ShouldReturnFalse_WhenAnnotatedButWrongType() throws Exception {
        MethodParameter param = getMethodParameter("withCurrentUserWrongType");
        assertFalse(resolver.supportsParameter(param));
    }

    // --- resolveArgument tests ---

    @Test
    void resolveArgument_ShouldReturnUser_WhenAuthenticated() throws Exception {
        User user = new User("test@example.com", "password", Role.USER);
        TestingAuthenticationToken auth = new TestingAuthenticationToken("test@example.com", null);
        auth.setAuthenticated(true);
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(authService.getUserByEmail(eq("test@example.com"))).thenReturn(user);

        Object result = resolver.resolveArgument(null, null, null, null);

        assertEquals(user, result);
    }

    @Test
    void resolveArgument_ShouldThrow_WhenAuthIsNull() {
        SecurityContextHolder.getContext().setAuthentication(null);

        assertThrows(AuthenticationCredentialsNotFoundException.class,
                () -> resolver.resolveArgument(null, null, null, null));
    }

    @Test
    void resolveArgument_ShouldThrow_WhenNotAuthenticated() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("user", null);
        auth.setAuthenticated(false);
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertThrows(AuthenticationCredentialsNotFoundException.class,
                () -> resolver.resolveArgument(null, null, null, null));
    }

    @Test
    void resolveArgument_ShouldThrow_WhenAnonymousUser() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("anonymousUser", null);
        auth.setAuthenticated(true);
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertThrows(AuthenticationCredentialsNotFoundException.class,
                () -> resolver.resolveArgument(null, null, null, null));
    }

    // --- Helper methods used as test targets for supportsParameter ---

    @SuppressWarnings("unused")
    private static void withCurrentUser(@CurrentUser User user) {
    }

    @SuppressWarnings("unused")
    private static void withoutAnnotation(User user) {
    }

    @SuppressWarnings("unused")
    private static void withCurrentUserWrongType(@CurrentUser String notAUser) {
    }

    private MethodParameter getMethodParameter(String methodName) throws Exception {
        for (Method method : UserArgumentResolverTest.class.getDeclaredMethods()) {
            if (method.getName().equals(methodName)) {
                return new MethodParameter(method, 0);
            }
        }
        throw new NoSuchMethodException(methodName);
    }
}
