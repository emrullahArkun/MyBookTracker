package com.example.readflow.auth.dto;

import com.example.readflow.auth.User;

public record UserDto(
        Long id,
        String email,
        String role) {

    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getEmail(), user.getRole().name());
    }
}
