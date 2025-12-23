package com.agenda.calendar;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import lombok.Data;

@Service
public class KafkaConsumerService {

    @Autowired
    private EventRepository eventRepository;

    @KafkaListener(topics = "ai-events-topic", groupId = "calendar-group")
    public void consume(EventDto eventDto) {
        System.out.println("Received event: " + eventDto);
        EventEntity entity = new EventEntity();
        entity.setTitle(eventDto.getTitle());
        entity.setStartDate(eventDto.getStartDate());
        entity.setStartTime(eventDto.getStartTime());
        entity.setCategory(eventDto.getCategory());
        entity.setPriority(eventDto.getPriority());
        eventRepository.save(entity);
    }

    // Temporary DTO for deserialization matching the producer
    @Data
    public static class EventDto {
        private String title;
        private String startDate;
        private String startTime;
        private String category;
        private String priority;
    }
}
