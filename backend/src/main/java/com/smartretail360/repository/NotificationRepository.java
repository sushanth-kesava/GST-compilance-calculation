package com.smartretail360.repository;

import com.smartretail360.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByReadFalseOrderByCreatedAtDesc();
}
