package com.example.readflow.stats;

import com.example.readflow.auth.User;
import com.example.readflow.stats.dto.AchievementDto;
import com.example.readflow.stats.dto.DailyActivityDto;
import com.example.readflow.stats.dto.GenreStatDto;
import com.example.readflow.stats.dto.StatsOverviewDto;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class StatsControllerTest {

    @Mock
    private StatsService statsService;

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
        StatsOverviewDto dto = new StatsOverviewDto(
                10, 3, 1500, 600, 5, 12,
                List.of(new GenreStatDto("Thriller", 4)),
                List.of(new DailyActivityDto(LocalDate.now(), 30)));

        when(statsService.getOverview(any())).thenReturn(dto);

        mockMvc.perform(get("/api/stats/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBooks").value(10))
                .andExpect(jsonPath("$.completedBooks").value(3))
                .andExpect(jsonPath("$.totalPagesRead").value(1500))
                .andExpect(jsonPath("$.currentStreak").value(5))
                .andExpect(jsonPath("$.genreDistribution[0].genre").value("Thriller"))
                .andExpect(jsonPath("$.dailyActivity[0].pagesRead").value(30));
    }

    @Test
    void getAchievements_ShouldReturnList() throws Exception {
        List<AchievementDto> achievements = List.of(
                new AchievementDto(AchievementType.FIRST_SESSION, true, "1 sessions"),
                new AchievementDto(AchievementType.BOOKWORM, false, "0/5"));

        when(statsService.getAchievements(any())).thenReturn(achievements);

        mockMvc.perform(get("/api/stats/achievements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value("FIRST_SESSION"))
                .andExpect(jsonPath("$[0].unlocked").value(true))
                .andExpect(jsonPath("$[1].unlocked").value(false));
    }
}
