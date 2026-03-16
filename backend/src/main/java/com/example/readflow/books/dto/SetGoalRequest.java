package com.example.readflow.books.dto;

import com.example.readflow.books.ReadingGoalType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record SetGoalRequest(
                @NotNull(message = "Type must not be null") ReadingGoalType type,

                @Min(value = 1, message = "Pages must be at least 1") Integer pages) {
}
