package com.example.readflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class ReadFlowApplication {

	public static void main(String[] args) {
		SpringApplication.run(ReadFlowApplication.class, args);
	}

}
