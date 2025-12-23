package com.agenda.notification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@EnableScheduling
public class ReminderScheduler {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final RestTemplate restTemplate = new RestTemplate();
    
    // Cache to track sent reminders: format "eventId_reminderType" (e.g. "5_30MIN", "5_1HOUR", "5_24HOUR")
    private final Set<String> sentReminders = new HashSet<>();

    // Run every minute to check for upcoming events
    @Scheduled(fixedRate = 60000)
    public void checkUpcomingEvents() {
        System.out.println("[REMINDER] Checking for upcoming events...");

        try {
            // Get events from calendar-service
            String calendarUrl = "http://calendar-service:8082/api/calendar/upcoming";
            
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                calendarUrl,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            
            List<Map<String, Object>> events = response.getBody();
            if (events != null && !events.isEmpty()) {
                System.out.println("[REMINDER] Found " + events.size() + " upcoming events");
                checkAndSendReminders(events);
            } else {
                System.out.println("[REMINDER] No upcoming events found");
            }

        } catch (Exception e) {
            System.out.println("[REMINDER] Error checking events: " + e.getMessage());
        }
    }

    // Check events and send appropriate reminders
    public void checkAndSendReminders(List<Map<String, Object>> events) {
        // Use Europe/Paris timezone to match user's local time
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Europe/Paris"));

        for (Map<String, Object> event : events) {
            try {
                String startDate = (String) event.get("startDate");
                String startTime = (String) event.get("startTime");
                String title = (String) event.get("title");
                String userId = (String) event.get("userId");
                Object eventId = event.get("id");

                if (startDate == null || startTime == null)
                    continue;

                LocalDateTime eventDateTime = parseEventDateTime(startDate, startTime);
                long minutesUntilEvent = java.time.Duration.between(now, eventDateTime).toMinutes();

                // Only check specific reminder windows and send ONCE per type
                String reminderMessage = null;
                String reminderType = null;

                // 30 minutes before (25-35 min window to catch it)
                if (minutesUntilEvent >= 25 && minutesUntilEvent <= 35) {
                    reminderType = "30MIN";
                    reminderMessage = "⏰ Dans 30 min: \"" + title + "\"";
                }
                // 1 hour before (55-65 min window)
                else if (minutesUntilEvent >= 55 && minutesUntilEvent <= 65) {
                    reminderType = "1HOUR";
                    reminderMessage = "⏰ Dans 1 heure: \"" + title + "\"";
                }
                // 24 hours before (1435-1445 min window = ~24h)
                else if (minutesUntilEvent >= 1435 && minutesUntilEvent <= 1445) {
                    reminderType = "24HOUR";
                    reminderMessage = "📅 Demain: \"" + title + "\"";
                }

                if (reminderMessage != null && reminderType != null) {
                    String cacheKey = eventId + "_" + reminderType;
                    
                    // Only send if not already sent
                    if (!sentReminders.contains(cacheKey)) {
                        sendReminder(userId, title, reminderMessage, eventId);
                        sentReminders.add(cacheKey);
                        System.out.println("[REMINDER] ✅ Sent " + reminderType + " reminder for: " + title);
                    }
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
