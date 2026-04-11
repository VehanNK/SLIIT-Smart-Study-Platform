package com.sliit.studyhub.service;

import com.sliit.studyhub.model.StudySession;
import com.sliit.studyhub.repository.StudySessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SessionService {
    private final StudySessionRepository sessionRepository;
    
    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;
    
    @org.springframework.beans.factory.annotation.Autowired
    private GoogleMeetService googleMeetService;
    
    @org.springframework.beans.factory.annotation.Autowired
    private ZoomMeetService zoomMeetService;


    public StudySession createSession(StudySession session) {
        // Task 4: validate time range
        if (session.getStartTime() == null || session.getEndTime() == null) {
            throw new IllegalArgumentException("Start time and end time are required");
        }
        if (!session.getStartTime().isBefore(session.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }
        if (session.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Session cannot be scheduled in the past");
        }

        // Task 4: prevent overlapping sessions in the same group
        if (session.getGroupId() != null && !session.getGroupId().isBlank()) {
            List<StudySession> conflicts = sessionRepository.findOverlappingSessions(
                    session.getGroupId(), session.getStartTime(), session.getEndTime()
            );
            if (!conflicts.isEmpty()) {
                throw new RuntimeException(
                    "This group already has a session scheduled during that time window"
                );
            }
        }

        // Auto-initialize attendees
        if (session.getAttendees() == null) {
            session.setAttendees(new ArrayList<>());
        }

        // Auto-add creator to attendees if present
        if (session.getCreatedBy() != null && !session.getCreatedBy().isBlank()) {
            if (!session.getAttendees().contains(session.getCreatedBy())) {
                session.getAttendees().add(session.getCreatedBy());
            }
        }

        // Generate a link based on title or logic, let's look for provider in title or explicit payload
        // The frontend will send the provider in the title or we can just randomly assign, or default to Google.
        // Actually we will assume google unless "Zoom" is in title for simplicity, or if we added provider field
        if (session.getTitle() != null && session.getTitle().toLowerCase().contains("zoom")) {
            session.setMeetingLink(zoomMeetService.generateMeetingLink(session.getTitle()));
        } else {
            session.setMeetingLink(googleMeetService.generateMeetingLink(session.getTitle()));
        }

        return sessionRepository.save(session);
    }

    public List<String> checkDeadlineConflicts(List<String> modules, LocalDateTime date) {
        List<String> warnings = new ArrayList<>();
        if (modules == null || modules.isEmpty() || date == null) return warnings;

        LocalDateTime startWindow = date.minusDays(3);
        LocalDateTime endWindow = date.plusDays(3);

        org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
        query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("moduleCode").in(modules)
            .and("date").gte(startWindow).lte(endWindow));
        
        List<com.sliit.studyhub.model.AcademicDeadline> deadlines = mongoTemplate.find(query, com.sliit.studyhub.model.AcademicDeadline.class);
        
        for (var dl : deadlines) {
             warnings.add("Warning: Participant module " + dl.getModuleCode() + " has a " + dl.getDeadlineType() + " deadline closely on " + dl.getDate().toLocalDate().toString() + ".");
        }
        return warnings;
    }

    public List<LocalDateTime> suggestSessionTimes(String groupId) {
        List<LocalDateTime> suggestions = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // Fetch sessions already scheduled for this group in the next 14 days
        LocalDateTime windowEnd = now.plusDays(14);
        List<StudySession> existing = sessionRepository.findByStartTimeBetween(now, windowEnd)
                .stream()
                .filter(s -> groupId.equals(s.getGroupId()))
                .toList();

        for (int i = 1; i <= 14 && suggestions.size() < 7; i++) {
            LocalDateTime day = now.plusDays(i);
            java.time.DayOfWeek dw = day.getDayOfWeek();

            // Pick a candidate slot: 10AM weekends, 7PM weekdays
            LocalDateTime candidate;
            if (dw == java.time.DayOfWeek.SATURDAY || dw == java.time.DayOfWeek.SUNDAY) {
                candidate = day.withHour(10).withMinute(0).withSecond(0).withNano(0);
            } else {
                candidate = day.withHour(19).withMinute(0).withSecond(0).withNano(0);
            }

            // Skip if this group already has a session within 2 hours of the candidate
            LocalDateTime candidateEnd = candidate.plusHours(2);
            boolean conflict = existing.stream().anyMatch(s ->
                s.getStartTime() != null &&
                s.getStartTime().isBefore(candidateEnd) &&
                (s.getEndTime() != null ? s.getEndTime().isAfter(candidate) : s.getStartTime().plusHours(1).isAfter(candidate))
            );

            if (!conflict) {
                suggestions.add(candidate);
            }
        }
        return suggestions;
    }

    public StudySession joinSession(String sessionId, String studentId) {
        StudySession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

        // Guard against null attendees
        if (session.getAttendees() == null) {
            session.setAttendees(new ArrayList<>());
        }

        if (!session.getAttendees().contains(studentId)) {
            session.getAttendees().add(studentId);
        }
        return sessionRepository.save(session);
    }

    public List<StudySession> getUpcomingSessions(LocalDateTime from, LocalDateTime to) {
        return sessionRepository.findByStartTimeBetween(from, to);
    }

    public List<StudySession> getSessionsByGroup(String groupId) {
        return sessionRepository.findByGroupId(groupId);
    }
}
