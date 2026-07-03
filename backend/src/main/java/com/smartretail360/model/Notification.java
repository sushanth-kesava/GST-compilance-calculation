package com.smartretail360.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    private String id;
    private String title;
    private String message;
    private String type; // LOW_STOCK, ORDER_UPDATE, PAYMENT_ALERT, COUPON_ALERT, GENERAL
    @Builder.Default
    private boolean read = false;

    @CreatedDate
    private Instant createdAt;
}
