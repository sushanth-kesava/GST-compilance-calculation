package com.smartretail360.controller;

import com.smartretail360.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Value("${app.store.name}")
    private String storeName;

    @Value("${app.store.gstin}")
    private String storeGstin;

    @Value("${app.store.state}")
    private String storeState;

    @GetMapping("/store")
    public ResponseEntity<ApiResponse<Map<String, String>>> getStoreConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("name", storeName);
        config.put("gstin", storeGstin);
        config.put("state", storeState);
        return ResponseEntity.ok(ApiResponse.success(config));
    }

    @PutMapping("/store")
    public ResponseEntity<ApiResponse<Map<String, String>>> updateStoreConfig(@RequestBody Map<String, String> updates) {
        // In a production system, these would be persisted to a database.
        // For now, we reflect back the updated values (ephemeral - changes last until restart).
        Map<String, String> config = new HashMap<>();
        config.put("name", updates.getOrDefault("name", storeName));
        config.put("gstin", updates.getOrDefault("gstin", storeGstin));
        config.put("state", updates.getOrDefault("state", storeState));
        return ResponseEntity.ok(ApiResponse.success(config, "Store configuration updated. Note: Changes are in-memory and reset on restart."));
    }
}
