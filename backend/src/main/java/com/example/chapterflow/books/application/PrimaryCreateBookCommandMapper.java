package com.example.chapterflow.books.application;

import com.example.chapterflow.books.domain.Book;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
@Primary
public class PrimaryCreateBookCommandMapper implements CreateBookCommandMapper {

    @Override
    public Book toEntity(CreateBookCommand command) {
        if (command == null) {
            return null;
        }

        Book book = new Book();
        book.setAuthor(command.authorName());
        book.setIsbn(command.isbn());
        book.setTitle(command.title());
        book.setPublishYear(command.publishYear());
        book.setCoverUrl(command.coverUrl());
        book.setPageCount(command.pageCount());

        if (command.categories() != null) {
            book.setCategories(new ArrayList<>(command.categories()));
        }

        return book;
    }
}
