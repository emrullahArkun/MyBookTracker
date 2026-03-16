package com.example.readflow.shared.config;

import com.example.readflow.shared.security.UserArgumentResolver;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class WebConfigTest {

    @Mock
    private UserArgumentResolver userArgumentResolver;

    @InjectMocks
    private WebConfig webConfig;

    @Test
    void addArgumentResolvers_ShouldAddUserArgumentResolver() {
        List<HandlerMethodArgumentResolver> resolvers = new ArrayList<>();
        
        webConfig.addArgumentResolvers(resolvers);
        
        assertThat(resolvers).hasSize(1);
        assertThat(resolvers.get(0)).isEqualTo(userArgumentResolver);
    }
}
