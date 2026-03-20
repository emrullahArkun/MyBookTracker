package com.example.readflow.shared.security;

import com.example.readflow.auth.Role;
import com.example.readflow.auth.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.lang.reflect.Method;
import java.time.Instant;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class UserArgumentResolverTest {

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
        Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "HS256")
                .subject("test@example.com")
                .claim("userId", 1L)
                .claim("role", "USER")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        Object result = resolver.resolveArgument(null, null, null, null);

        assertInstanceOf(User.class, result);
        User user = (User) result;
        assertEquals("test@example.com", user.getEmail());
        assertEquals(1L, user.getId());
        assertEquals(Role.USER, user.getRole());
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
