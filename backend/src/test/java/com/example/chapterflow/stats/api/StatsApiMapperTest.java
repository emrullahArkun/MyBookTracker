package com.example.chapterflow.stats.api;

import com.example.chapterflow.stats.api.dto.StatsOverviewDto;
import com.example.chapterflow.stats.application.StatsOverview;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class StatsApiMapperTest {

    @Test
    void toDto_ShouldReturnNullReadingRhythm_WhenOverviewHasNoRhythm() {
        StatsOverview overview = new StatsOverview(1, 0, 20, 30, 0, 0, List.of(), List.of(), null);

        StatsOverviewDto dto = StatsApiMapper.toDto(overview);

        assertNull(dto.readingRhythm());
    }

    @Test
    void toAchievementDtos_ShouldReturnEmptyList_WhenAchievementsAreEmpty() {
        assertEquals(List.of(), StatsApiMapper.toAchievementDtos(List.of()));
    }
}
