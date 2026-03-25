package com.example.readflow.stats;

import com.example.readflow.auth.User;
import com.example.readflow.sessions.StreakService;
import com.example.readflow.shared.security.CurrentUser;
import com.example.readflow.stats.dto.AchievementDto;
import com.example.readflow.stats.dto.StatsOverviewDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;
    private final AchievementService achievementService;
    private final StreakService streakService;

    @GetMapping("/overview")
    public ResponseEntity<StatsOverviewDto> getOverview(@CurrentUser User user) {
        return ResponseEntity.ok(statsService.getOverview(user));
    }

    @GetMapping("/achievements")
    public ResponseEntity<List<AchievementDto>> getAchievements(@CurrentUser User user) {
        return ResponseEntity.ok(achievementService.getAchievements(user));
    }

    @GetMapping("/streak")
    public ResponseEntity<Map<String, Integer>> getStreak(
            @CurrentUser User user,
            @RequestHeader(value = "X-Timezone", required = false) String timezone) {
        java.time.ZoneId zoneId;
        try {
            zoneId = timezone != null ? java.time.ZoneId.of(timezone) : java.time.ZoneOffset.UTC;
        } catch (java.time.DateTimeException e) {
            zoneId = java.time.ZoneOffset.UTC;
        }
        StreakService.StreakInfo streakInfo = streakService.calculateStreaks(user, zoneId);
        return ResponseEntity.ok(Map.of(
                "currentStreak", streakInfo.current(),
                "longestStreak", streakInfo.longest()
        ));
    }
}
