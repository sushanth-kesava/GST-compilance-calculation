package com.smartretail360.controller;

import com.smartretail360.dto.ApiResponse;
import com.smartretail360.exception.CustomException;
import com.smartretail360.model.Supplier;
import com.smartretail360.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'SUPER_ADMIN')")
public class SupplierController {

    @Autowired
    private SupplierRepository supplierRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Supplier>>> getAllSuppliers() {
        return ResponseEntity.ok(ApiResponse.success(supplierRepository.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Supplier>> getSupplierById(@PathVariable("id") String id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new CustomException("Supplier not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.success(supplier));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Supplier>> createSupplier(@RequestBody Supplier supplier) {
        Supplier saved = supplierRepository.save(supplier);
        return ResponseEntity.ok(ApiResponse.success(saved, "Supplier created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Supplier>> updateSupplier(@PathVariable("id") String id, @RequestBody Supplier details) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new CustomException("Supplier not found", HttpStatus.NOT_FOUND));

        supplier.setName(details.getName());
        supplier.setContactName(details.getContactName());
        supplier.setEmail(details.getEmail());
        supplier.setPhone(details.getPhone());
        supplier.setGstNumber(details.getGstNumber());
        supplier.setPan(details.getPan());
        supplier.setRating(details.getRating());
        
        if (details.getPendingPayments() != null) {
            supplier.setPendingPayments(details.getPendingPayments());
        }

        Supplier updated = supplierRepository.save(supplier);
        return ResponseEntity.ok(ApiResponse.success(updated, "Supplier updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSupplier(@PathVariable("id") String id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new CustomException("Supplier not found", HttpStatus.NOT_FOUND));
        supplierRepository.delete(supplier);
        return ResponseEntity.ok(ApiResponse.success(null, "Supplier deleted successfully"));
    }
}
