package com.example.minilibrary.books.dto;

import com.example.minilibrary.books.ReadingGoalType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record SetGoalRequest(
                @NotNull(message = "Type must not be null") ReadingGoalType type,

                @Min(value = 1, message = "Pages must be at least 1") Integer pages) {
}
