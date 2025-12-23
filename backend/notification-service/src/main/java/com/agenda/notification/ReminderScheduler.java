package com.agenda.notification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@EnableScheduling
public class ReminderScheduler {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final RestTemplate restTemplate = new RestTemplate();

    // Run every minute to check for upcoming events
    @Scheduled(fixedRate = 60000)
    public void checkUpcomingEvents() {
        System.out.println("[REMINDER] Checking for upcoming events...");

        try {
            // Get events from calendar-service
            String calendarUrl = "http://calendar-service:8082/api/calendar";

            // For demo purposes, we simulate checking events
            // In production, you'd call the calendar-service API

            LocalDateTime now = LocalDateTime.now();

            // Send test reminder (for demo)
            // In reality, this would iterate through actual events

        } catch (Exception e) {
            System.out.println("[REMINDER] Error checking events: " + e.getMessage());
        }
    }

    // Check events and send appropriate reminders
    public void checkAndSendReminders(List<Map<String, Object>> events) {
        LocalDateTime now = LocalDateTime.now();

        for (Map<String, Object> event : events) {
            try {
                String startDate = (String) event.get("startDate");
                String startTime = (String) event.get("startTime");
                String title = (String) event.get("title");
                String userId = (String) event.get("userId");

                if (startDate == null || startTime == null)
                    continue;

                LocalDateTime eventDateTime = parseEventDateTime(startDate, startTime);
                long minutesUntilEvent = java.time.Duration.between(now, eventDateTime).toMinutes();

                // Send reminder based on time until event
                String reminderMessage = null;

                if (minutesUntilEvent > 0 && minutesUntilEvent <= 30) {
                    reminderMessage = "⏰ Rappel: Vous avez \"" + title + "\" dans 30 minutes !";
                } else if (minutesUntilEvent > 30 && minutesUntilEvent <= 60) {
                    reminderMessage = "⏰ Rappel: Vous avez \"" + title + "\" dans 1 heure !";
                } else if (minutesUntilEvent > 1380 && minutesUntilEvent <= 1440) { // 23-24 hours
                    reminderMessage = "📅 Rappel: Vous avez \"" + title + "\" demain !";
                }

                if (reminderMessage != null) {
                    sendReminder(userId, title, reminderMessage, event.get("id"));
                }

            } catch (Exception e) {
                System.out.println("[REMINDER] Error processing event: " + e.getMessage());
            }
        }
    }

    private LocalDateTime parseEventDateTime(String date, String time) {
        LocalDate localDate = LocalDate.parse(date);
        LocalTime localTime = LocalTime.parse(time, DateTimeFormatter.ofPattern("HH:mm"));
        return LocalDateTime.of(localDate, localTime);
    }

    private void sendReminder(String userId, String title, String message, Object eventId) {
        NotificationMessage notification = new NotificationMessage();
        notification.setType("REMINDER");
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setEventId(eventId != null ? eventId.toString() : null);

        // Send to all subscribers
        messagingTemplate.convertAndSend("/topic/notifications", notification);

        // Send to user-specific topic
        if (userId != null) {
            messagingTemplate.convertAndSend("/topic/notifications/" + userId, notification);
        }

        System.out.println("===========================================");
        System.out.println("[REMINDER] Notification sent:");
        System.out.println("  User: " + userId);
        System.out.println("  Title: " + title);
        System.out.println("  Message: " + message);
        System.out.println("===========================================");
    }

    // Manual trigger for testing
    public void sendTestReminder(String userId, String eventTitle, int minutesUntil) {
        String message;
        if (minutesUntil <= 30) {
            message = "⏰ Rappel: Vous avez \"" + eventTitle + "\" dans 30 minutes !";
        } else if (minutesUntil <= 60) {
            message = "⏰ Rappel: Vous avez \"" + eventTitle + "\" dans 1 heure !";
        } else {
            message = "📅 Rappel: Vous avez \"" + eventTitle + "\" demain !";
        }

        sendReminder(userId, eventTitle, message, null);
    }
}
