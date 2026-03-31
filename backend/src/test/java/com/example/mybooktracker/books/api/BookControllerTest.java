package com.example.mybooktracker.books.api;

import com.example.mybooktracker.books.api.dto.BookDto;
import com.example.mybooktracker.books.application.BookCollectionViewService;
import com.example.mybooktracker.books.application.BookFocusView;
import com.example.mybooktracker.books.api.dto.CreateBookRequest;
import com.example.mybooktracker.books.api.dto.UpdateProgressRequest;
import com.example.mybooktracker.books.api.dto.UpdateStatusRequest;
import com.example.mybooktracker.books.api.dto.SetGoalRequest;
import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.books.application.BookService;
import com.example.mybooktracker.books.application.ReadingGoalProgressService;
import com.example.mybooktracker.books.domain.Book;
import com.example.mybooktracker.books.domain.ReadingGoalType;
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
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.data.web.config.SpringDataJackson3Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static com.example.mybooktracker.support.BookFixtures.book;

@ExtendWith(MockitoExtension.class)
class BookControllerTest {

        @Mock
        private BookService bookService;

        @Mock
        private BookMapper bookMapper;

        @Mock
        private ReadingGoalProgressService progressService;

        @Mock
        private BookCollectionViewService bookCollectionViewService;

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
                                .setCustomArgumentResolvers(putPrincipal, new PageableHandlerMethodArgumentResolver())
                                .setMessageConverters(createPageAwareMessageConverter())
                                .build();
                objectMapper = new ObjectMapper();
        }

        private JacksonJsonHttpMessageConverter createPageAwareMessageConverter() {
                JsonMapper mapper = JsonMapper.builder()
                                .addModule(new SpringDataJackson3Configuration.PageModule(
                                                new org.springframework.data.web.config.SpringDataWebSettings(
                                                                org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode.DIRECT)))
                                .build();
                return new JacksonJsonHttpMessageConverter(mapper);
        }

        @Test
        void getAllBooks_ShouldReturnPage() throws Exception {
                Book book = book().id(1L).build();
                List<Book> books = new java.util.ArrayList<>(List.of(book));
                Page<Book> page = new PageImpl<>(books);

                when(bookService.findAllByUser(any(), any(Pageable.class))).thenReturn(page);
                when(progressService.calculateProgressBatch(anyList())).thenReturn(Map.of());
                when(bookMapper.toDto(any(Book.class))).thenReturn(
                                new BookDto(1L, "isbn", "title", "author", 2023, "url", 100, 0, null, false, null,
                                                null, null, null));

                mockMvc.perform(get("/api/books")
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content").exists())
                                .andExpect(jsonPath("$.content[0].id").value(1));
        }

        @Test
        void getAllBooks_ShouldIncludeProgress_WhenCalculated() throws Exception {
                Book book = book().id(1L).build();
                List<Book> books = new java.util.ArrayList<>(List.of(book));
                Page<Book> page = new PageImpl<>(books);

                when(bookService.findAllByUser(any(), any(Pageable.class))).thenReturn(page);
                when(progressService.calculateProgressBatch(anyList())).thenReturn(Map.of(1L, 40));
                when(bookMapper.toDto(any(Book.class))).thenReturn(
                                new BookDto(1L, "isbn", "title", "author", 2023, "url", 100, 0, null, false, null,
                                                null, null, null));

                mockMvc.perform(get("/api/books")
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].id").value(1))
                                .andExpect(jsonPath("$.content[0].readingGoalProgress").value(40));
        }

        @Test
        void getBooksBySection_ShouldReturnPagedSection() throws Exception {
                Book book = book().id(1L).build();
                Page<Book> page = new PageImpl<>(List.of(book));

                when(bookCollectionViewService.getSectionPage(any(), any(), any(Pageable.class))).thenReturn(page);
                when(progressService.calculateProgressBatch(anyList())).thenReturn(Map.of());
                when(bookMapper.toDto(any(Book.class))).thenReturn(
                                new BookDto(1L, "isbn", "title", "author", 2023, "url", 100, 0, null, false, null,
                                                null, null, null));

                mockMvc.perform(get("/api/books/sections/current")
                                .param("page", "0")
                                .param("size", "4"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].id").value(1));
        }

        @Test
        void getBookFocus_ShouldReturnCurrentBookAndCounts() throws Exception {
                Book currentBook = book().id(1L).build();
                Book queuedBook = book().id(2L).build();

                when(bookCollectionViewService.getFocus(any(), eq(3)))
                                .thenReturn(new BookFocusView(currentBook, List.of(queuedBook), 4, 2));
                when(bookMapper.toDto(currentBook)).thenReturn(
                                new BookDto(1L, "isbn-1", "Current", "Author", 2023, "url", 100, 20, null, false,
                                                null, null, null, List.of()));
                when(bookMapper.toDto(queuedBook)).thenReturn(
                                new BookDto(2L, "isbn-2", "Queued", "Author", 2023, "url", 100, 0, null, false,
                                                null, null, null, List.of()));

                mockMvc.perform(get("/api/books/focus"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.currentBook.id").value(1))
                                .andExpect(jsonPath("$.queuedBooks[0].id").value(2))
                                .andExpect(jsonPath("$.activeBooksCount").value(4))
                                .andExpect(jsonPath("$.completedBooksCount").value(2));
        }

        @Test
        void getAllOwnedIsbns_ShouldReturnList() throws Exception {
                when(bookService.getAllOwnedIsbns(any())).thenReturn(List.of("123"));

                mockMvc.perform(get("/api/books/owned"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0]").value("123"));
        }

        @Test
        void getBooksWithGoals_ShouldReturnBooks() throws Exception {
                Book book = book().id(1L).build();
                when(bookService.findBooksWithGoals(any())).thenReturn(List.of(book));
                when(progressService.calculateProgressBatch(anyList())).thenReturn(Map.of());
                when(bookMapper.toDto(any(Book.class))).thenReturn(
                                new BookDto(1L, "isbn", "title", "author", 2023, "url", 100, 0, null, false, null,
                                                null, null, null));

                mockMvc.perform(get("/api/books/with-goals"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].id").value(1))
                                .andExpect(jsonPath("$[0].readingGoalProgress").doesNotExist());
        }

        @Test
        void getBooksWithGoals_ShouldIncludeProgress_WhenCalculated() throws Exception {
                Book book = book().id(1L).build();
                when(bookService.findBooksWithGoals(any())).thenReturn(List.of(book));
                when(progressService.calculateProgressBatch(anyList())).thenReturn(Map.of(1L, 75));
                when(bookMapper.toDto(any(Book.class))).thenReturn(
                                new BookDto(1L, "isbn", "title", "author", 2023, "url", 100, 0, null, false, null,
                                                null, null, null));

                mockMvc.perform(get("/api/books/with-goals"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].id").value(1))
                                .andExpect(jsonPath("$[0].readingGoalProgress").value(75));
        }

        @Test
        void getBookById_ShouldReturnBook() throws Exception {
                Book book = book().build();
                when(bookService.getBookByIdOrThrow(eq(1L), any())).thenReturn(book);
                when(bookMapper.toDto(book)).thenReturn(
                                new BookDto(1L, "isbn", "title", "author", 2023, "url", 100, 0, null, false, null,
                                                null, null, null));

                mockMvc.perform(get("/api/books/1"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(1));
        }

        @Test
        void getBookById_ShouldIncludeProgress_WhenCalculated() throws Exception {
                Book book = book().id(1L).build();
                when(bookService.getBookByIdOrThrow(eq(1L), any())).thenReturn(book);
                when(progressService.calculateProgress(book)).thenReturn(60);
                when(bookMapper.toDto(book)).thenReturn(
                                new BookDto(1L, "isbn", "title", "author", 2023, "url", 100, 0, null, false, null,
                                                null, null, null));

                mockMvc.perform(get("/api/books/1"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(1))
                                .andExpect(jsonPath("$.readingGoalProgress").value(60));
        }

        @Test
        void createBook_ShouldReturnCreatedBook() throws Exception {
                CreateBookRequest request = new CreateBookRequest("isbn", "title", "author", 2023, "url", 100,
                                List.of("cat"));
                Book book = book().id(1L).build();
                when(bookService.createBook(any(), any())).thenReturn(book);
                when(progressService.calculateProgress(book)).thenReturn(30);
                when(bookMapper.toDto(book)).thenReturn(
                                new BookDto(1L, "isbn", "title", "author", 2023, "url", 100, 0, null, false, null,
                                                null, null, null));

                mockMvc.perform(post("/api/books")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(header().exists("Location"))
                                .andExpect(jsonPath("$.readingGoalProgress").value(30));
        }

        @Test
        void updateBookProgress_ShouldUpdate() throws Exception {
                UpdateProgressRequest request = new UpdateProgressRequest(50);
                Book book = book().build();
                when(bookService.updateBookProgress(eq(1L), eq(50), any())).thenReturn(book);
                when(progressService.calculateProgress(book)).thenReturn(55);
                when(bookMapper.toDto(book))
                                .thenReturn(new BookDto(1L, "isbn", "title", "author", 2023, "url", 100, 50, null,
                                                false, null, null, null, null));

                mockMvc.perform(patch("/api/books/1/progress")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.readingGoalProgress").value(55));
        }

        @Test
        void updateBookStatus_ShouldUpdate() throws Exception {
                UpdateStatusRequest request = new UpdateStatusRequest(true);
                Book book = book().build();
                when(bookService.updateBookStatus(eq(1L), eq(true), any())).thenReturn(book);
                when(progressService.calculateProgress(book)).thenReturn(65);
                when(bookMapper.toDto(book)).thenReturn(
                                new BookDto(1L, "isbn", "title", "author", 2023, "url", 100, 0, null, true, null,
                                                null, null, null));

                mockMvc.perform(patch("/api/books/1/status")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.readingGoalProgress").value(65));
        }

        @Test
        void updateBookGoal_ShouldUpdate() throws Exception {
                SetGoalRequest request = new SetGoalRequest(ReadingGoalType.WEEKLY, 100);
                Book book = book().build();
                when(bookService.updateReadingGoal(eq(1L), eq(ReadingGoalType.WEEKLY), eq(100), any()))
                                .thenReturn(book);
                when(progressService.calculateProgress(book)).thenReturn(75);
                when(bookMapper.toDto(book))
                                .thenReturn(new BookDto(1L, "isbn", "title", "author", 2023, "url", 100, 0, null,
                                                false, ReadingGoalType.WEEKLY, 100, null, null));

                mockMvc.perform(patch("/api/books/1/goal")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.readingGoalProgress").value(75));
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
