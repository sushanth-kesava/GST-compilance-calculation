package com.smartretail360.repository;

import com.smartretail360.model.Category;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends MongoRepository<Category, String> {
    List<Category> findByParentCategoryId(String parentCategoryId);
}
