package com.sliit.studyhub.controller;

import com.sliit.studyhub.model.StudySession;
import com.sliit.studyhub.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class SessionController {
    private final SessionService sessionService;
    
    @PostMapping
    public StudySession createSession(@RequestBody StudySession session, @AuthenticationPrincipal UserDetails user) {
        session.setCreatedBy(user.getUsername());
        return sessionService.createSession(session);
    }
    
    @PostMapping("/{sessionId}/join")
    public StudySession joinSession(@PathVariable String sessionId, @AuthenticationPrincipal UserDetails user) {
        return sessionService.joinSession(sessionId, user.getUsername());
    }
    
    @GetMapping("/upcoming")
    public List<StudySession> upcoming(
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end) {
        LocalDateTime startDateTime = (start != null && !start.isBlank())
                ? LocalDateTime.parse(start)
                : LocalDateTime.now();
        LocalDateTime endDateTime = (end != null && !end.isBlank())
                ? LocalDateTime.parse(end)
                : startDateTime.plusDays(7);
        return sessionService.getUpcomingSessions(startDateTime, endDateTime);
    }

    @GetMapping("/group/{groupId}")
    public List<StudySession> groupSessions(@PathVariable String groupId) {
        return sessionService.getSessionsByGroup(groupId);
    }

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;

    @PostMapping("/{sessionId}/checkin")
    public com.sliit.studyhub.model.AttendanceRecord checkIn(@PathVariable String sessionId, @AuthenticationPrincipal UserDetails user) {
        org.springframework.data.mongodb.core.query.Query q = new org.springframework.data.mongodb.core.query.Query();
        q.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("sessionId").is(sessionId).and("studentId").is(user.getUsername()));
        com.sliit.studyhub.model.AttendanceRecord existing = mongoTemplate.findOne(q, com.sliit.studyhub.model.AttendanceRecord.class);
        if (existing != null) return existing;
        
        com.sliit.studyhub.model.AttendanceRecord record = new com.sliit.studyhub.model.AttendanceRecord();
        record.setSessionId(sessionId);
        record.setStudentId(user.getUsername());
        return mongoTemplate.save(record);
    }

    @GetMapping("/{sessionId}/attendance")
    public List<com.sliit.studyhub.model.AttendanceRecord> getAttendance(@PathVariable String sessionId) {
        org.springframework.data.mongodb.core.query.Query q = new org.springframework.data.mongodb.core.query.Query();
        q.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("sessionId").is(sessionId));
        return mongoTemplate.find(q, com.sliit.studyhub.model.AttendanceRecord.class);
    }

    @GetMapping("/deadlines")
    public List<String> getDeadlines(@RequestParam List<String> modules, @RequestParam String date) {
        return sessionService.checkDeadlineConflicts(modules, LocalDateTime.parse(date));
    }

    @GetMapping("/suggest-times")
    public List<LocalDateTime> suggestTimes(@RequestParam String groupId) { // Wait MatchId was requested, I'll map it to string
        return sessionService.suggestSessionTimes(groupId);
    }
}
