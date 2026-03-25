package com.example.readflow.discovery;

import com.example.readflow.auth.User;
import com.example.readflow.books.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DiscoveryUserDataServiceTest {

    @Mock
    private SearchHistoryService searchHistoryService;

    @Mock
    private BookRepository bookRepository;

    @InjectMocks
    private DiscoveryUserDataService userDataService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
    }

    @Test
    void getTopAuthors_ShouldReturnLimitedList() {
        when(bookRepository.findTopAuthorsByUser(user, PageRequest.of(0, 2))).thenReturn(List.of("A", "B"));

        List<String> result = userDataService.getTopAuthors(user, 2);

        assertEquals(2, result.size());
    }

    @Test
    void getTopCategories_ShouldReturnLimitedList() {
        when(bookRepository.findTopCategoriesByUser(user, PageRequest.of(0, 2))).thenReturn(List.of("Thriller", "Krimi"));

        List<String> result = userDataService.getTopCategories(user, 2);

        assertEquals(2, result.size());
    }

    @Test
    void getOwnedIsbns_ShouldReturnSet() {
        when(bookRepository.findAllIsbnsByUser(user)).thenReturn(List.of("isbn1", "isbn2"));

        Set<String> result = userDataService.getOwnedIsbns(user);

        assertEquals(2, result.size());
        assertTrue(result.contains("isbn1"));
    }

    @Test
    void getSnapshot_ShouldCombineUserDiscoveryData() {
        when(bookRepository.findAllIsbnsByUser(user)).thenReturn(List.of("isbn1"));
        when(bookRepository.findTopAuthorsByUser(user, PageRequest.of(0, 3))).thenReturn(List.of("Author1"));
        when(bookRepository.findTopCategoriesByUser(user, PageRequest.of(0, 3))).thenReturn(List.of("Cat1"));
        when(searchHistoryService.getRecentSearches(user, 5)).thenReturn(List.of("query1"));

        DiscoverySnapshot snapshot = userDataService.getSnapshot(user, 3, 5);

        assertEquals(Set.of("isbn1"), snapshot.ownedIsbns());
        assertEquals(List.of("Author1"), snapshot.topAuthors());
        assertEquals(List.of("Cat1"), snapshot.topCategories());
        assertEquals(List.of("query1"), snapshot.recentSearches());
    }
}
