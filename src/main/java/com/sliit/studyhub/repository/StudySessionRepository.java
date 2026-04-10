package com.sliit.studyhub.repository;

import com.sliit.studyhub.model.StudySession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface StudySessionRepository extends MongoRepository<StudySession, String> {
    List<StudySession> findByGroupId(String groupId);
    List<StudySession> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);

    /**
     * Task 4: detect overlapping sessions for a given group.
     * A conflict exists if an existing session's window overlaps with [newStart, newEnd].
     */
    @Query("{ 'groupId': ?0, 'startTime': { $lt: ?2 }, 'endTime': { $gt: ?1 } }")
    List<StudySession> findOverlappingSessions(String groupId,
                                               LocalDateTime newStart,
                                               LocalDateTime newEnd);
}