package com.smartretail360.repository;

import com.smartretail360.model.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {
    Optional<Product> findByBarcode(String barcode);
    Optional<Product> findBySku(String sku);
    List<Product> findByCategoryId(String categoryId);

    @Query("{ '$or': [ { 'name': { '$regex': ?0, '$options': 'i' } }, { 'sku': { '$regex': ?0, '$options': 'i' } }, { 'barcode': ?0 } ] }")
    List<Product> searchProducts(String term);

    List<Product> findByTotalStockLessThanEqual(int threshold);
}
