package com.example.minilibrary.discovery;

import com.example.minilibrary.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {

    /**
     * Get the most recent distinct queries for a user (for Discovery)
     */
    @Query("SELECT s.query FROM SearchHistory s WHERE s.user = :user GROUP BY s.query ORDER BY MAX(s.timestamp) DESC")
    List<String> findDistinctQueriesByUserOrderByTimestampDesc(@Param("user") User user);

    /**
     * Count total entries for a user (for limit check)
     */
    long countByUser(User user);

    /**
     * Check if a duplicate query exists within the time window (for deduplication)
     */
    boolean existsByUserAndQueryAndTimestampAfter(User user, String query, LocalDateTime after);

    /**
     * Delete the oldest entry for a user (for FIFO cleanup when limit exceeded)
     */
    @Modifying
    @Query(value = "DELETE FROM search_history WHERE id = (SELECT id FROM search_history WHERE user_id = :userId ORDER BY timestamp ASC LIMIT 1)", nativeQuery = true)
    void deleteOldestByUserId(@Param("userId") Long userId);

    /**
     * Get recent searches with limit
     */
    List<SearchHistory> findTop10ByUserOrderByTimestampDesc(User user);
}
