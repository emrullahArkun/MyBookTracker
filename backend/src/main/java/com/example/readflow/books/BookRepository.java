package com.example.readflow.books;

import com.example.readflow.auth.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

        boolean existsByIsbnAndUser(String isbn, User user);

        List<Book> findByUser(User user);

        @EntityGraph(attributePaths = "readingSessions")
        Page<Book> findByUserOrderByCompletedAsc(User user, Pageable pageable);

        void deleteByIdAndUser(Long id, User user);

        void deleteByUser(User user);

        Optional<Book> findByIdAndUser(Long id, User user);

        Optional<Book> findByIdAndUserId(Long id, Long userId);

        @Query("SELECT b.author FROM Book b WHERE b.user = :user AND b.author IS NOT NULL GROUP BY b.author ORDER BY COUNT(b) DESC")
        List<String> findTopAuthorsByUser(@Param("user") User user);

        @Query("SELECT b.categories FROM Book b WHERE b.user = :user AND b.categories IS NOT NULL")
        List<String> findAllCategoriesByUser(@Param("user") User user);

        @Query("SELECT b.isbn FROM Book b WHERE b.user = :user")
        List<String> findAllIsbnsByUser(@Param("user") User user);
}
