package com.example.readflow.books;

import com.example.readflow.auth.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {

        boolean existsByIsbnAndUser(String isbn, User user);

        List<Book> findByUser(User user);

        Page<Book> findByUserOrderByCompletedAsc(User user, Pageable pageable);

        void deleteByUser(User user);

        Optional<Book> findByIdAndUser(Long id, User user);

        @Query("SELECT b.author FROM Book b WHERE b.user = :user AND b.author IS NOT NULL GROUP BY b.author ORDER BY COUNT(b) DESC")
        List<String> findTopAuthorsByUser(@Param("user") User user, Pageable pageable);

        @Query("SELECT c FROM Book b JOIN b.categories c WHERE b.user = :user")
        List<String> findAllCategoriesByUser(@Param("user") User user);

        @Query("SELECT c FROM Book b JOIN b.categories c WHERE b.user = :user AND c IS NOT NULL AND c <> '' GROUP BY c ORDER BY COUNT(c) DESC")
        List<String> findTopCategoriesByUser(@Param("user") User user, Pageable pageable);

        @Query("SELECT b.isbn FROM Book b WHERE b.user = :user")
        List<String> findAllIsbnsByUser(@Param("user") User user);

        long countByUser(User user);

        long countByUserAndCompletedTrue(User user);



        List<Book> findByUserAndReadingGoalTypeIsNotNull(User user);
}
