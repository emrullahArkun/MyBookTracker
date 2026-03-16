package com.example.readflow.sessions.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ExcludeTimeRequest(
        @NotNull(message = "Millis amount is required") @Min(value = 0, message = "Millis must be positive") Long millis) {
}
