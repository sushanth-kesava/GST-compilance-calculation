package com.smartretail360.service;

import com.smartretail360.model.Notification;
import com.smartretail360.model.Product;
import com.smartretail360.model.Invoice;
import com.smartretail360.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    public void sendLowStockAlert(Product product) {
        String message = String.format("Product '%s' (SKU: %s) is running low on stock! Current stock: %d. Reorder level: %d",
                product.getName(), product.getSku(), product.getTotalStock(), product.getReorderLevel());
        
        Notification notification = Notification.builder()
                .title("Low Stock Warning")
                .message(message)
                .type("LOW_STOCK")
                .read(false)
                .createdAt(Instant.now())
                .build();

        notificationRepository.save(notification);
        broadcast(notification);
    }

    public void sendPaymentAlert(Invoice invoice) {
        String message = String.format("Invoice %s generated successfully for customer %s. Total Amount: INR %s",
                invoice.getInvoiceNumber(), invoice.getCustomerName(), invoice.getFinalAmount().toString());
        
        Notification notification = Notification.builder()
                .title("Payment Received")
                .message(message)
                .type("PAYMENT_ALERT")
                .read(false)
                .createdAt(Instant.now())
                .build();

        notificationRepository.save(notification);
        broadcast(notification);
    }

    public void sendCouponAlert(String title, String message) {
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type("COUPON_ALERT")
                .read(false)
                .createdAt(Instant.now())
                .build();

        notificationRepository.save(notification);
        broadcast(notification);
    }

    public List<Notification> getUnreadNotifications() {
        return notificationRepository.findByReadFalseOrderByCreatedAtDesc();
    }

    public void markAsRead(String id) {
        notificationRepository.findById(id).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    private void broadcast(Notification notification) {
        try {
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/notifications", notification);
            }
        } catch (Exception ex) {
            System.err.println("Failed to broadcast notification: " + ex.getMessage());
        }
    }
}
