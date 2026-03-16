package com.example.readflow.books;

import com.example.readflow.books.dto.CreateBookRequest;

import com.example.readflow.books.Book;
import com.example.readflow.auth.User;

import com.example.readflow.books.BookRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@SuppressWarnings("null")
@org.springframework.security.test.context.support.WithMockUser(username = "admin", roles = { "USER" })
public class BookControllerIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private BookRepository bookRepository;

        @Autowired
        private com.example.readflow.auth.UserRepository userRepository;

        @Autowired
        private ObjectMapper objectMapper;

        private User defaultUser;

        @BeforeEach
        void setUp() {
                bookRepository.deleteAll();

                userRepository.deleteAll();

                // Create the user that matches @WithMockUser
                defaultUser = new User();
                defaultUser.setEmail("admin");
                defaultUser.setPassword("password");
                defaultUser.setRole(com.example.readflow.auth.Role.USER);
                defaultUser.setEnabled(true);
                userRepository.save(defaultUser);
        }

        @Test
        void shouldCreateBook() throws Exception {
                // Given
                String author = "J.K. Rowling";

                // When
                CreateBookRequest request = new CreateBookRequest(
                                "978-1234567890", "Harry Potter", author, "2001", "http://cover.url",
                                250, null);

                // Then
                mockMvc.perform(post("/api/books")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id").exists())
                                .andExpect(jsonPath("$.title", is("Harry Potter")))
                                .andExpect(jsonPath("$.authorName", is(author)));
        }

        @Test
        void shouldCreateBookWithAuthorName() throws Exception {
                // When: Creating a book with ONLY author name
                CreateBookRequest request = new CreateBookRequest(
                                "978-9876543210", "New Book", "New Author", null, null, null, null);

                mockMvc.perform(post("/api/books")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id").exists())
                                .andExpect(jsonPath("$.title", is("New Book")));
        }

        @Test
        void shouldGetMyBooks() throws Exception {
                // Given
                createBook("My Book", "111-111", "Test Author");

                // When / Then
                mockMvc.perform(get("/api/books"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content", hasSize(1)))
                                .andExpect(jsonPath("$.content[0].title", is("My Book")));
        }

        @Test
        void shouldUpdateBookStatus() throws Exception {
                // Given
                Book savedBook = createBook("Status Book", "222-222", "Status Author");

                // When
                Map<String, Boolean> updateRequest = Map.of("completed", true);

                // Then
                mockMvc.perform(patch("/api/books/" + savedBook.getId() + "/status")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(updateRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.completed", is(true)));
        }

        @Test
        void shouldUpdateBookProgress() throws Exception {
                // Given
                Book savedBook = createBook("Progress Book", "333-333", "Progress Author");
                savedBook.setCurrentPage(0);
                savedBook.setPageCount(100);
                bookRepository.save(savedBook);

                // When
                Map<String, Integer> updateRequest = Map.of("currentPage", 50);

                // Then
                mockMvc.perform(patch("/api/books/" + savedBook.getId() + "/progress")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(updateRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.currentPage", is(50)));
        }

        @Test
        void shouldDeleteBook() throws Exception {
                // Given
                Book savedBook = createBook("Delete Book", "444-444", "Delete Author");

                // When
                mockMvc.perform(delete("/api/books/" + savedBook.getId()))
                                .andExpect(status().isNoContent());

                // Then
                mockMvc.perform(get("/api/books/" + savedBook.getId()))
                                .andExpect(status().isNotFound());
        }

        // --- Helper Methods ---

        private Book createBook(String title, String isbn, String author) {
                Book book = new Book();
                book.setTitle(title);
                book.setIsbn(isbn);
                book.setAuthor(author);
                book.setUser(defaultUser);
                book.setCompleted(false);
                return bookRepository.save(book);
        }
}
