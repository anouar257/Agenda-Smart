package com.agenda.calendar;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class KafkaNotificationProducer {

    private static final String TOPIC = "event-notifications";

    @Autowired
    private KafkaTemplate<String, Map<String, Object>> kafkaTemplate;

    public void sendEventNotification(EventEntity event, String type) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("id", event.getId());
            message.put("title", event.getTitle());
            message.put("startDate", event.getStartDate());
            message.put("startTime", event.getStartTime());
            message.put("category", event.getCategory());
            message.put("userId", event.getUserId());
            message.put("type", type); // CREATED, UPDATED, DELETED, AI_EXTRACTED

            kafkaTemplate.send(TOPIC, message);

            System.out.println("===========================================");
            System.out.println("[KAFKA PRODUCER] Message sent to topic: " + TOPIC);
            System.out.println("  Type: " + type);
            System.out.println("  Title: " + event.getTitle());
            System.out.println("  User: " + event.getUserId());
            System.out.println("===========================================");
        } catch (Exception e) {
            System.err.println("[KAFKA PRODUCER] Failed to send message: " + e.getMessage());
        }
    }
}
