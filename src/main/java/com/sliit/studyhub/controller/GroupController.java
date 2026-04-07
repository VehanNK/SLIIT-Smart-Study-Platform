package com.sliit.studyhub.controller;

import com.sliit.studyhub.model.StudyGroup;
import com.sliit.studyhub.service.StudyGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class GroupController {
    private final StudyGroupService groupService;
    
    @PostMapping
    public StudyGroup createGroup(@RequestBody StudyGroup group, @AuthenticationPrincipal UserDetails user) {
        return groupService.createGroup(group, user.getUsername());
    }
    
    @PostMapping("/{groupId}/join")
    public StudyGroup joinGroup(@PathVariable String groupId, @AuthenticationPrincipal UserDetails user) {
        return groupService.joinGroup(groupId, user.getUsername());
    }
    
    @GetMapping("/all")
    public List<StudyGroup> allGroups() {
        return groupService.getAllGroups();
    }

    @GetMapping("/{groupId}")
    public StudyGroup getGroup(@PathVariable String groupId) {
        return groupService.getGroupById(groupId);
    }

    @PostMapping("/{groupId}/announcements")
    public StudyGroup addAnnouncement(
            @PathVariable String groupId,
            @RequestBody java.util.Map<String, String> payload,
            @AuthenticationPrincipal UserDetails user) {
        return groupService.addAnnouncement(groupId, payload.get("text"), user.getUsername());
    }

    @GetMapping("/my")
    public List<StudyGroup> myGroups(@AuthenticationPrincipal UserDetails user) {
        return groupService.getMyGroups(user.getUsername());
    }
    
    @GetMapping("/suggestions")
    public List<StudyGroup> suggestions(@AuthenticationPrincipal UserDetails user) {
        return groupService.suggestGroups(user.getUsername());
    }

    // Task 5: Leave group
    @PostMapping("/{groupId}/leave")
    public StudyGroup leaveGroup(@PathVariable String groupId, @AuthenticationPrincipal UserDetails user) {
        return groupService.leaveGroup(groupId, user.getUsername());
    }

    // Task 5: Remove member (Admin only)
    @DeleteMapping("/{groupId}/members/{targetStudentId}")
    public StudyGroup removeMember(
            @PathVariable String groupId,
            @PathVariable String targetStudentId,
            @AuthenticationPrincipal UserDetails adminUser) {
        return groupService.removeMember(groupId, adminUser.getUsername(), targetStudentId);
    }

    // Stage 2 Additions
    @PostMapping("/{groupId}/moderators/{targetStudentId}")
    public StudyGroup promoteModerator(
            @PathVariable String groupId,
            @PathVariable String targetStudentId,
            @AuthenticationPrincipal UserDetails adminUser) {
        return groupService.promoteModerator(groupId, adminUser.getUsername(), targetStudentId);
    }

    @PostMapping("/{groupId}/moderators")
    public StudyGroup promoteModeratorByQuery(
            @PathVariable String groupId,
            @RequestParam String targetStudentId,
            @AuthenticationPrincipal UserDetails adminUser) {
        return groupService.promoteModerator(groupId, adminUser.getUsername(), targetStudentId);
    }

    @DeleteMapping("/{groupId}/members")
    public StudyGroup removeMemberByQuery(
            @PathVariable String groupId,
            @RequestParam String targetStudentId,
            @AuthenticationPrincipal UserDetails adminUser) {
        return groupService.removeMember(groupId, adminUser.getUsername(), targetStudentId);
    }

    @GetMapping("/{groupId}/moderators/suggestions")
    public List<com.sliit.studyhub.model.Student> suggestedModerators(
            @PathVariable String groupId,
            @AuthenticationPrincipal UserDetails user) {
        return groupService.getSuggestedModerators(groupId, user.getUsername());
    }

    @GetMapping("/{groupId}/feed")
    public List<com.sliit.studyhub.model.Resource> getGroupFeed(@PathVariable String groupId) {
        return groupService.getGroupFeed(groupId);
    }
}
