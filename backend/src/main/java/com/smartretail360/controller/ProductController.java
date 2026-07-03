package com.smartretail360.controller;

import com.smartretail360.dto.ApiResponse;
import com.smartretail360.exception.CustomException;
import com.smartretail360.model.Product;
import com.smartretail360.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Product>>> getAllProducts(
            @RequestParam(value = "categoryId", required = false) String categoryId,
            @RequestParam(value = "lowStock", required = false) Boolean lowStock) {
        
        List<Product> products;
        if (categoryId != null) {
            products = productRepository.findByCategoryId(categoryId);
        } else if (lowStock != null && lowStock) {
            products = productRepository.findByTotalStockLessThanEqual(10); // default low stock threshold
        } else {
            products = productRepository.findAll();
        }
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> getProductById(@PathVariable("id") String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new CustomException("Product not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Product>>> searchProducts(@RequestParam("term") String term) {
        List<Product> products = productRepository.searchProducts(term);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Product>> createProduct(@RequestBody Product product) {
        if (product.getSku() == null || product.getSku().isEmpty()) {
            product.setSku("SKU-" + System.currentTimeMillis());
        }
        if (product.getBarcode() == null || product.getBarcode().isEmpty()) {
            // Generate standard UPC/EAN mock barcode
            product.setBarcode("890" + String.format("%09d", new Random().nextLong(1000000000L)));
        }
        // Mock QR Code link
        product.setQrCode("https://smartretail360.com/product/" + product.getSku());

        // Set total stock count based on warehouse stock Map
        int total = product.getWarehouseStock() != null 
                ? product.getWarehouseStock().values().stream().mapToInt(Integer::intValue).sum() 
                : 0;
        product.setTotalStock(total);

        Product saved = productRepository.save(product);
        return ResponseEntity.ok(ApiResponse.success(saved, "Product created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Product>> updateProduct(@PathVariable("id") String id, @RequestBody Product productDetails) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new CustomException("Product not found", HttpStatus.NOT_FOUND));

        product.setName(productDetails.getName());
        product.setBrand(productDetails.getBrand());
        product.setCategoryId(productDetails.getCategoryId());
        product.setCostPrice(productDetails.getCostPrice());
        product.setSellingPrice(productDetails.getSellingPrice());
        product.setMrp(productDetails.getMrp());
        product.setGstPercentage(productDetails.getGstPercentage());
        product.setHsnCode(productDetails.getHsnCode());
        product.setBatchNumber(productDetails.getBatchNumber());
        product.setManufacturingDate(productDetails.getManufacturingDate());
        product.setExpiryDate(productDetails.getExpiryDate());
        product.setSupplierId(productDetails.getSupplierId());
        
        if (productDetails.getWarehouseStock() != null) {
            product.setWarehouseStock(productDetails.getWarehouseStock());
            int total = productDetails.getWarehouseStock().values().stream().mapToInt(Integer::intValue).sum();
            product.setTotalStock(total);
        }

        product.setMinimumStock(productDetails.getMinimumStock());
        product.setMaximumStock(productDetails.getMaximumStock());
        product.setReorderLevel(productDetails.getReorderLevel());
        product.setImageUrl(productDetails.getImageUrl());

        Product updated = productRepository.save(product);
        return ResponseEntity.ok(ApiResponse.success(updated, "Product updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable("id") String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new CustomException("Product not found", HttpStatus.NOT_FOUND));
        productRepository.delete(product);
        return ResponseEntity.ok(ApiResponse.success(null, "Product deleted successfully"));
    }

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> importProductsExcel(@RequestParam("file") MultipartFile file) {
        // Excel loading mock
        System.out.println("====== EXCEL IMPORT SIMULATION ======");
        System.out.println("Importing file: " + file.getOriginalFilename() + ", Size: " + file.getSize());
        System.out.println("=====================================");

        // Seed 2 mock products
        Product mock1 = Product.builder()
                .sku("SKU-IMPORT1")
                .name("Imported Soft Drink")
                .brand("FizzCorp")
                .mrp(new BigDecimal("99.00"))
                .sellingPrice(new BigDecimal("90.00"))
                .gstPercentage(new BigDecimal("18.00"))
                .hsnCode("2202")
                .totalStock(100)
                .barcode("8901234567890")
                .build();

        Product mock2 = Product.builder()
                .sku("SKU-IMPORT2")
                .name("Imported Potato Chips")
                .brand("SnackCo")
                .mrp(new BigDecimal("50.00"))
                .sellingPrice(new BigDecimal("45.00"))
                .gstPercentage(new BigDecimal("12.00"))
                .hsnCode("2005")
                .totalStock(250)
                .barcode("8909876543210")
                .build();

        productRepository.save(mock1);
        productRepository.save(mock2);

        return ResponseEntity.ok(ApiResponse.success(null, "Excel spreadsheet imported successfully. Seeded 2 products."));
    }
}
