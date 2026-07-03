package com.smartretail360.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "purchase_orders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrder {
    @Id
    private String id;
    private String poNumber;
    private String supplierId;
    private String supplierName;
    private String warehouseId;

    @Builder.Default
    private List<PurchaseItem> items = new ArrayList<>();

    private BigDecimal totalAmount;
    private String status; // PENDING, RECEIVED, CANCELLED

    @CreatedDate
    private Instant createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseItem {
        private String productId;
        private String productName;
        private int quantity;
        private BigDecimal costPrice;
        private BigDecimal totalAmount;
    }
}
