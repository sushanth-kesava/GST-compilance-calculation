package com.smartretail360.controller;

import com.smartretail360.dto.ApiResponse;
import com.smartretail360.exception.CustomException;
import com.smartretail360.model.Product;
import com.smartretail360.repository.CategoryRepository;
import com.smartretail360.repository.ProductRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

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
    public ResponseEntity<ApiResponse<Integer>> importProductsExcel(@RequestParam("file") MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls") && !filename.endsWith(".csv"))) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Unsupported file format. Please upload .xlsx, .xls, or .csv files."));
        }

        List<Product> products = new ArrayList<>();
        int importedCount = 0;
        int errorCount = 0;

        try {
            if (filename.endsWith(".csv")) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
                    String headerLine = reader.readLine(); // skip header
                    if (headerLine == null) {
                        return ResponseEntity.badRequest().body(ApiResponse.error("CSV file is empty."));
                    }
                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (line.trim().isEmpty()) continue;
                        try {
                            Product p = parseCsvLine(line);
                            if (p != null) {
                                products.add(p);
                                importedCount++;
                            }
                        } catch (Exception e) {
                            errorCount++;
                        }
                    }
                }
            } else {
                // Parse .xlsx / .xls
                try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
                    Sheet sheet = workbook.getSheetAt(0);
                    Iterator<Row> rows = sheet.iterator();
                    
                    if (!rows.hasNext()) {
                        return ResponseEntity.badRequest().body(ApiResponse.error("Excel file has no data rows."));
                    }
                    
                    Row headerRow = rows.next(); // skip header
                    // Auto-detect column mapping from header
                    Map<String, Integer> colMap = new HashMap<>();
                    for (Cell cell : headerRow) {
                        colMap.put(getCellValueAsString(cell).trim().toLowerCase(), cell.getColumnIndex());
                    }

                    while (rows.hasNext()) {
                        Row row = rows.next();
                        try {
                            Product p = parseExcelRow(row, colMap);
                            if (p != null) {
                                products.add(p);
                                importedCount++;
                            }
                        } catch (Exception e) {
                            errorCount++;
                        }
                    }
                }
            }

            // Save all parsed products
            if (!products.isEmpty()) {
                productRepository.saveAll(products);
            }

            String message = String.format("Successfully imported %d product(s)", importedCount);
            if (errorCount > 0) {
                message += String.format(". %d row(s) had errors and were skipped.", errorCount);
            }
            return ResponseEntity.ok(ApiResponse.success(importedCount, message));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to parse file: " + e.getMessage()));
        }
    }

    private Product parseExcelRow(Row row, Map<String, Integer> colMap) {
        String name = getCellString(row, colMap, "name");
        if (name == null || name.isEmpty()) name = getCellString(row, colMap, "product name");
        if (name == null || name.isEmpty()) return null;

        String sku = getCellString(row, colMap, "sku");
        if (sku == null || sku.isEmpty()) {
            sku = "SKU-" + System.currentTimeMillis() + "-" + row.getRowNum();
        }

        String barcode = getCellString(row, colMap, "barcode");
        if (barcode == null || barcode.isEmpty()) {
            barcode = "890" + String.format("%09d", new Random().nextLong(1000000000L));
        }

        String categoryName = getCellString(row, colMap, "category");
        String catId = resolveCategoryId(categoryName);

        BigDecimal costPrice = getCellDecimal(row, colMap, "cost price", "costprice", "cost");
        BigDecimal sellingPrice = getCellDecimal(row, colMap, "selling price", "sellingprice", "price", "selling");
        BigDecimal mrp = getCellDecimal(row, colMap, "mrp");
        if (mrp == null) mrp = sellingPrice;
        BigDecimal gstPct = getCellDecimal(row, colMap, "gst", "gst%", "gst percentage", "tax");
        if (gstPct == null) gstPct = BigDecimal.valueOf(18);
        String hsnCode = getCellString(row, colMap, "hsn", "hsn code", "hsncode");
        if (hsnCode == null || hsnCode.isEmpty()) hsnCode = "9900";
        int stock = getCellInt(row, colMap, "stock", "quantity", "qty", "total stock", "totalstock");
        int reorder = getCellInt(row, colMap, "reorder", "reorder level", "reorderlevel");
        if (reorder <= 0) reorder = 10;
        String brand = getCellString(row, colMap, "brand");
        String batch = getCellString(row, colMap, "batch", "batch number", "batchnumber");
        if (batch == null || batch.isEmpty()) batch = "B-1";

        Map<String, Integer> warehouseStock = new HashMap<>();
        warehouseStock.put("WH-Default", stock);

        return Product.builder()
                .sku(sku)
                .name(name)
                .brand(brand != null ? brand : "")
                .barcode(barcode)
                .categoryId(catId)
                .costPrice(costPrice != null ? costPrice : BigDecimal.ZERO)
                .sellingPrice(sellingPrice != null ? sellingPrice : BigDecimal.ZERO)
                .mrp(mrp)
                .gstPercentage(gstPct)
                .hsnCode(hsnCode)
                .batchNumber(batch)
                .totalStock(stock)
                .reorderLevel(reorder)
                .warehouseStock(warehouseStock)
                .qrCode("https://smartretail360.com/product/" + sku)
                .build();
    }

    private Product parseCsvLine(String line) {
        String[] cols = line.split(",");
        if (cols.length < 2) return null;
        
        int idx = 0;
        String name = cols[idx++].trim();
        if (name.isEmpty()) return null;

        String sku = cols.length > idx ? cols[idx++].trim() : "SKU-" + System.currentTimeMillis();
        String barcode = cols.length > idx ? cols[idx++].trim() : "890" + String.format("%09d", new Random().nextLong(1000000000L));
        String categoryName = cols.length > idx ? cols[idx++].trim() : "";
        BigDecimal costPrice = cols.length > idx ? parseDecimal(cols[idx++].trim()) : BigDecimal.ZERO;
        BigDecimal sellingPrice = cols.length > idx ? parseDecimal(cols[idx++].trim()) : BigDecimal.ZERO;
        BigDecimal mrp = cols.length > idx ? parseDecimal(cols[idx++].trim()) : sellingPrice;
        BigDecimal gst = cols.length > idx ? parseDecimal(cols[idx++].trim()) : BigDecimal.valueOf(18);
        String hsn = cols.length > idx ? cols[idx++].trim() : "9900";
        int stock = cols.length > idx ? parseInt(cols[idx++].trim()) : 0;
        int reorder = cols.length > idx ? parseInt(cols[idx++].trim()) : 10;
        String brand = cols.length > idx ? cols[idx++].trim() : "";
        String batch = cols.length > idx ? cols[idx++].trim() : "B-1";

        Map<String, Integer> warehouseStock = new HashMap<>();
        warehouseStock.put("WH-Default", stock);

        return Product.builder()
                .sku(sku)
                .name(name)
                .brand(brand)
                .barcode(barcode)
                .categoryId(resolveCategoryId(categoryName))
                .costPrice(costPrice)
                .sellingPrice(sellingPrice)
                .mrp(mrp)
                .gstPercentage(gst)
                .hsnCode(hsn)
                .batchNumber(batch)
                .totalStock(stock)
                .reorderLevel(reorder)
                .warehouseStock(warehouseStock)
                .qrCode("https://smartretail360.com/product/" + sku)
                .build();
    }

    private String resolveCategoryId(String categoryName) {
        if (categoryName == null || categoryName.isEmpty()) return null;
        List<com.smartretail360.model.Category> cats = categoryRepository.findByName(categoryName);
        if (!cats.isEmpty()) return cats.get(0).getId();
        // Try creating a new category with that name
        com.smartretail360.model.Category newCat = com.smartretail360.model.Category.builder()
                .name(categoryName)
                .build();
        newCat = categoryRepository.save(newCat);
        return newCat.getId();
    }

    // Helper methods for cell extraction
    private String getCellString(Row row, Map<String, Integer> colMap, String... keys) {
        for (String key : keys) {
            Integer colIdx = colMap.get(key);
            if (colIdx != null) {
                Cell cell = row.getCell(colIdx);
                return getCellValueAsString(cell);
            }
        }
        return null;
    }

    private BigDecimal getCellDecimal(Row row, Map<String, Integer> colMap, String... keys) {
        for (String key : keys) {
            Integer colIdx = colMap.get(key);
            if (colIdx != null) {
                Cell cell = row.getCell(colIdx);
                String val = getCellValueAsString(cell);
                return parseDecimal(val);
            }
        }
        return null;
    }

    private int getCellInt(Row row, Map<String, Integer> colMap, String... keys) {
        for (String key : keys) {
            Integer colIdx = colMap.get(key);
            if (colIdx != null) {
                Cell cell = row.getCell(colIdx);
                String val = getCellValueAsString(cell);
                try {
                    return (int) Double.parseDouble(val.replaceAll("[^0-9.]", ""));
                } catch (NumberFormatException e) {
                    return 0;
                }
            }
        }
        return 0;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val) && !Double.isInfinite(val)) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private BigDecimal parseDecimal(String val) {
        if (val == null || val.isEmpty()) return null;
        try {
            return BigDecimal.valueOf(Double.parseDouble(val.replaceAll("[^0-9.]", "")));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private int parseInt(String val) {
        if (val == null || val.isEmpty()) return 0;
        try {
            return (int) Double.parseDouble(val.replaceAll("[^0-9.]", ""));
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
