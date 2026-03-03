package com.example.minilibrary.auth.dto;

import com.example.minilibrary.auth.User;

public record UserDto(
        Long id,
        String email,
        String role) {

    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getEmail(), user.getRole().name());
    }
}
