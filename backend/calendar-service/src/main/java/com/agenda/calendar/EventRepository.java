package com.agenda.calendar;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<EventEntity, Long> {
    List<EventEntity> findByUserId(String userId);

    List<EventEntity> findByUserIdAndStartDate(String userId, String startDate);

    @Query("SELECT e FROM EventEntity e WHERE e.startDate >= :today AND e.startDate <= :tomorrow")
    List<EventEntity> findUpcomingEvents(@Param("today") String today, @Param("tomorrow") String tomorrow);
}
