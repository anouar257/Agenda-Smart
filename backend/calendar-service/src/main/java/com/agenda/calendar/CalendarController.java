package com.agenda.calendar;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private KafkaNotificationProducer kafkaProducer;

    // Get all events for current user (filtered by userId from JWT)
    @GetMapping
    public List<EventEntity> getAllEvents(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        System.out.println("[Calendar] Getting events for user: " + userId);
        if (userId != null && !userId.isEmpty()) {
            return eventRepository.findByUserId(userId);
        }
        // If no userId (shouldn't happen with JWT), return empty
        return List.of();
    }

    // Create new event for current user
    @PostMapping
    public EventEntity createEvent(
            @RequestBody EventEntity event,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        System.out.println("[Calendar] Creating event for user: " + userId);
        if (userId != null) {
            event.setUserId(userId);
        }
        EventEntity saved = eventRepository.save(event);
        System.out.println("[Calendar] Event saved: " + saved.getId());

        // Send Kafka notification for new event
        kafkaProducer.sendEventNotification(saved, "CREATED");

        return saved;
    }

    // Get event by ID (only if belongs to user)
    @GetMapping("/{id}")
    public ResponseEntity<EventEntity> getEventById(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return eventRepository.findById(id)
                .filter(e -> userId == null || userId.equals(e.getUserId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update event (only if belongs to user)
    @PutMapping("/{id}")
    public ResponseEntity<EventEntity> updateEvent(
            @PathVariable Long id,
            @RequestBody EventEntity eventDetails,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return eventRepository.findById(id)
                .filter(e -> userId == null || userId.equals(e.getUserId()))
                .map(event -> {
                    event.setTitle(eventDetails.getTitle());
                    event.setStartDate(eventDetails.getStartDate());
                    event.setStartTime(eventDetails.getStartTime());
                    event.setCategory(eventDetails.getCategory());
                    event.setPriority(eventDetails.getPriority());
                    event.setDescription(eventDetails.getDescription());
                    EventEntity updated = eventRepository.save(event);

                    // Send Kafka notification for updated event
                    kafkaProducer.sendEventNotification(updated, "UPDATED");

                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete event (only if belongs to user)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return eventRepository.findById(id)
                .filter(e -> userId == null || userId.equals(e.getUserId()))
                .map(event -> {
                    // Send Kafka notification before deleting
                    kafkaProducer.sendEventNotification(event, "DELETED");
                    eventRepository.delete(event);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Get events by date for current user
    @GetMapping("/date/{date}")
    public List<EventEntity> getEventsByDate(
            @PathVariable String date,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId != null && !userId.isEmpty()) {
            return eventRepository.findByUserIdAndStartDate(userId, date);
        }
        return List.of();
    }
}
