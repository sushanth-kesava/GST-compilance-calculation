package com.smartretail360.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Document(collection = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id
    private String id;

    @Indexed(unique = true)
    private String sku;

    @Indexed(unique = true)
    private String barcode;

    private String qrCode;
    private String imageUrl;
    private String name;
    private String categoryId;
    private String brand;

    private BigDecimal costPrice;
    private BigDecimal sellingPrice;
    private BigDecimal mrp;

    private BigDecimal gstPercentage; // e.g. 5, 12, 18, 28
    private String hsnCode;

    private String batchNumber;
    private Instant manufacturingDate;
    private Instant expiryDate;

    private String supplierId;

    // Track stock breakdown per warehouse
    @Builder.Default
    private Map<String, Integer> warehouseStock = new HashMap<>();

    @Builder.Default
    private int totalStock = 0;

    private int minimumStock;
    private int maximumStock;
    private int reorderLevel;
}
