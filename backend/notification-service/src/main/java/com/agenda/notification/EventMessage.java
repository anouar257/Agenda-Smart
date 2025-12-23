package com.agenda.notification;

import lombok.Data;

@Data
public class EventMessage {
    private Long id;
    private String title;
    private String startDate;
    private String startTime;
    private String category;
    private String userId;
    private String type;  // CREATED, UPDATED, DELETED
}
