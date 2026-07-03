package com.smartretail360.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;

@Document(collection = "suppliers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Supplier {
    @Id
    private String id;
    private String name;
    private String contactName;
    private String email;
    private String phone;
    private String gstNumber;
    private String pan;
    @Builder.Default
    private BigDecimal pendingPayments = BigDecimal.ZERO;
    @Builder.Default
    private double rating = 5.0;
}
