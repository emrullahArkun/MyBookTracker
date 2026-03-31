package com.example.mybooktracker.books.application;

import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.books.domain.Book;
import com.example.mybooktracker.books.domain.ReadingGoalType;
import com.example.mybooktracker.books.infra.persistence.BookRepository;
import com.example.mybooktracker.sessions.application.ReadingSessionQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static com.example.mybooktracker.support.BookFixtures.book;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookCollectionViewServiceTest {

    @Mock
    private BookRepository bookRepository;

    @Mock
    private ReadingSessionQueryPort readingSessionQueryPort;

    private BookCollectionViewService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new BookCollectionViewService(bookRepository, readingSessionQueryPort);
        user = new User();
        user.setId(1L);
    }

    @Test
    void getSectionPage_ShouldSortCurrentBooksByActiveSessionThenProgressThenTitle() {
        Book active = book().id(2L).title("zeta").currentPage(10).completed(false).build();
        Book highestProgress = book().id(3L).title("beta").currentPage(40).completed(false).build();
        Book tieLowerTitle = book().id(4L).title("Alpha").currentPage(20).completed(false).build();
        Book tieHigherTitle = book().id(5L).title("delta").currentPage(20).completed(false).build();
        Book nullTitle = book().id(6L).title(null).currentPage(20).completed(false).build();
        Book next = book().id(7L).title("queued").currentPage(0).completed(false).build();
        Book finished = book().id(8L).title("done").currentPage(100).completed(true).build();

        when(bookRepository.findByUser(user))
                .thenReturn(List.of(next, highestProgress, tieHigherTitle, tieLowerTitle, active, nullTitle, finished));
        when(readingSessionQueryPort.findActiveBookId(user)).thenReturn(Optional.of(2L));

        Page<Book> page = service.getSectionPage(user, BookSection.CURRENT, PageRequest.of(0, 10));

        assertEquals(List.of(active, highestProgress, tieLowerTitle, tieHigherTitle, nullTitle), page.getContent());
    }

    @Test
    void getSectionPage_ShouldSortNextBooksByGoalThenTitleAndPaginate() {
        Book goalAlpha = book().id(1L).title("Alpha").currentPage(0).completed(false).goal(ReadingGoalType.WEEKLY, 10)
                .build();
        Book goalNullTitle = book().id(2L).title(null).currentPage(0).completed(false).goal(ReadingGoalType.MONTHLY, 20)
                .build();
        Book noGoalBeta = book().id(3L).title("beta").currentPage(0).completed(false).build();
        Book noGoalGamma = book().id(4L).title("gamma").currentPage(0).completed(false).build();
        Book current = book().id(5L).title("current").currentPage(5).completed(false).build();

        when(bookRepository.findByUser(user)).thenReturn(List.of(noGoalGamma, current, goalNullTitle, noGoalBeta, goalAlpha));
        when(readingSessionQueryPort.findActiveBookId(user)).thenReturn(Optional.empty());

        Page<Book> page = service.getSectionPage(user, BookSection.NEXT, PageRequest.of(0, 3));

        assertEquals(List.of(goalAlpha, goalNullTitle, noGoalBeta), page.getContent());
        assertEquals(4, page.getTotalElements());
    }

    @Test
    void getSectionPage_ShouldSortFinishedBooksAndReturnEmptyPageWhenOffsetIsOutOfRange() {
        Book highestProgress = book().id(1L).title("Zulu").currentPage(500).completed(true).build();
        Book sameProgressAlpha = book().id(2L).title("Alpha").currentPage(200).completed(true).build();
        Book sameProgressNullTitle = book().id(3L).title(null).currentPage(200).completed(true).build();
        Book notFinished = book().id(4L).title("Current").currentPage(20).completed(false).build();

        when(bookRepository.findByUser(user)).thenReturn(List.of(notFinished, sameProgressNullTitle, highestProgress, sameProgressAlpha));
        when(readingSessionQueryPort.findActiveBookId(user)).thenReturn(Optional.empty());

        Page<Book> firstPage = service.getSectionPage(user, BookSection.FINISHED, PageRequest.of(0, 10));
        Page<Book> emptyPage = service.getSectionPage(user, BookSection.FINISHED, PageRequest.of(2, 5));

        assertEquals(List.of(highestProgress, sameProgressAlpha, sameProgressNullTitle), firstPage.getContent());
        assertTrue(emptyPage.getContent().isEmpty());
        assertEquals(3, emptyPage.getTotalElements());
    }

    @Test
    void getFocus_ShouldPreferCurrentBookAndExcludeItFromQueue() {
        Book active = book().id(10L).title("Active").currentPage(30).completed(false).build();
        Book current = book().id(11L).title("Current").currentPage(20).completed(false).build();
        Book nextWithGoal = book().id(12L).title("Goal").currentPage(0).completed(false).goal(ReadingGoalType.WEEKLY, 5)
                .build();
        Book nextPlain = book().id(13L).title("Later").currentPage(0).completed(false).build();
        Book finished = book().id(14L).title("Done").currentPage(200).completed(true).build();

        when(bookRepository.findByUser(user)).thenReturn(List.of(nextPlain, finished, current, active, nextWithGoal));
        when(readingSessionQueryPort.findActiveBookId(user)).thenReturn(Optional.of(10L));

        BookFocusView focus = service.getFocus(user, 1);

        assertEquals(active, focus.currentBook());
        assertEquals(List.of(nextWithGoal), focus.queuedBooks());
        assertEquals(4, focus.activeBooksCount());
        assertEquals(1, focus.completedBooksCount());
    }

    @Test
    void getFocus_ShouldFallbackToNextBookAndClampNegativeQueueLimitToZero() {
        Book nextWithGoal = book().id(21L).title("Goal").currentPage(null).completed(false).goal(ReadingGoalType.WEEKLY, 5)
                .build();
        Book nextPlain = book().id(22L).title("Later").currentPage(0).completed(false).build();

        when(bookRepository.findByUser(user)).thenReturn(List.of(nextPlain, nextWithGoal));
        when(readingSessionQueryPort.findActiveBookId(user)).thenReturn(Optional.empty());

        BookFocusView focus = service.getFocus(user, -5);

        assertEquals(nextWithGoal, focus.currentBook());
        assertTrue(focus.queuedBooks().isEmpty());
        assertEquals(2, focus.activeBooksCount());
        assertEquals(0, focus.completedBooksCount());
    }

    @Test
    void getFocus_ShouldReturnNullCurrentBookWhenCollectionIsEmpty() {
        when(bookRepository.findByUser(user)).thenReturn(List.of());
        when(readingSessionQueryPort.findActiveBookId(user)).thenReturn(Optional.empty());

        BookFocusView focus = service.getFocus(user, 3);

        assertNull(focus.currentBook());
        assertTrue(focus.queuedBooks().isEmpty());
        assertEquals(0, focus.activeBooksCount());
        assertEquals(0, focus.completedBooksCount());
    }
}
