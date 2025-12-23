package com.agenda.notification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ReminderScheduler reminderScheduler;

    // Health check endpoint
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "notification-service",
                "kafka", "connected",
                "websocket", "enabled",
                "reminders", "active"));
    }

    // Manual test endpoint to send a notification
    @PostMapping("/test")
    public ResponseEntity<String> testNotification(@RequestBody Map<String, String> body) {
        String userId = body.getOrDefault("userId", "test-user");
        String title = body.getOrDefault("title", "Test Notification");
        String message = body.getOrDefault("message", "This is a test notification");

        NotificationMessage notification = new NotificationMessage("TEST", userId, title, message);

        // Send to all subscribers
        messagingTemplate.convertAndSend("/topic/notifications", notification);

        System.out.println("[TEST] Notification sent: " + title);

        return ResponseEntity.ok("Notification sent: " + title);
    }

    // Test reminder endpoint - simulates a reminder notification
    @PostMapping("/test-reminder")
    public ResponseEntity<String> testReminder(@RequestBody Map<String, String> body) {
        String userId = body.getOrDefault("userId", "test-user");
        String title = body.getOrDefault("title", "Réunion importante");
        int minutesUntil = Integer.parseInt(body.getOrDefault("minutesUntil", "30"));

        reminderScheduler.sendTestReminder(userId, title, minutesUntil);

        return ResponseEntity.ok("Reminder sent for: " + title);
    }
}
