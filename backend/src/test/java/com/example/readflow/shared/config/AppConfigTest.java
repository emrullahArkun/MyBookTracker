package com.example.readflow.shared.config;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.time.Clock;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class AppConfigTest {

    @Test
    void restClientBuilder_ShouldReturnInstance() {
        AppConfig appConfig = new AppConfig();
        RestClient.Builder builder = appConfig.restClientBuilder();
        assertThat(builder).isNotNull();
        assertThat(builder.build()).isNotNull();
    }

    @Test
    void clock_ShouldReturnUTCClock() {
        AppConfig appConfig = new AppConfig();
        Clock clock = appConfig.clock();
        assertThat(clock).isNotNull();
        assertThat(clock.getZone()).isEqualTo(ZoneOffset.UTC);
    }
}
