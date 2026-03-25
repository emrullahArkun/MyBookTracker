package com.example.readflow.shared.time;

import org.junit.jupiter.api.Test;

import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ZoneIdResolverTest {

    @Test
    void resolveOrUtc_ShouldFallBackToUtc_ForBlankTimezone() {
        assertEquals(ZoneOffset.UTC, ZoneIdResolver.resolveOrUtc("   "));
    }

    @Test
    void resolveOrUtc_ShouldFallBackToUtc_ForInvalidTimezone() {
        assertEquals(ZoneOffset.UTC, ZoneIdResolver.resolveOrUtc("Mars/Olympus"));
    }
}
