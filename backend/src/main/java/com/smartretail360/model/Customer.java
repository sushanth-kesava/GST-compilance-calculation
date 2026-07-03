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
import java.util.ArrayList;
import java.util.List;

@Document(collection = "customers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Customer {
    @Id
    private String id;
    private String name;

    @Indexed(unique = true)
    private String email;

    @Indexed(unique = true)
    private String phone;

    @Builder.Default
    private String membershipTier = "NONE"; // NONE, SILVER, GOLD, PREMIUM

    @Builder.Default
    private BigDecimal walletBalance = BigDecimal.ZERO;

    @Builder.Default
    private int rewardPoints = 0;

    private String state; // Customer State (e.g. "Karnataka", "Tamil Nadu" etc.)
    private String address;

    @Builder.Default
    private List<PurchaseHistoryEntry> purchaseHistory = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseHistoryEntry {
        private String invoiceId;
        private BigDecimal amount;
        private Instant date;
    }
}
