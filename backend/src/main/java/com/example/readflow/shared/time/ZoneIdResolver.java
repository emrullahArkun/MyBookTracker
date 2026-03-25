package com.example.readflow.shared.time;

import java.time.DateTimeException;
import java.time.ZoneId;
import java.time.ZoneOffset;

public final class ZoneIdResolver {

    private ZoneIdResolver() {}

    public static ZoneId resolveOrUtc(String timezone) {
        if (timezone == null || timezone.isBlank()) {
            return ZoneOffset.UTC;
        }
        try {
            return ZoneId.of(timezone);
        } catch (DateTimeException e) {
            return ZoneOffset.UTC;
        }
    }
}
