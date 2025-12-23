package com.agenda.calendar;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<EventEntity, Long> {
    List<EventEntity> findByUserId(String userId);

    List<EventEntity> findByUserIdAndStartDate(String userId, String startDate);
}
