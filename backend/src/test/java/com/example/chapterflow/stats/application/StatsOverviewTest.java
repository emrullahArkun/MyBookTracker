package com.example.chapterflow.stats.application;

import com.example.chapterflow.stats.domain.activity.ReadingRhythm;
import com.example.chapterflow.stats.domain.activity.ReadingSessionLength;
import com.example.chapterflow.stats.domain.activity.ReadingTimeOfDay;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StatsOverviewTest {

    @Test
    void constructor_ShouldNormalizeNullCollectionsToEmptyLists() {
        StatsOverview overview = new StatsOverview(1, 2, 3, 4, 5, 6, null, null, null);

        assertTrue(overview.genreDistribution().isEmpty());
        assertTrue(overview.dailyActivity().isEmpty());
    }

    @Test
    void constructor_ShouldDefensivelyCopyCollections() {
        List<GenreStat> genreDistribution = new ArrayList<>(List.of(new GenreStat("Fantasy", 2)));
        List<DailyActivity> dailyActivity = new ArrayList<>(List.of(new DailyActivity(LocalDate.of(2026, 3, 26), 30)));
        ReadingRhythm readingRhythm = new ReadingRhythm(true, ReadingTimeOfDay.EVENING, ReadingSessionLength.SHORT, 4, 5, 18, 22);

        StatsOverview overview = new StatsOverview(1, 2, 3, 4, 5, 6, genreDistribution, dailyActivity, readingRhythm);

        genreDistribution.add(new GenreStat("Sci-Fi", 1));
        dailyActivity.add(new DailyActivity(LocalDate.of(2026, 3, 27), 10));

        assertEquals(1, overview.genreDistribution().size());
        assertEquals(1, overview.dailyActivity().size());
        assertThrows(UnsupportedOperationException.class,
                () -> overview.genreDistribution().add(new GenreStat("Drama", 1)));
        assertThrows(UnsupportedOperationException.class,
                () -> overview.dailyActivity().add(new DailyActivity(LocalDate.of(2026, 3, 28), 5)));
        assertEquals(readingRhythm, overview.readingRhythm());
    }
}
