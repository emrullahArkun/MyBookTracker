package com.example.readflow.books;

import com.example.readflow.books.dto.CreateBookRequest;
import com.example.readflow.auth.User;
import com.example.readflow.auth.Role;
import com.example.readflow.auth.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class BookControllerIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private BookRepository bookRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private ObjectMapper objectMapper;

        private User defaultUser;

        @BeforeEach
        void setUp() {
                bookRepository.deleteAll();
                userRepository.deleteAll();

                defaultUser = new User();
                defaultUser.setEmail("admin@test.com");
                defaultUser.setPassword("password");
                defaultUser.setRole(Role.USER);
                defaultUser.setEnabled(true);
                defaultUser = userRepository.save(defaultUser);
        }

        @Test
        void shouldCreateBook() throws Exception {
                CreateBookRequest request = new CreateBookRequest(
                                "978-1234567890", "Harry Potter", "J.K. Rowling", "2001", "http://cover.url",
                                250, null);

                mockMvc.perform(post("/api/books")
                                .with(jwtForUser())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id").exists())
                                .andExpect(jsonPath("$.title", is("Harry Potter")));
        }

        @Test
        void shouldCreateBookWithAuthorName() throws Exception {
                CreateBookRequest request = new CreateBookRequest(
                                "978-9876543210", "New Book", "New Author", null, null, null, null);

                mockMvc.perform(post("/api/books")
                                .with(jwtForUser())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id").exists())
                                .andExpect(jsonPath("$.title", is("New Book")));
        }

        @Test
        void shouldGetMyBooks() throws Exception {
                createBook("My Book", "111-111", "Test Author");

                mockMvc.perform(get("/api/books").with(jwtForUser()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content", hasSize(1)))
                                .andExpect(jsonPath("$.content[0].title", is("My Book")));
        }

        @Test
        void shouldUpdateBookStatus() throws Exception {
                Book savedBook = createBook("Status Book", "222-222", "Status Author");

                Map<String, Boolean> updateRequest = Map.of("completed", true);

                mockMvc.perform(patch("/api/books/" + savedBook.getId() + "/status")
                                .with(jwtForUser())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(updateRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.completed", is(true)));
        }

        @Test
        void shouldUpdateBookProgress() throws Exception {
                Book savedBook = createBook("Progress Book", "333-333", "Progress Author");
                savedBook.setCurrentPage(0);
                savedBook.setPageCount(100);
                bookRepository.save(savedBook);

                Map<String, Integer> updateRequest = Map.of("currentPage", 50);

                mockMvc.perform(patch("/api/books/" + savedBook.getId() + "/progress")
                                .with(jwtForUser())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(updateRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.currentPage", is(50)));
        }

        @Test
        void shouldDeleteBook() throws Exception {
                Book savedBook = createBook("Delete Book", "444-444", "Delete Author");

                mockMvc.perform(delete("/api/books/" + savedBook.getId()).with(jwtForUser()))
                                .andExpect(status().isNoContent());

                mockMvc.perform(get("/api/books/" + savedBook.getId()).with(jwtForUser()))
                                .andExpect(status().isNotFound());
        }

        private org.springframework.test.web.servlet.request.RequestPostProcessor jwtForUser() {
                return jwt().jwt(builder -> builder
                        .subject(defaultUser.getEmail())
                        .claim("userId", defaultUser.getId())
                        .claim("role", defaultUser.getRole().name()));
        }

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
