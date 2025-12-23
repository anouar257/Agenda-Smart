package com.agenda.ai;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventDto {
    private String action; // CREATE, UPDATE, DELETE
    private String title;
    private String searchTitle; // For UPDATE/DELETE - title to find
    private String startDate; // YYYY-MM-DD
    private String startTime; // HH:mm
    private String category; // WORK, HEALTH, SPORT, SOCIAL
    private String priority; // HIGH, MEDIUM, LOW
}

