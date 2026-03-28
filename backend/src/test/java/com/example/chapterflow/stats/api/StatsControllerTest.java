package com.example.chapterflow.stats.api;

import com.example.chapterflow.auth.domain.User;
import com.example.chapterflow.stats.application.AchievementService;
import com.example.chapterflow.stats.application.DailyActivity;
import com.example.chapterflow.stats.application.GenreStat;
import com.example.chapterflow.stats.application.StatsService;
import com.example.chapterflow.stats.application.StatsOverview;
import com.example.chapterflow.stats.application.StreakService;
import com.example.chapterflow.stats.domain.activity.ReadingRhythm;
import com.example.chapterflow.stats.domain.activity.ReadingSessionLength;
import com.example.chapterflow.stats.domain.activity.ReadingTimeOfDay;
import com.example.chapterflow.stats.domain.achievements.Achievement;
import com.example.chapterflow.stats.domain.achievements.AchievementType;
import com.example.chapterflow.stats.domain.streak.StreakInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class StatsControllerTest {

    @Mock
    private StatsService statsService;

    @Mock
    private AchievementService achievementService;

    @Mock
    private StreakService streakService;

    @InjectMocks
    private StatsController statsController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        HandlerMethodArgumentResolver resolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().isAssignableFrom(User.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                    NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new User();
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(statsController)
                .setCustomArgumentResolvers(resolver)
                .build();
    }

    @Test
    void getOverview_ShouldReturnStats() throws Exception {
        StatsOverview overview = new StatsOverview(
                10, 3, 1500, 600, 5, 12,
                List.of(new GenreStat("Thriller", 4)),
                List.of(new DailyActivity(LocalDate.now(), 30)),
                new ReadingRhythm(true, ReadingTimeOfDay.EVENING, ReadingSessionLength.SHORT, 4, 5, 18, 25));

        when(statsService.getOverview(any(), eq((String) null))).thenReturn(overview);

        mockMvc.perform(get("/api/stats/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBooks").value(10))
                .andExpect(jsonPath("$.completedBooks").value(3))
                .andExpect(jsonPath("$.totalPagesRead").value(1500))
                .andExpect(jsonPath("$.currentStreak").value(5))
                .andExpect(jsonPath("$.genreDistribution[0].genre").value("Thriller"))
                .andExpect(jsonPath("$.dailyActivity[0].pagesRead").value(30))
                .andExpect(jsonPath("$.readingRhythm.preferredTimeOfDay").value("EVENING"))
                .andExpect(jsonPath("$.readingRhythm.averagePagesPerSession").value(18));
    }

    @Test
    void getOverview_ShouldUseTimezoneHeader() throws Exception {
        StatsOverview overview = new StatsOverview(
                1, 0, 20, 45, 1, 1,
                List.of(),
                List.of(),
                new ReadingRhythm(false, ReadingTimeOfDay.UNKNOWN, ReadingSessionLength.UNKNOWN, 1, 2, 10, 15));

        when(statsService.getOverview(any(), eq("Europe/Berlin"))).thenReturn(overview);

        mockMvc.perform(get("/api/stats/overview")
                        .header("X-Timezone", "Europe/Berlin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.readingRhythm.sessionsLast14").value(2));
    }

    @Test
    void getAchievements_ShouldReturnList() throws Exception {
        List<Achievement> achievements = List.of(
                new Achievement(AchievementType.FIRST_SESSION, true, "1 sessions"),
                new Achievement(AchievementType.BOOKWORM, false, "0/5"));

        when(achievementService.getAchievements(any(), eq((String) null))).thenReturn(achievements);

        mockMvc.perform(get("/api/stats/achievements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value("FIRST_SESSION"))
                .andExpect(jsonPath("$[0].unlocked").value(true))
                .andExpect(jsonPath("$[1].unlocked").value(false));
    }

    @Test
    void getAchievements_ShouldUseTimezoneHeader() throws Exception {
        when(achievementService.getAchievements(any(), eq("Europe/Berlin")))
                .thenReturn(List.of(new Achievement(AchievementType.EARLY_BIRD, true, null)));

        mockMvc.perform(get("/api/stats/achievements")
                .header("X-Timezone", "Europe/Berlin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("EARLY_BIRD"))
                .andExpect(jsonPath("$[0].unlocked").value(true));
    }

    @Test
    void getStreak_ShouldReturnStreakData() throws Exception {
        when(streakService.calculateStreaks(any(), eq((String) null)))
                .thenReturn(new StreakInfo(5, 12));

        mockMvc.perform(get("/api/stats/streak"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStreak").value(5))
                .andExpect(jsonPath("$.longestStreak").value(12));
    }

    @Test
    void getStreak_ShouldUseTimezoneHeader() throws Exception {
        when(streakService.calculateStreaks(any(), eq("Europe/Berlin")))
                .thenReturn(new StreakInfo(3, 7));

        mockMvc.perform(get("/api/stats/streak")
                .header("X-Timezone", "Europe/Berlin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStreak").value(3))
                .andExpect(jsonPath("$.longestStreak").value(7));
    }

    @Test
    void getStreak_ShouldFallbackToUtc_WhenInvalidTimezone() throws Exception {
        when(streakService.calculateStreaks(any(), eq("Invalid/Zone")))
                .thenReturn(new StreakInfo(1, 1));

        mockMvc.perform(get("/api/stats/streak")
                .header("X-Timezone", "Invalid/Zone"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStreak").value(1))
                .andExpect(jsonPath("$.longestStreak").value(1));
    }
}
