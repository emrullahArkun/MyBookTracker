package com.example.chapterflow.stats.api.dto;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StatsOverviewDtoTest {

    @Test
    void statsOverviewDto_ShouldHandleNulls() {
        StatsOverviewDto dto = new StatsOverviewDto(0L, 0L, 0L, 0L, 0, 0, null, null, null);
        assertNotNull(dto.genreDistribution());
        assertTrue(dto.genreDistribution().isEmpty());
        assertNotNull(dto.dailyActivity());
        assertTrue(dto.dailyActivity().isEmpty());
    }
}
