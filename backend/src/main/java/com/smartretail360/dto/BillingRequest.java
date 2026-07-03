package com.smartretail360.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingRequest {
    private String customerId;
    private List<BillingItemRequest> items;
    private String couponCode;
    private BigDecimal storePromotionDiscount; // Custom ad-hoc store discounts
    private String paymentMethod;
    @Builder.Default
    private Map<String, BigDecimal> splitDetails = new HashMap<>();
    private boolean redeemPoints;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BillingItemRequest {
        private String productId;
        private int quantity;
    }
}
