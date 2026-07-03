package com.smartretail360.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Document(collection = "invoices")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {
    @Id
    private String id;

    @Indexed(unique = true)
    private String invoiceNumber;

    private String customerId;
    private String customerName;
    private String customerPhone;
    private String customerState;
    private String storeState;

    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();

    // Strict Billing Calculations
    private BigDecimal subtotal;
    private BigDecimal itemDiscount;
    private BigDecimal comboDiscount;
    private BigDecimal membershipDiscount;
    private BigDecimal couponDiscount;
    private BigDecimal storePromotionDiscount;
    private BigDecimal taxableValue;
    private BigDecimal gstAmount;
    private BigDecimal cgst;
    private BigDecimal sgst;
    private BigDecimal igst;
    private BigDecimal roundOff;
    private BigDecimal finalAmount;

    private String paymentMethod; // CASH, CARD, UPI, WALLET, SPLIT, GIFT_CARD
    @Builder.Default
    private Map<String, BigDecimal> splitDetails = new HashMap<>(); // For Split Payments (e.g. CASH->100, UPI->50)

    private int rewardPointsEarned;
    private int rewardPointsRedeemed;

    private String notes;

    @CreatedDate
    private Instant createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvoiceItem {
        private String productId;
        private String productName;
        private String sku;
        private String hsnCode;
        private int quantity;
        private BigDecimal mrp;
        private BigDecimal sellingPrice;
        private BigDecimal costPrice;
        private BigDecimal gstPercentage;
        private BigDecimal gstAmount;
        private BigDecimal discountAmount;
        private BigDecimal totalAmount;
    }
}
