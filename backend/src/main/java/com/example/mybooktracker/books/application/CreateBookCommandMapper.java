package com.example.mybooktracker.books.application;

import com.example.mybooktracker.books.domain.Book;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
public class CreateBookCommandMapper {

    public Book toEntity(CreateBookCommand command) {
        if (command == null) {
            return null;
        }

        return Book.create(
                command.isbn(),
                command.title(),
                command.authorName(),
                command.publishYear(),
                command.coverUrl(),
                command.pageCount(),
                command.categories() != null ? new ArrayList<>(command.categories()) : null);
    }
}
