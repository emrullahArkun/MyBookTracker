package com.example.mybooktracker.shared.security;

public class TokenCreationException extends RuntimeException {

    public TokenCreationException(String message, Throwable cause) {
        super(message, cause);
    }
}
