package com.example.readflow.auth;

import com.example.readflow.auth.dto.LoginRequest;
import com.example.readflow.auth.dto.RegisterRequest;
import com.example.readflow.shared.security.CurrentUser;
import com.example.readflow.shared.security.JwtTokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private JwtTokenService jwtTokenService;

    private AuthController authController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        authController = new AuthController(authService, jwtTokenService, 3600, false);

        User authenticatedUser = new User();
        authenticatedUser.setId(1L);
        authenticatedUser.setEmail("test@example.com");
        authenticatedUser.setRole(Role.USER);

        // Resolver that returns an authenticated user
        HandlerMethodArgumentResolver authResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterAnnotation(CurrentUser.class) != null
                        && parameter.getParameterType().equals(User.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                    NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return authenticatedUser;
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setCustomArgumentResolvers(authResolver)
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void register_ShouldReturnCreated() throws Exception {
        RegisterRequest request = new RegisterRequest("test@example.com", "password123");

        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setRole(Role.USER);

        when(authService.registerUser(anyString(), anyString())).thenReturn(user);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.user").exists());
    }

    @Test
    void login_ShouldReturnUserAndSetCookie() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "password123");
        User user = new User();
        user.setEmail("test@example.com");
        user.setRole(Role.USER);

        when(authService.login(anyString(), anyString())).thenReturn(user);
        when(jwtTokenService.createToken(any(User.class))).thenReturn("jwt-token");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                .andExpect(header().exists("Set-Cookie"));
    }

    @Test
    void logout_ShouldClearCookie() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isNoContent())
                .andExpect(header().exists("Set-Cookie"));
    }

    @Test
    void getSession_ShouldReturnUserDetails_WhenAuthenticated() throws Exception {
        mockMvc.perform(get("/api/auth/session"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                .andExpect(jsonPath("$.user.role").value("USER"));
    }
}
