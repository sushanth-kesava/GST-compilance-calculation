package com.smartretail360.controller;

import com.smartretail360.dto.ApiResponse;
import com.smartretail360.exception.CustomException;
import com.smartretail360.model.Product;
import com.smartretail360.model.Warehouse;
import com.smartretail360.repository.ProductRepository;
import com.smartretail360.repository.WarehouseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/warehouses")
@PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'SUPER_ADMIN')")
public class WarehouseController {

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Warehouse>>> getAllWarehouses() {
        return ResponseEntity.ok(ApiResponse.success(warehouseRepository.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Warehouse>> getWarehouseById(@PathVariable("id") String id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new CustomException("Warehouse not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.success(warehouse));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Warehouse>> createWarehouse(@RequestBody Warehouse warehouse) {
        Warehouse saved = warehouseRepository.save(warehouse);
        return ResponseEntity.ok(ApiResponse.success(saved, "Warehouse created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Warehouse>> updateWarehouse(@PathVariable("id") String id, @RequestBody Warehouse details) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new CustomException("Warehouse not found", HttpStatus.NOT_FOUND));

        warehouse.setName(details.getName());
        warehouse.setLocation(details.getLocation());
        warehouse.setManagerName(details.getManagerName());
        warehouse.setActive(details.isActive());

        Warehouse updated = warehouseRepository.save(warehouse);
        return ResponseEntity.ok(ApiResponse.success(updated, "Warehouse updated successfully"));
    }

    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<Void>> transferStock(
            @RequestParam("productId") String productId,
            @RequestParam("sourceWarehouseId") String sourceWarehouseId,
            @RequestParam("destWarehouseId") String destWarehouseId,
            @RequestParam("quantity") int quantity) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new CustomException("Product not found", HttpStatus.NOT_FOUND));

        int sourceQty = product.getWarehouseStock().getOrDefault(sourceWarehouseId, 0);
        if (sourceQty < quantity) {
            throw new CustomException("Insufficient stock in source warehouse. Available: " + sourceQty, HttpStatus.BAD_REQUEST);
        }

        product.getWarehouseStock().put(sourceWarehouseId, sourceQty - quantity);
        int destQty = product.getWarehouseStock().getOrDefault(destWarehouseId, 0);
        product.getWarehouseStock().put(destWarehouseId, destQty + quantity);

        productRepository.save(product);

        return ResponseEntity.ok(ApiResponse.success(null, String.format("Transferred %d units of %s from source to destination warehouse.", quantity, product.getName())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWarehouse(@PathVariable("id") String id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new CustomException("Warehouse not found", HttpStatus.NOT_FOUND));
        warehouseRepository.delete(warehouse);
        return ResponseEntity.ok(ApiResponse.success(null, "Warehouse deleted successfully"));
    }
}
