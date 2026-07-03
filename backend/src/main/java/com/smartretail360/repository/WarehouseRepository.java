package com.smartretail360.repository;

import com.smartretail360.model.Warehouse;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarehouseRepository extends MongoRepository<Warehouse, String> {
    List<Warehouse> findByActive(boolean active);
}
