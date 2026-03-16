package com.example.readflow.shared.exception;

public class IllegalSessionStateException extends RuntimeException {
    public IllegalSessionStateException(String message) {
        super(message);
    }
}
