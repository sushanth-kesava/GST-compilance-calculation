package com.smartretail360.service;

import com.smartretail360.dto.BillingRequest;
import com.smartretail360.dto.BillingRequest.BillingItemRequest;
import com.smartretail360.model.Customer;
import com.smartretail360.model.Invoice;
import com.smartretail360.model.Product;
import com.smartretail360.repository.CustomerRepository;
import com.smartretail360.repository.InvoiceRepository;
import com.smartretail360.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BillingServiceTest {

    @InjectMocks
    private BillingService billingService;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private NotificationService notificationService;

    private Product mockProduct;
    private Customer mockLocalCustomer;
    private Customer mockInterstateCustomer;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        ReflectionTestUtils.setField(billingService, "storeState", "Karnataka");
        ReflectionTestUtils.setField(billingService, "storeName", "SmartRetail 360 Flagship");

        mockProduct = Product.builder()
                .id("p1")
                .name("Mineral Water")
                .sku("SKU-WATER")
                .barcode("890111222")
                .mrp(new BigDecimal("100.00"))
                .sellingPrice(new BigDecimal("90.00"))
                .costPrice(new BigDecimal("50.00"))
                .gstPercentage(new BigDecimal("18.00"))
                .hsnCode("2201")
                .totalStock(10)
                .reorderLevel(3)
                .build();

        mockLocalCustomer = Customer.builder()
                .id("c-local")
                .name("Sushanth Kesava")
                .phone("9999999999")
                .membershipTier("GOLD") // 10% Membership discount
                .state("Karnataka")
                .rewardPoints(100)
                .walletBalance(new BigDecimal("5000.00"))
                .build();

        mockInterstateCustomer = Customer.builder()
                .id("c-inter")
                .name("Interstate Buyer")
                .phone("8888888888")
                .membershipTier("NONE")
                .state("Tamil Nadu")
                .rewardPoints(0)
                .build();
    }

    @Test
    public void testBillingCalculation_LocalCustomer_GoldDiscount() {
        // Arrange
        BillingRequest request = BillingRequest.builder()
                .customerId("c-local")
                .items(List.of(new BillingItemRequest("p1", 2))) // qty 2
                .paymentMethod("CASH")
                .redeemPoints(false)
                .build();

        when(productRepository.findById("p1")).thenReturn(Optional.of(mockProduct));
        when(customerRepository.findById("c-local")).thenReturn(Optional.of(mockLocalCustomer));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Invoice invoice = billingService.calculateAndSaveInvoice(request);

        // Assert
        assertNotNull(invoice);
        // Subtotal = MRP 100 * 2 = 200
        assertEquals(new BigDecimal("200.00"), invoice.getSubtotal());
        
        // Item Discount = (MRP 100 - Selling 90) * 2 = 20
        assertEquals(new BigDecimal("20.00"), invoice.getItemDiscount());

        // Membership Discount = 10% of remaining (200 - 20) = 18.00
        assertEquals(new BigDecimal("18.00"), invoice.getMembershipDiscount());

        // Taxable Value = Subtotal (200) - ItemDisc (20) - MemberDisc (18) = 162.00
        assertEquals(new BigDecimal("162.00"), invoice.getTaxableValue());

        // GST = 18% of 162.00 = 29.16
        assertEquals(new BigDecimal("29.16"), invoice.getGstAmount());

        // Local trade (Karnataka = Karnataka) -> CGST/SGST split
        assertEquals(new BigDecimal("14.58"), invoice.getCgst());
        assertEquals(new BigDecimal("14.58"), invoice.getSgst());
        assertEquals(BigDecimal.ZERO, invoice.getIgst());

        // Net Payable = 162.00 + 29.16 = 191.16 rounded to 191.00 (Roundoff -0.16)
        assertEquals(new BigDecimal("191"), invoice.getFinalAmount());
        assertEquals(new BigDecimal("-0.16"), invoice.getRoundOff());
    }

    @Test
    public void testBillingCalculation_InterstateCustomer() {
        // Arrange
        BillingRequest request = BillingRequest.builder()
                .customerId("c-inter")
                .items(List.of(new BillingItemRequest("p1", 1))) // qty 1
                .paymentMethod("CASH")
                .redeemPoints(false)
                .build();

        when(productRepository.findById("p1")).thenReturn(Optional.of(mockProduct));
        when(customerRepository.findById("c-inter")).thenReturn(Optional.of(mockInterstateCustomer));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Invoice invoice = billingService.calculateAndSaveInvoice(request);

        // Assert
        assertNotNull(invoice);
        // Subtotal = MRP 100 * 1 = 100
        assertEquals(new BigDecimal("100.00"), invoice.getSubtotal());
        
        // Item Discount = (100 - 90) * 1 = 10
        assertEquals(new BigDecimal("10.00"), invoice.getItemDiscount());

        // Membership Discount = 0
        assertEquals(BigDecimal.ZERO, invoice.getMembershipDiscount());

        // Taxable Value = 90.00
        assertEquals(new BigDecimal("90.00"), invoice.getTaxableValue());

        // GST = 18% of 90.00 = 16.20
        assertEquals(new BigDecimal("16.20"), invoice.getGstAmount());

        // Interstate (Store Karnataka != Customer Tamil Nadu) -> IGST routing
        assertEquals(BigDecimal.ZERO, invoice.getCgst());
        assertEquals(BigDecimal.ZERO, invoice.getSgst());
        assertEquals(new BigDecimal("16.20"), invoice.getIgst());

        // Final Amount = 90.00 + 16.20 = 106.20 -> round to 106.00 (Roundoff -0.20)
        assertEquals(new BigDecimal("106"), invoice.getFinalAmount());
    }
}
