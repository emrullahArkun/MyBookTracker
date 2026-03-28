package com.example.chapterflow.books.api;

import com.example.chapterflow.books.api.dto.BookDto;
import com.example.chapterflow.books.domain.Book;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Primary
public class PrimaryBookMapper implements BookMapper {

    @Override
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
                book.getReadingGoalType(),
                book.getReadingGoalPages(),
                null,
                categories
        );
    }
}
