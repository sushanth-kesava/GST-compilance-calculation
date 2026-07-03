package com.smartretail360.controller;

import com.smartretail360.dto.ApiResponse;
import com.smartretail360.exception.CustomException;
import com.smartretail360.model.Category;
import com.smartretail360.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.success(categoryRepository.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> getCategoryById(@PathVariable("id") String id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CustomException("Category not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Category>> createCategory(@RequestBody Category category) {
        Category saved = categoryRepository.save(category);
        return ResponseEntity.ok(ApiResponse.success(saved, "Category created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Category>> updateCategory(@PathVariable("id") String id, @RequestBody Category details) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CustomException("Category not found", HttpStatus.NOT_FOUND));

        category.setName(details.getName());
        category.setParentCategoryId(details.getParentCategoryId());
        category.setDescription(details.getDescription());
        category.setImageUrl(details.getImageUrl());
        category.setProductCount(details.getProductCount());

        Category updated = categoryRepository.save(category);
        return ResponseEntity.ok(ApiResponse.success(updated, "Category updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable("id") String id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CustomException("Category not found", HttpStatus.NOT_FOUND));
        categoryRepository.delete(category);
        return ResponseEntity.ok(ApiResponse.success(null, "Category deleted successfully"));
    }
}
