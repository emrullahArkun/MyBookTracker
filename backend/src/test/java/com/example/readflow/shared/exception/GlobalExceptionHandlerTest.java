package com.example.readflow.shared.exception;

import com.example.readflow.shared.dto.ErrorResponse;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private WebRequest webRequest;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        webRequest = mock(WebRequest.class);
        when(webRequest.getDescription(false)).thenReturn("uri=/api/test");
    }

    @Test
    void handleResourceNotFoundException_ShouldReturn404() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Book not found");

        ResponseEntity<ErrorResponse> response = handler.handleResourceNotFoundException(ex, webRequest);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals(404, response.getBody().status());
        assertEquals("Book not found", response.getBody().message());
        assertEquals("/api/test", response.getBody().path());
    }

    @Test
    void handleDuplicateResourceException_ShouldReturn409() {
        DuplicateResourceException ex = new DuplicateResourceException("Already exists");

        ResponseEntity<ErrorResponse> response = handler.handleDuplicateResourceException(ex, webRequest);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals(409, response.getBody().status());
        assertEquals("Already exists", response.getBody().message());
    }

    @Test
    void handleIllegalSessionStateException_ShouldReturn409() {
        IllegalSessionStateException ex = new IllegalSessionStateException("No active session");

        ResponseEntity<ErrorResponse> response = handler.handleIllegalSessionStateException(ex, webRequest);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals(409, response.getBody().status());
    }

    @Test
    void handleInvalidCredentialsException_ShouldReturn401() {
        InvalidCredentialsException ex = new InvalidCredentialsException("Bad credentials");

        ResponseEntity<ErrorResponse> response = handler.handleInvalidCredentialsException(ex, webRequest);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals(401, response.getBody().status());
    }

    @Test
    void handleValidationException_ShouldReturn400_WithFieldErrors() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);

        FieldError fieldError1 = new FieldError("book", "title", "must not be blank");
        FieldError fieldError2 = new FieldError("book", "isbn", "must not be blank");

        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError1, fieldError2));

        ResponseEntity<ErrorResponse> response = handler.handleValidationException(ex, webRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(400, response.getBody().status());
        assertTrue(response.getBody().message().contains("title: must not be blank"));
        assertTrue(response.getBody().message().contains("isbn: must not be blank"));
    }

    @Test
    void handleConstraintViolationException_ShouldReturn400() {
        ConstraintViolationException ex = new ConstraintViolationException("Constraint failed", Set.of());

        ResponseEntity<ErrorResponse> response = handler.handleConstraintViolationException(ex, webRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(400, response.getBody().status());
    }

    @Test
    void handleGlobalException_ShouldReturn500_ForUnexpectedException() throws Exception {
        Exception ex = new RuntimeException("Something broke");

        ResponseEntity<ErrorResponse> response = handler.handleGlobalException(ex, webRequest);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals(500, response.getBody().status());
        assertEquals("An unexpected error occurred", response.getBody().message());
    }

    @Test
    void handleGlobalException_ShouldRethrow_WhenNoResourceFoundException() throws Exception {
        NoResourceFoundException ex = mock(NoResourceFoundException.class);

        assertThrows(NoResourceFoundException.class,
                () -> handler.handleGlobalException(ex, webRequest));
    }
}
