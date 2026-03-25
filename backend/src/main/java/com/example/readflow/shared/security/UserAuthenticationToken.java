package com.example.readflow.shared.security;

import com.example.readflow.auth.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.Collection;

public class UserAuthenticationToken extends JwtAuthenticationToken {

    private final User user;

    public UserAuthenticationToken(Jwt jwt, User user, Collection<? extends GrantedAuthority> authorities) {
        super(jwt, authorities);
        this.user = user;
    }

    @Override
    public Object getPrincipal() {
        return user;
    }

    public User getUser() {
        return user;
    }
}
