package com.smartretail360.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "categories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Category {
    @Id
    private String id;
    private String name;
    private String parentCategoryId; // For nested categories
    private String description;
    private String imageUrl;
    @Builder.Default
    private int productCount = 0;
}
