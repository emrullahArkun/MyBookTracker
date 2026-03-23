package com.example.readflow.books;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookProgressService {

    @Transactional
    public Book updateProgress(Book book, Integer currentPage) {
        if (currentPage < 0) {
            throw new IllegalArgumentException("Current page cannot be negative");
        }
        if (book.getPageCount() != null && currentPage > book.getPageCount()) {
            throw new IllegalArgumentException("Current page cannot exceed total page count");
        }

        book.setCurrentPage(currentPage);

        if (book.getPageCount() != null) {
            book.setCompleted(currentPage >= book.getPageCount());
        }

        return book;
    }
}
