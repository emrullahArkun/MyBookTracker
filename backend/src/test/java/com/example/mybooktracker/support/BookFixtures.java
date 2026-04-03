package com.example.mybooktracker.support;

import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.books.domain.Book;
import com.example.mybooktracker.books.domain.ReadingGoal;
import com.example.mybooktracker.books.domain.ReadingGoalType;

import java.time.LocalDate;
import java.util.List;

public final class BookFixtures {

    private BookFixtures() {
    }

    public static Builder book() {
        return new Builder();
    }

    public static final class Builder {
        private Long id;
        private String isbn;
        private String title;
        private String author;
        private User user;
        private Integer publishYear;
        private String coverUrl;
        private Integer pageCount;
        private Integer currentPage;
        private LocalDate startDate;
        private Boolean completed;
        private ReadingGoalType readingGoalType;
        private Integer readingGoalPages;
        private List<String> categories;


        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder isbn(String isbn) {
            this.isbn = isbn;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder author(String author) {
            this.author = author;
            return this;
        }

        public Builder user(User user) {
            this.user = user;
            return this;
        }

        public Builder publishYear(Integer publishYear) {
            this.publishYear = publishYear;
            return this;
        }

        public Builder coverUrl(String coverUrl) {
            this.coverUrl = coverUrl;
            return this;
        }

        public Builder pageCount(Integer pageCount) {
            this.pageCount = pageCount;
            return this;
        }

        public Builder currentPage(Integer currentPage) {
            this.currentPage = currentPage;
            return this;
        }

        public Builder startDate(LocalDate startDate) {
            this.startDate = startDate;
            return this;
        }

        public Builder completed(Boolean completed) {
            this.completed = completed;
            return this;
        }

        public Builder goal(ReadingGoalType type, Integer pages) {
            this.readingGoalType = type;
            this.readingGoalPages = pages;
            return this;
        }

        public Builder categories(List<String> categories) {
            this.categories = categories;
            return this;
        }

        public Book build() {
            return Book.restore(
                    id,
                    isbn,
                    title,
                    author,
                    user,
                    publishYear,
                    coverUrl,
                    pageCount,
                    currentPage,
                    startDate,
                    completed,
                    ReadingGoal.of(readingGoalType, readingGoalPages),
                    categories);
        }
    }
}
