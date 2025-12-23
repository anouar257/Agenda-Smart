package com.agenda.notification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class KafkaEventConsumer {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @KafkaListener(topics = "event-notifications", groupId = "notification-group")
    public void consumeEventNotification(Map<String, Object> event) {
        System.out.println("===========================================");
        System.out.println("[KAFKA CONSUMER] Received event from Kafka:");
        System.out.println("  Type: " + event.get("type"));
        System.out.println("  Title: " + event.get("title"));
        System.out.println("  User: " + event.get("userId"));
        System.out.println("  Date: " + event.get("startDate"));
        System.out.println("===========================================");

        // Create notification message
        NotificationMessage notification = new NotificationMessage();
        notification.setType((String) event.get("type"));
        notification.setUserId((String) event.get("userId"));
        notification.setTitle((String) event.get("title"));
        
        Object eventId = event.get("id");
        notification.setEventId(eventId != null ? eventId.toString() : null);
        
        // Set appropriate message based on event type
        String type = (String) event.getOrDefault("type", "CREATED");
        switch (type) {
            case "CREATED":
                notification.setMessage("Nouvel événement créé: " + event.get("title"));
                break;
            case "AI_EXTRACTED":
                notification.setMessage("IA a extrait: " + event.get("title"));
                break;
            case "REMINDER":
                notification.setMessage("Rappel: " + event.get("title") + " le " + event.get("startDate"));
                break;
            default:
                notification.setMessage("Événement: " + event.get("title"));
        }

        // Send to all subscribers via WebSocket
        messagingTemplate.convertAndSend("/topic/notifications", notification);
        
        // Also send to user-specific topic
        String userId = (String) event.get("userId");
        if (userId != null) {
            messagingTemplate.convertAndSend("/topic/notifications/" + userId, notification);
        }
        
        System.out.println("[WEBSOCKET] Notification sent to /topic/notifications");
    }
}
