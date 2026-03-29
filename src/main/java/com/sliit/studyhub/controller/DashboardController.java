package com.sliit.studyhub.controller;

import com.sliit.studyhub.model.Student;
import com.sliit.studyhub.model.dto.DashboardResponse;
import com.sliit.studyhub.service.MatchingService;
import com.sliit.studyhub.service.ResourceService;
import com.sliit.studyhub.service.SessionService;
import com.sliit.studyhub.service.StudentService;
import com.sliit.studyhub.service.StudyGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class DashboardController {

    private final StudentService studentService;
    private final ResourceService resourceService;
    private final StudyGroupService groupService;
    private final MatchingService matchingService;
    private final SessionService sessionService;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(@AuthenticationPrincipal UserDetails user) {
        String studentId = user.getUsername();
        Student student = studentService.findByStudentId(studentId);

        DashboardResponse response = new DashboardResponse();

        // 1. Top 5 Recommended Resources
        var resources = resourceService.getRecommendedResources(student);
        response.setRecommendedResources(resources.subList(0, Math.min(resources.size(), 5)));

        // 2. Top 5 Suggested Groups
        var groups = groupService.suggestGroups(studentId);
        if (groups.isEmpty()) {
            groups = groupService.getAllGroups();
        }
        response.setSuggestedGroups(groups.subList(0, Math.min(groups.size(), 5)));

        // 3. Top 5 Recommended Peers
        var peersPage = matchingService.getPeerMatches(studentId, PageRequest.of(0, 5));
        response.setRecommendedPeers(peersPage.getContent());

        // 4. Upcoming Sessions (Next 7 Days for the student's groups)
        // Since getUpcomingSessions is global by date, we will fetch global for now or filter by group.
        // For simplicity, we fetch global upcoming sessions next 7 days, limit to 5.
        // A better approach is fetching only sessions for groups the user is in.
        var sessions = sessionService.getUpcomingSessions(LocalDateTime.now(), LocalDateTime.now().plusDays(7));
        // Filter sessions to only those where the student is an attendee or in the group
        var userSessions = sessions.stream()
                .filter(s -> (s.getAttendees() != null && s.getAttendees().contains(studentId))
                          || (s.getGroupId() != null && groupService.getMyGroups(studentId).stream().anyMatch(g -> g.getId().equals(s.getGroupId()))))
                .limit(5)
                .toList();

        if (userSessions.isEmpty() && !sessions.isEmpty()) {
            userSessions = sessions.stream().limit(5).toList();
        }
        response.setUpcomingSessions(userSessions);

        return ResponseEntity.ok(response);
    }
}
