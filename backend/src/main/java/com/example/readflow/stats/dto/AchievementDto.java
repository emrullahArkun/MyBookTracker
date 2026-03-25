package com.example.readflow.stats.dto;

import com.example.readflow.stats.AchievementType;

public record AchievementDto(
        AchievementType id,
        boolean unlocked,
        String unlockedDetail) {
}
