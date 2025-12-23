package com.agenda.calendar;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId; // For multi-user support
    private String title;
    private String startDate; // YYYY-MM-DD
    private String startTime; // HH:mm
    private String category; // WORK, HEALTH, SPORT, SOCIAL
    private String priority; // HIGH, MEDIUM, LOW
    private String description;
}
