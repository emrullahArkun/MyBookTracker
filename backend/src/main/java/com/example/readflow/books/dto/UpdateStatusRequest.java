package com.example.readflow.books.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(
        @NotNull(message = "Completed status is required") Boolean completed) {
}
