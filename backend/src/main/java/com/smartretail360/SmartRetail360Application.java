package com.smartretail360;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class SmartRetail360Application {
    public static void main(String[] args) {
        SpringApplication.run(SmartRetail360Application.class, args);
    }
}
