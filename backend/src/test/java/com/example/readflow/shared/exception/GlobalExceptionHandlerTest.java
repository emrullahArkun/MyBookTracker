package com.example.readflow.shared.exception;

import com.example.readflow.shared.dto.ErrorResponse;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.context.request.WebRequest;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {

    private static final Instant FIXED_NOW = Instant.parse("2026-03-25T12:00:00Z");
    private static final LocalDateTime FIXED_TIME = LocalDateTime.ofInstant(FIXED_NOW, ZoneOffset.UTC);

    private GlobalExceptionHandler handler;
    private WebRequest webRequest;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler(Clock.fixed(FIXED_NOW, ZoneOffset.UTC));
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
        assertEquals(FIXED_TIME, response.getBody().timestamp());
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
    void handleMethodArgumentNotValid_ShouldReturn400_WithFieldErrors() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);

        FieldError fieldError1 = new FieldError("book", "title", "must not be blank");
        FieldError fieldError2 = new FieldError("book", "isbn", "must not be blank");

        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError1, fieldError2));

        ResponseEntity<Object> response = handler.handleMethodArgumentNotValid(
                ex, new HttpHeaders(), HttpStatus.BAD_REQUEST, webRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        ErrorResponse body = (ErrorResponse) response.getBody();
        assertEquals(400, body.status());
        assertTrue(body.message().contains("title: must not be blank"));
        assertTrue(body.message().contains("isbn: must not be blank"));
        assertEquals(FIXED_TIME, body.timestamp());
    }

    @Test
    void handleConstraintViolationException_ShouldReturn400() {
        ConstraintViolationException ex = new ConstraintViolationException("Constraint failed", Set.of());

        ResponseEntity<ErrorResponse> response = handler.handleConstraintViolationException(ex, webRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(400, response.getBody().status());
    }

    @Test
    void handleExceptionInternal_ShouldReturnErrorResponse() {
        Exception ex = new RuntimeException("Method not allowed");

        ResponseEntity<Object> response = handler.handleExceptionInternal(
                ex, null, new HttpHeaders(), HttpStatus.METHOD_NOT_ALLOWED, webRequest);

        assertEquals(HttpStatus.METHOD_NOT_ALLOWED, response.getStatusCode());
        ErrorResponse body = (ErrorResponse) response.getBody();
        assertEquals(405, body.status());
        assertEquals("Method Not Allowed", body.error());
        assertEquals("/api/test", body.path());
        assertEquals(FIXED_TIME, body.timestamp());
    }

    @Test
    void handleGlobalException_ShouldReturn500_ForUnexpectedException() {
        Exception ex = new RuntimeException("Something broke");

        ResponseEntity<ErrorResponse> response = handler.handleGlobalException(ex, webRequest);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals(500, response.getBody().status());
        assertEquals("An unexpected error occurred", response.getBody().message());
        assertEquals(FIXED_TIME, response.getBody().timestamp());
    }
}
