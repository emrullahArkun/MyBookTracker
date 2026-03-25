package com.example.readflow.shared.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import static org.junit.jupiter.api.Assertions.*;

class CurrentUserTest {

    @Test
    void currentUser_ShouldBeRetentionRuntime() {
        assertTrue(CurrentUser.class.isAnnotation());
        assertNotNull(CurrentUser.class.getAnnotation(java.lang.annotation.Retention.class));
        assertEquals(java.lang.annotation.RetentionPolicy.RUNTIME,
                CurrentUser.class.getAnnotation(java.lang.annotation.Retention.class).value());
    }

    @Test
    void currentUser_ShouldTargetParameter() {
        java.lang.annotation.Target target = CurrentUser.class.getAnnotation(java.lang.annotation.Target.class);
        assertNotNull(target);

        java.lang.annotation.ElementType[] types = target.value();
        boolean hasParameter = false;
        for (java.lang.annotation.ElementType type : types) {
            if (type == java.lang.annotation.ElementType.PARAMETER) {
                hasParameter = true;
                break;
            }
        }
        assertTrue(hasParameter);
    }

    @Test
    void currentUser_ShouldBeMetaAnnotatedWithAuthenticationPrincipal() {
        assertNotNull(CurrentUser.class.getAnnotation(AuthenticationPrincipal.class));
    }
}
