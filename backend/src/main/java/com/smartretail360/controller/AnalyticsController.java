package com.smartretail360.controller;

import com.smartretail360.dto.ApiResponse;
import com.smartretail360.model.Invoice;
import com.smartretail360.model.Product;
import com.smartretail360.repository.InvoiceRepository;
import com.smartretail360.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        List<Invoice> invoices = invoiceRepository.findAll();
        List<Product> products = productRepository.findAll();

        BigDecimal todaySales = BigDecimal.ZERO;
        BigDecimal monthlySales = BigDecimal.ZERO;
        BigDecimal totalProfit = BigDecimal.ZERO;
        BigDecimal gstCollected = BigDecimal.ZERO;

        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);

        for (Invoice invoice : invoices) {
            LocalDate invoiceDate = null;
            if (invoice.getCreatedAt() != null) {
                invoiceDate = invoice.getCreatedAt()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDate();
            }

            BigDecimal amount = invoice.getFinalAmount() != null ? invoice.getFinalAmount() : BigDecimal.ZERO;

            if (invoiceDate != null && invoiceDate.equals(today)) {
                todaySales = todaySales.add(amount);
            }
            if (invoiceDate != null && !invoiceDate.isBefore(startOfMonth)) {
                monthlySales = monthlySales.add(amount);
            }

            // Calculate profit: sum((sellingPrice - costPrice) * qty)
            BigDecimal invoiceProfit = BigDecimal.ZERO;
            if (invoice.getItems() != null) {
                for (Invoice.InvoiceItem item : invoice.getItems()) {
                    BigDecimal cost = item.getCostPrice() != null ? item.getCostPrice() : BigDecimal.ZERO;
                    BigDecimal selling = item.getSellingPrice() != null ? item.getSellingPrice() : BigDecimal.ZERO;
                    int qty = item.getQuantity();
                    BigDecimal profitPerItem = selling.subtract(cost);
                    invoiceProfit = invoiceProfit.add(profitPerItem.multiply(BigDecimal.valueOf(qty)));
                }
            }
            totalProfit = totalProfit.add(invoiceProfit);
            gstCollected = gstCollected.add(invoice.getGstAmount() != null ? invoice.getGstAmount() : BigDecimal.ZERO);
        }

        long lowStockCount = products.stream()
            .filter(p -> {
                int total = p.getTotalStock();
                int reorder = p.getReorderLevel();
                return total <= reorder;
            })
            .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("todaySales", todaySales);
        stats.put("monthlyRevenue", monthlySales);
        stats.put("profit", totalProfit);
        stats.put("gstCollected", gstCollected);
        stats.put("totalOrders", invoices.size());
        stats.put("lowStockCount", lowStockCount);

        // Chart data - compute from real invoices if available, otherwise use sample data
        List<Map<String, Object>> salesChart = new ArrayList<>();
        if (invoices.size() >= 7) {
            // Use last 7 days of real invoice data
            for (int i = Math.max(0, invoices.size() - 7); i < invoices.size(); i++) {
                Invoice inv = invoices.get(i);
                Map<String, Object> dataPoint = new HashMap<>();
                dataPoint.put("name", "Day " + (i + 1));
                dataPoint.put("Sales", inv.getFinalAmount() != null ? inv.getFinalAmount() : BigDecimal.ZERO);
                BigDecimal subtotal = inv.getSubtotal() != null ? inv.getSubtotal() : BigDecimal.ZERO;
                BigDecimal totalCost = BigDecimal.ZERO;
                if (inv.getItems() != null) {
                    totalCost = inv.getItems().stream()
                            .map(item -> item.getCostPrice() != null ? item.getCostPrice().multiply(BigDecimal.valueOf(item.getQuantity())) : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                }
                dataPoint.put("Profit", subtotal.subtract(totalCost));
                salesChart.add(dataPoint);
            }
        } else {
            // Sample data for demonstration
            String[] days = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
            Random random = new Random();
            for (String day : days) {
                Map<String, Object> dataPoint = new HashMap<>();
                dataPoint.put("name", day);
                dataPoint.put("Sales", 20000 + random.nextInt(30000));
                dataPoint.put("Profit", 5000 + random.nextInt(10000));
                salesChart.add(dataPoint);
            }
        }
        stats.put("salesChart", salesChart);

        // Top Selling Categories
        List<Map<String, Object>> categoriesChart = new ArrayList<>();
        if (!products.isEmpty()) {
            // Compute from real products/categories (safely handle nulls)
            Map<String, Long> categoryCount = products.stream()
                    .collect(java.util.stream.Collectors.groupingBy(p -> p.getCategoryId() != null ? String.valueOf(p.getCategoryId()) : "Unknown", java.util.stream.Collectors.counting()));
            long total = categoryCount.values().stream().mapToLong(Long::longValue).sum();
            if (total > 0) {
                categoryCount.forEach((catId, count) -> {
                    int percent = (int) (count * 100 / total);
                    categoriesChart.add(createCategoryPoint("Cat-" + catId, percent));
                });
            } else {
                categoriesChart.add(createCategoryPoint("Others", 100));
            }
        } else {
            categoriesChart.add(createCategoryPoint("Electronics", 45));
            categoriesChart.add(createCategoryPoint("Apparel", 25));
            categoriesChart.add(createCategoryPoint("Groceries", 20));
            categoriesChart.add(createCategoryPoint("Others", 10));
        }
        stats.put("categoriesChart", categoriesChart);

        // Recent Invoices (last 5)
        List<Invoice> recentInvoices = invoices.size() > 5 
                ? invoices.subList(invoices.size() - 5, invoices.size()) 
                : invoices;
        stats.put("recentTransactions", recentInvoices);

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    private Map<String, Object> createCategoryPoint(String label, int val) {
        Map<String, Object> map = new HashMap<>();
        map.put("name", label);
        map.put("value", val);
        return map;
    }
}
