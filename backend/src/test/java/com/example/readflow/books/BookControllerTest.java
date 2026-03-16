package com.example.readflow.books;

import com.example.readflow.books.dto.BookDto;
import com.example.readflow.books.dto.CreateBookRequest;
import com.example.readflow.books.dto.UpdateProgressRequest;
import com.example.readflow.books.dto.UpdateStatusRequest;
import com.example.readflow.books.dto.SetGoalRequest;
import com.example.readflow.auth.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class BookControllerTest {

        @Mock
        private BookService bookService;

        @Mock
        private BookMapper bookMapper;

        @InjectMocks
        private BookController bookController;

        private MockMvc mockMvc;
        private ObjectMapper objectMapper;
        private User user;

        @BeforeEach
        void setUp() {
                user = new User();
                user.setId(1L);

                HandlerMethodArgumentResolver putPrincipal = new HandlerMethodArgumentResolver() {
                        @Override
                        public boolean supportsParameter(MethodParameter parameter) {
                                return parameter.getParameterType().isAssignableFrom(User.class);
                        }

                        @Override
                        public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                        NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                                return user;
                        }
                };

                mockMvc = MockMvcBuilders.standaloneSetup(bookController)
                                .setCustomArgumentResolvers(putPrincipal)
                                .setMessageConverters(createPageAwareMessageConverter())
                                .build();
                objectMapper = new ObjectMapper();
        }

        private org.springframework.http.converter.json.MappingJackson2HttpMessageConverter createPageAwareMessageConverter() {
                ObjectMapper om = new ObjectMapper();
                om.registerModule(new org.springframework.data.web.config.SpringDataJacksonConfiguration.PageModule());
                return new org.springframework.http.converter.json.MappingJackson2HttpMessageConverter(om);
        }

        @Test
        void getAllBooks_ShouldReturnPage() throws Exception {
                // Create a concrete list to avoid potential issues with empty/immutable lists
                // in PageImpl serialization
                Book book = new Book();
                book.setId(1L);
                List<Book> books = new java.util.ArrayList<>(List.of(book));
                Page<Book> page = new PageImpl<>(books);

                when(bookService.findAllByUser(any(), any(Pageable.class))).thenReturn(page);
                when(bookMapper.toDto(any(Book.class))).thenReturn(
                                new BookDto(1L, "isbn", "title", "author", "date", "url", 100, 0, null, false, null,
                                                null, null, null));

                mockMvc.perform(get("/api/books")
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content").exists())
                                .andExpect(jsonPath("$.content[0].id").value(1));
        }

        @Test
        void getAllOwnedIsbns_ShouldReturnList() throws Exception {
                when(bookService.getAllOwnedIsbns(any())).thenReturn(List.of("123"));

                mockMvc.perform(get("/api/books/owned"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0]").value("123"));
        }

        @Test
        void getBookById_ShouldReturnBook() throws Exception {
                Book book = new Book();
                when(bookService.findByIdAndUser(eq(1L), any())).thenReturn(Optional.of(book));
                when(bookMapper.toDto(book)).thenReturn(
                                new BookDto(1L, "isbn", "title", "author", "date", "url", 100, 0, null, false, null,
                                                null, null, null));

                mockMvc.perform(get("/api/books/1"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(1));
        }

        @Test
        void createBook_ShouldReturnCreatedBook() throws Exception {
                CreateBookRequest request = new CreateBookRequest("isbn", "title", "author", "date", "url", 100, "cat");
                Book book = new Book();
                when(bookService.createBook(any(), any())).thenReturn(book);
                when(bookMapper.toDto(book)).thenReturn(
                                new BookDto(1L, "isbn", "title", "author", "date", "url", 100, 0, null, false, null,
                                                null, null, null));

                mockMvc.perform(post("/api/books")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated());
        }

        @Test
        void updateBookProgress_ShouldUpdate() throws Exception {
                UpdateProgressRequest request = new UpdateProgressRequest(50);
                Book book = new Book();
                when(bookService.updateBookProgress(eq(1L), eq(50), any())).thenReturn(book);
                when(bookMapper.toDto(book))
                                .thenReturn(new BookDto(1L, "isbn", "title", "author", "date", "url", 100, 50, null,
                                                false, null, null, null, null));

                mockMvc.perform(patch("/api/books/1/progress")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk());
        }

        @Test
        void updateBookStatus_ShouldUpdate() throws Exception {
                UpdateStatusRequest request = new UpdateStatusRequest(true);
                Book book = new Book();
                when(bookService.updateBookStatus(eq(1L), eq(true), any())).thenReturn(book);
                when(bookMapper.toDto(book)).thenReturn(
                                new BookDto(1L, "isbn", "title", "author", "date", "url", 100, 0, null, true, null,
                                                null, null, null));

                mockMvc.perform(patch("/api/books/1/status")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk());
        }

        @Test
        void updateBookGoal_ShouldUpdate() throws Exception {
                SetGoalRequest request = new SetGoalRequest(ReadingGoalType.WEEKLY, 100);
                Book book = new Book();
                when(bookService.updateReadingGoal(eq(1L), eq(ReadingGoalType.WEEKLY), eq(100), any()))
                                .thenReturn(book);
                when(bookMapper.toDto(book))
                                .thenReturn(new BookDto(1L, "isbn", "title", "author", "date", "url", 100, 0, null,
                                                false, "WEEKLY", 100, null, null));

                mockMvc.perform(patch("/api/books/1/goal")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk());
        }

        @Test
        void deleteBook_ShouldDelete() throws Exception {
                mockMvc.perform(delete("/api/books/1"))
                                .andExpect(status().isNoContent());

                verify(bookService).deleteByIdAndUser(eq(1L), any());
        }

        @Test
        void deleteAllBooks_ShouldDeleteAll() throws Exception {
                mockMvc.perform(delete("/api/books"))
                                .andExpect(status().isNoContent());

                verify(bookService).deleteAllByUser(any());
        }
}
