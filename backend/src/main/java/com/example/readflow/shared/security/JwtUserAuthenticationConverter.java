package com.example.readflow.shared.security;

import com.example.readflow.auth.Role;
import com.example.readflow.auth.User;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class JwtUserAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        User user = new User();
        user.setId(((Number) jwt.getClaim("userId")).longValue());
        user.setEmail(jwt.getSubject());
        user.setRole(Role.valueOf(jwt.getClaimAsString("role")));

        String role = jwt.getClaimAsString("role");
        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

        return new UserAuthenticationToken(jwt, user, authorities);
    }
}
