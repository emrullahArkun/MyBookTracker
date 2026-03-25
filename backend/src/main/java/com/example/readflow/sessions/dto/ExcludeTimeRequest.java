package com.example.readflow.sessions.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ExcludeTimeRequest(
        @NotNull(message = "Millis amount is required") @Positive(message = "Millis must be strictly positive") Long millis) {
}
