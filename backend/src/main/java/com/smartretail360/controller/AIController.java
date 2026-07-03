package com.smartretail360.controller;

import com.smartretail360.dto.ApiResponse;
import com.smartretail360.model.Product;
import com.smartretail360.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Autowired
    private AIService aiService;

    @GetMapping("/frauds")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> detectFrauds() {
        return ResponseEntity.ok(ApiResponse.success(aiService.detectFrauds()));
    }

    @GetMapping("/forecast/demand")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDemandForecast(@RequestParam("productId") String productId) {
        return ResponseEntity.ok(ApiResponse.success(aiService.getDemandForecast(productId)));
    }

    @GetMapping("/forecast/sales")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSalesForecast() {
        return ResponseEntity.ok(ApiResponse.success(aiService.getSalesForecast()));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<List<Product>>> getRecommendations(@RequestParam(value = "customerId", required = false) String customerId) {
        return ResponseEntity.ok(ApiResponse.success(aiService.getRecommendations(customerId)));
    }

    @GetMapping("/segments")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCustomerSegments() {
        return ResponseEntity.ok(ApiResponse.success(aiService.getCustomerSegments()));
    }
}
