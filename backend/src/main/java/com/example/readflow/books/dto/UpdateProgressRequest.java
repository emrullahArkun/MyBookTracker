package com.example.readflow.books.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateProgressRequest(
        @NotNull(message = "Current page is required") @Min(value = 0, message = "Current page cannot be negative") Integer currentPage) {
}
