package com.example.mybooktracker.books.api;

import com.example.mybooktracker.books.api.dto.BookDto;
import com.example.mybooktracker.books.domain.Book;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class BookMapper {

    public BookDto toDto(Book book) {
        if (book == null) {
            return null;
        }

        List<String> categories = book.getCategories() == null ? List.of() : List.copyOf(book.getCategories());

        return new BookDto(
                book.getId(),
                book.getIsbn(),
                book.getTitle(),
                book.getAuthor(),
                book.getPublishYear(),
                book.getCoverUrl(),
                book.getPageCount(),
                book.getCurrentPage(),
                book.getStartDate(),
                book.getCompleted(),
                book.getReadingGoal().getType(),
                book.getReadingGoal().getPages(),
                // Goal progress is derived later in the application layer once period context is available.
                null,
                categories
        );
    }
}
