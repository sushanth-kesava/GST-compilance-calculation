package com.smartretail360.service;

import com.smartretail360.dto.BillingRequest;
import com.smartretail360.dto.BillingRequest.BillingItemRequest;
import com.smartretail360.exception.CustomException;
import com.smartretail360.model.*;
import com.smartretail360.repository.CustomerRepository;
import com.smartretail360.repository.InvoiceRepository;
import com.smartretail360.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Service
public class BillingService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private NotificationService notificationService;

    @Value("${app.store.state}")
    private String storeState;

    @Value("${app.store.name}")
    private String storeName;

    public Invoice calculateAndSaveInvoice(BillingRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new CustomException("Cart cannot be empty", HttpStatus.BAD_REQUEST);
        }

        // 1. Fetch Customer
        Customer customer = null;
        String customerName = "Walk-in Customer";
        String customerPhone = "";
        String customerStateStr = storeState; // default local
        if (request.getCustomerId() != null && !request.getCustomerId().isEmpty()) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new CustomException("Customer not found", HttpStatus.NOT_FOUND));
            customerName = customer.getName();
            customerPhone = customer.getPhone();
            if (customer.getState() != null && !customer.getState().isEmpty()) {
                customerStateStr = customer.getState();
            }
        }

        // 2. Fetch Products and check stock
        List<Invoice.InvoiceItem> invoiceItems = new ArrayList<>();
        BigDecimal totalSubtotal = BigDecimal.ZERO;
        BigDecimal totalItemDiscount = BigDecimal.ZERO;
        BigDecimal totalComboDiscount = BigDecimal.ZERO;

        for (BillingItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new CustomException("Product not found: " + itemReq.getProductId(), HttpStatus.NOT_FOUND));

            if (product.getTotalStock() < itemReq.getQuantity()) {
                throw new CustomException("Insufficient stock for product: " + product.getName() + ". Available: " + product.getTotalStock(), HttpStatus.BAD_REQUEST);
            }

            int qty = itemReq.getQuantity();
            BigDecimal qtyBD = BigDecimal.valueOf(qty);

            BigDecimal itemMrp = product.getMrp() != null ? product.getMrp() : product.getSellingPrice();
            BigDecimal itemSellingPrice = product.getSellingPrice();
            BigDecimal itemCost = product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO;

            // 1. Subtotal for this item
            BigDecimal itemSubtotal = itemMrp.multiply(qtyBD);
            totalSubtotal = totalSubtotal.add(itemSubtotal);

            // 2. Item Discount (MRP - Selling Price)
            BigDecimal itemDiscountVal = itemMrp.subtract(itemSellingPrice).multiply(qtyBD);
            if (itemDiscountVal.compareTo(BigDecimal.ZERO) < 0) itemDiscountVal = BigDecimal.ZERO;
            totalItemDiscount = totalItemDiscount.add(itemDiscountVal);

            // 3. Combo Discount (Buy 3 or more of same product -> 10% discount on selling price)
            BigDecimal comboDiscountVal = BigDecimal.ZERO;
            if (qty >= 3) {
                comboDiscountVal = itemSellingPrice.multiply(qtyBD).multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
                totalComboDiscount = totalComboDiscount.add(comboDiscountVal);
            }

            Invoice.InvoiceItem invoiceItem = Invoice.InvoiceItem.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .sku(product.getSku())
                    .hsnCode(product.getHsnCode() != null ? product.getHsnCode() : "9900")
                    .quantity(qty)
                    .mrp(itemMrp)
                    .sellingPrice(itemSellingPrice)
                    .costPrice(itemCost)
                    .gstPercentage(product.getGstPercentage() != null ? product.getGstPercentage() : BigDecimal.ZERO)
                    .discountAmount(itemDiscountVal.add(comboDiscountVal))
                    .build();

            invoiceItems.add(invoiceItem);
        }

        // 3. Calculate Membership Discount (Gold = 10%, Silver = 5%, Premium = 15%)
        BigDecimal remainingSubtotal = totalSubtotal.subtract(totalItemDiscount).subtract(totalComboDiscount);
        if (remainingSubtotal.compareTo(BigDecimal.ZERO) < 0) remainingSubtotal = BigDecimal.ZERO;

        BigDecimal membershipDiscountVal = BigDecimal.ZERO;
        if (customer != null) {
            String tier = customer.getMembershipTier().toUpperCase();
            switch (tier) {
                case "SILVER" -> membershipDiscountVal = remainingSubtotal.multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP);
                case "GOLD" -> membershipDiscountVal = remainingSubtotal.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
                case "PREMIUM" -> membershipDiscountVal = remainingSubtotal.multiply(new BigDecimal("0.15")).setScale(2, RoundingMode.HALF_UP);
            }
        }
        remainingSubtotal = remainingSubtotal.subtract(membershipDiscountVal);

        // 4. Coupon Discount
        BigDecimal couponDiscountVal = BigDecimal.ZERO;
        if (request.getCouponCode() != null && !request.getCouponCode().isEmpty()) {
            String coupon = request.getCouponCode().toUpperCase();
            if (coupon.equals("WELCOME10")) {
                couponDiscountVal = remainingSubtotal.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP); // 10% off
            } else if (coupon.equals("BIGSALE")) {
                couponDiscountVal = new BigDecimal("200.00"); // flat 200
                if (couponDiscountVal.compareTo(remainingSubtotal) > 0) {
                    couponDiscountVal = remainingSubtotal; // Prevent coupon overflow
                }
            }
            couponDiscountVal = couponDiscountVal.setScale(2, RoundingMode.HALF_UP);
        }
        remainingSubtotal = remainingSubtotal.subtract(couponDiscountVal);

        // 5. Store Promotion Discount
        BigDecimal storePromoVal = request.getStorePromotionDiscount() != null ? request.getStorePromotionDiscount() : BigDecimal.ZERO;
        if (storePromoVal.compareTo(remainingSubtotal) > 0) {
            storePromoVal = remainingSubtotal; // Prevent promo overflow
        }
        remainingSubtotal = remainingSubtotal.subtract(storePromoVal);

        // Loyalty Points Redemption
        int pointsRedeemed = 0;
        BigDecimal pointsDiscountVal = BigDecimal.ZERO;
        if (customer != null && request.isRedeemPoints() && customer.getRewardPoints() > 0) {
            // Let's say 1 point = 1 INR. Max points discount is 20% of remaining bill
            BigDecimal maxRedeemableVal = remainingSubtotal.multiply(new BigDecimal("0.20"));
            int maxPointsUserCanRedeem = maxRedeemableVal.setScale(0, RoundingMode.DOWN).intValue();
            pointsRedeemed = Math.min(customer.getRewardPoints(), maxPointsUserCanRedeem);
            pointsDiscountVal = BigDecimal.valueOf(pointsRedeemed);
            remainingSubtotal = remainingSubtotal.subtract(pointsDiscountVal);
        }

        BigDecimal taxableValue = remainingSubtotal;
        if (taxableValue.compareTo(BigDecimal.ZERO) < 0) {
            taxableValue = BigDecimal.ZERO;
        }

        // Apportion discounts to items for item-level GST calculations
        BigDecimal totalDiscounts = totalItemDiscount.add(totalComboDiscount).add(membershipDiscountVal).add(couponDiscountVal).add(storePromoVal).add(pointsDiscountVal);
        BigDecimal totalGst = BigDecimal.ZERO;

        for (Invoice.InvoiceItem item : invoiceItems) {
            BigDecimal itemBaseCost = item.getMrp().multiply(BigDecimal.valueOf(item.getQuantity()));
            // Apportion ratio
            BigDecimal ratio = totalSubtotal.compareTo(BigDecimal.ZERO) > 0 
                    ? itemBaseCost.divide(totalSubtotal, 4, RoundingMode.HALF_UP) 
                    : BigDecimal.ZERO;

            BigDecimal itemDiscountShare = totalDiscounts.multiply(ratio);
            BigDecimal itemTaxableVal = itemBaseCost.subtract(itemDiscountShare);
            if (itemTaxableVal.compareTo(BigDecimal.ZERO) < 0) {
                itemTaxableVal = BigDecimal.ZERO;
            }

            BigDecimal itemGstPercent = item.getGstPercentage();
            BigDecimal itemGst = itemTaxableVal.multiply(itemGstPercent).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

            item.setDiscountAmount(itemDiscountShare);
            item.setGstAmount(itemGst);
            item.setTotalAmount(itemTaxableVal.add(itemGst));

            totalGst = totalGst.add(itemGst);
        }

        // Automatic State Detection for CGST/SGST vs IGST
        BigDecimal cgst = BigDecimal.ZERO;
        BigDecimal sgst = BigDecimal.ZERO;
        BigDecimal igst = BigDecimal.ZERO;

        if (customerStateStr.equalsIgnoreCase(storeState)) {
            // Local trade
            cgst = totalGst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            sgst = totalGst.subtract(cgst); // avoid rounding discrepancy
        } else {
            // Interstate trade
            igst = totalGst;
        }

        BigDecimal finalAmountWithGst = taxableValue.add(totalGst);
        BigDecimal roundedFinalAmount = finalAmountWithGst.setScale(0, RoundingMode.HALF_UP);
        BigDecimal roundOff = roundedFinalAmount.subtract(finalAmountWithGst);

        // Loyalty Points Earned (1% of taxable value)
        int pointsEarned = taxableValue.multiply(new BigDecimal("0.01")).setScale(0, RoundingMode.DOWN).intValue();

        // 6. Generate Invoice ID / Number
        String invoiceNumber = "INV-" + System.currentTimeMillis();

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .customerId(customer != null ? customer.getId() : null)
                .customerName(customerName)
                .customerPhone(customerPhone)
                .customerState(customerStateStr)
                .storeState(storeState)
                .items(invoiceItems)
                .subtotal(totalSubtotal)
                .itemDiscount(totalItemDiscount)
                .comboDiscount(totalComboDiscount)
                .membershipDiscount(membershipDiscountVal)
                .couponDiscount(couponDiscountVal)
                .storePromotionDiscount(storePromoVal.add(pointsDiscountVal)) // Combine miscellaneous promo
                .taxableValue(taxableValue)
                .gstAmount(totalGst)
                .cgst(cgst)
                .sgst(sgst)
                .igst(igst)
                .roundOff(roundOff)
                .finalAmount(roundedFinalAmount)
                .paymentMethod(request.getPaymentMethod())
                .splitDetails(request.getSplitDetails())
                .rewardPointsEarned(pointsEarned)
                .rewardPointsRedeemed(pointsRedeemed)
                .notes(request.isRedeemPoints() ? "Loyalty redeemed: " + pointsRedeemed + " points." : "")
                .build();

        // 7. Update Stock and Customer profile inside a transaction
        // (Since MongoDB transactional support requires a replica set, we update models sequentially)
        for (Invoice.InvoiceItem item : invoiceItems) {
            Product product = productRepository.findById(item.getProductId()).get();
            // Deduct stock (from default warehouse or globally)
            int newStock = product.getTotalStock() - item.getQuantity();
            product.setTotalStock(newStock);
            if (!product.getWarehouseStock().isEmpty()) {
                String firstWarehouseKey = product.getWarehouseStock().keySet().iterator().next();
                int currentWarehouseQty = product.getWarehouseStock().get(firstWarehouseKey);
                product.getWarehouseStock().put(firstWarehouseKey, Math.max(0, currentWarehouseQty - item.getQuantity()));
            }
            productRepository.save(product);

            // Check low stock warning
            if (newStock <= product.getReorderLevel()) {
                notificationService.sendLowStockAlert(product);
            }
        }

        if (customer != null) {
            // Update loyalty points
            int currentPoints = customer.getRewardPoints();
            customer.setRewardPoints(currentPoints - pointsRedeemed + pointsEarned);

            // Update Wallet if payment method was WALLET or SPLIT
            if (request.getPaymentMethod().equalsIgnoreCase("WALLET")) {
                if (customer.getWalletBalance().compareTo(roundedFinalAmount) < 0) {
                    throw new CustomException("Insufficient wallet balance", HttpStatus.BAD_REQUEST);
                }
                customer.setWalletBalance(customer.getWalletBalance().subtract(roundedFinalAmount));
            } else if (request.getPaymentMethod().equalsIgnoreCase("SPLIT") && request.getSplitDetails().containsKey("WALLET")) {
                BigDecimal walletAmount = request.getSplitDetails().get("WALLET");
                if (customer.getWalletBalance().compareTo(walletAmount) < 0) {
                    throw new CustomException("Insufficient wallet balance for split payload", HttpStatus.BAD_REQUEST);
                }
                customer.setWalletBalance(customer.getWalletBalance().subtract(walletAmount));
            }

            // Append invoice to history
            customer.getPurchaseHistory().add(Customer.PurchaseHistoryEntry.builder()
                    .invoiceId(invoiceNumber)
                    .amount(roundedFinalAmount)
                    .date(Instant.now())
                    .build());

            // Upgrade Loyalty Tiers based on spending threshold (e.g. Gold if total spend > 10,000, Premium if > 25,000)
            BigDecimal totalSpend = customer.getPurchaseHistory().stream()
                    .map(Customer.PurchaseHistoryEntry::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (totalSpend.compareTo(new BigDecimal("25000")) >= 0) {
                customer.setMembershipTier("PREMIUM");
            } else if (totalSpend.compareTo(new BigDecimal("10000")) >= 0) {
                customer.setMembershipTier("GOLD");
            } else if (totalSpend.compareTo(new BigDecimal("3000")) >= 0) {
                customer.setMembershipTier("SILVER");
            }

            customerRepository.save(customer);
        }

        // 8. Save Invoice
        Invoice savedInvoice = invoiceRepository.save(invoice);

        // Send payment alert notification
        notificationService.sendPaymentAlert(savedInvoice);

        return savedInvoice;
    }
}
