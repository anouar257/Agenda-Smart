package com.agenda.notification;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NotificationMessage {
    private String id;
    private String type;  // EVENT_CREATED, REMINDER, AI_EXTRACTED
    private String userId;
    private String title;
    private String message;
    private String eventId;
    private LocalDateTime timestamp;
    
    public NotificationMessage() {
        this.id = String.valueOf(System.currentTimeMillis());
        this.timestamp = LocalDateTime.now();
    }
    
    public NotificationMessage(String type, String userId, String title, String message) {
        this();
        this.type = type;
        this.userId = userId;
        this.title = title;
        this.message = message;
    }
}
