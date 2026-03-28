package com.example.chapterflow.stats.domain.activity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class ReadingRhythmTest {

    @Test
    void constructor_ShouldNormalizeNullEnumsAndNegativeNumbers() {
        ReadingRhythm rhythm = new ReadingRhythm(false, null, null, -3, -2, -12, -18);

        assertFalse(rhythm.enoughData());
        assertEquals(ReadingTimeOfDay.UNKNOWN, rhythm.preferredTimeOfDay());
        assertEquals(ReadingSessionLength.UNKNOWN, rhythm.preferredSessionLength());
        assertEquals(0, rhythm.activeDaysLast14());
        assertEquals(0, rhythm.sessionsLast14());
        assertEquals(0, rhythm.averagePagesPerSession());
        assertEquals(0, rhythm.averageMinutesPerSession());
    }
}
