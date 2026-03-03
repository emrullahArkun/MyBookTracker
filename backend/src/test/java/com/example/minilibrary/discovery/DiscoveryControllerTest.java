package com.example.minilibrary.discovery;

import com.example.minilibrary.auth.User;
import com.example.minilibrary.discovery.dto.RecommendedBookDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DiscoveryControllerTest {

        @Mock
        private DiscoveryService discoveryService;

        @InjectMocks
        private DiscoveryController discoveryController;

        private MockMvc mockMvc;

        @BeforeEach
        void setUp() {
                HandlerMethodArgumentResolver putPrincipal = new HandlerMethodArgumentResolver() {
                        @Override
                        public boolean supportsParameter(MethodParameter parameter) {
                                return parameter.getParameterType().isAssignableFrom(User.class);
                        }

                        @Override
                        public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                        NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                                return new User();
                        }
                };

                mockMvc = MockMvcBuilders.standaloneSetup(discoveryController)
                                .setCustomArgumentResolvers(putPrincipal)
                                .build();
        }

        @Test
        void logSearch_ShouldCallService() throws Exception {
                mockMvc.perform(post("/api/discovery/search-log")
                                .param("query", "test"))
                                .andExpect(status().isOk());

                verify(discoveryService).logSearch(anyString(), any());
        }

        @Test
        void getAuthorRecommendations_ShouldReturnData() throws Exception {
                when(discoveryService.getOwnedIsbns(any())).thenReturn(new HashSet<>());
                when(discoveryService.getTopAuthors(any(), anyInt())).thenReturn(List.of("Author1"));
                RecommendedBookDto book = new RecommendedBookDto(
                                "title", List.of("Author1"), List.of("Cat1"), "2023", 100, "isbn123", "url");
                when(discoveryService.getRecommendationsByAuthor(anyString(), any(), anyInt()))
                                .thenReturn(List.of(book));

                mockMvc.perform(get("/api/discovery/authors"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.authors[0]").value("Author1"))
                                .andExpect(jsonPath("$.books[0].title").value("title"));
        }

        @Test
        void getAuthorRecommendations_ShouldReturnEmptyBooks_WhenNoAuthors() throws Exception {
                when(discoveryService.getOwnedIsbns(any())).thenReturn(new HashSet<>());
                when(discoveryService.getTopAuthors(any(), anyInt())).thenReturn(Collections.emptyList());

                mockMvc.perform(get("/api/discovery/authors"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.authors").isEmpty())
                                .andExpect(jsonPath("$.books").isEmpty());
        }

        @Test
        void getCategoryRecommendations_ShouldReturnData() throws Exception {
                when(discoveryService.getOwnedIsbns(any())).thenReturn(new HashSet<>());
                when(discoveryService.getTopCategories(any(), anyInt())).thenReturn(List.of("Cat1"));
                RecommendedBookDto book = new RecommendedBookDto(
                                "title", List.of("Author1"), List.of("Cat1"), "2023", 100, "isbn123", "url");
                when(discoveryService.getRecommendationsByCategory(anyString(), any(), anyInt()))
                                .thenReturn(List.of(book));

                mockMvc.perform(get("/api/discovery/categories"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.categories[0]").value("Cat1"));
        }

        @Test
        void getCategoryRecommendations_ShouldReturnEmptyBooks_WhenNoCategories() throws Exception {
                when(discoveryService.getOwnedIsbns(any())).thenReturn(new HashSet<>());
                when(discoveryService.getTopCategories(any(), anyInt())).thenReturn(Collections.emptyList());

                mockMvc.perform(get("/api/discovery/categories"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.categories").isEmpty())
                                .andExpect(jsonPath("$.books").isEmpty());
        }

        @Test
        void getRecentSearchRecommendations_ShouldReturnData() throws Exception {
                when(discoveryService.getOwnedIsbns(any())).thenReturn(new HashSet<>());
                when(discoveryService.getRecentSearches(any(), anyInt())).thenReturn(List.of("Query1"));
                RecommendedBookDto book = new RecommendedBookDto(
                                "title", List.of("Author1"), List.of("Cat1"), "2023", 100, "isbn123", "url");
                when(discoveryService.getRecommendationsByQuery(anyString(), any(), anyInt()))
                                .thenReturn(List.of(book));

                mockMvc.perform(get("/api/discovery/recent-searches"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.queries[0]").value("Query1"));
        }

        @Test
        void getRecentSearchRecommendations_ShouldReturnEmptyBooks_WhenNoSearches() throws Exception {
                when(discoveryService.getOwnedIsbns(any())).thenReturn(new HashSet<>());
                when(discoveryService.getRecentSearches(any(), anyInt())).thenReturn(Collections.emptyList());

                mockMvc.perform(get("/api/discovery/recent-searches"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.queries").isEmpty())
                                .andExpect(jsonPath("$.books").isEmpty());
        }

        @Test
        void getDiscoveryData_ShouldReturnAllSections() throws Exception {
                when(discoveryService.getOwnedIsbns(any())).thenReturn(new HashSet<>());
                when(discoveryService.getTopAuthors(any(), anyInt())).thenReturn(Collections.emptyList());
                when(discoveryService.getTopCategories(any(), anyInt())).thenReturn(Collections.emptyList());
                when(discoveryService.getRecentSearches(any(), anyInt())).thenReturn(Collections.emptyList());

                mockMvc.perform(get("/api/discovery"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.byAuthor").exists())
                                .andExpect(jsonPath("$.byCategory").exists())
                                .andExpect(jsonPath("$.bySearch").exists());
        }

        @Test
        void getDiscoveryData_ShouldReturnAllSections_WithNonEmptyData() throws Exception {
                when(discoveryService.getOwnedIsbns(any())).thenReturn(new HashSet<>());
                when(discoveryService.getTopAuthors(any(), anyInt())).thenReturn(List.of("Author1"));
                when(discoveryService.getTopCategories(any(), anyInt())).thenReturn(List.of("Cat1"));
                when(discoveryService.getRecentSearches(any(), anyInt())).thenReturn(List.of("Query1"));

                RecommendedBookDto book = new RecommendedBookDto(
                                "title", List.of("Author1"), List.of("Cat1"), "2023", 100, "isbn123", "url");
                when(discoveryService.getRecommendationsByAuthor(anyString(), any(), anyInt()))
                                .thenReturn(List.of(book));
                when(discoveryService.getRecommendationsByCategory(anyString(), any(), anyInt()))
                                .thenReturn(List.of(book));
                when(discoveryService.getRecommendationsByQuery(anyString(), any(), anyInt()))
                                .thenReturn(List.of(book));

                mockMvc.perform(get("/api/discovery"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.byAuthor.authors[0]").value("Author1"))
                                .andExpect(jsonPath("$.byAuthor.books[0].title").value("title"))
                                .andExpect(jsonPath("$.byCategory.categories[0]").value("Cat1"))
                                .andExpect(jsonPath("$.bySearch.queries[0]").value("Query1"));
        }
}
