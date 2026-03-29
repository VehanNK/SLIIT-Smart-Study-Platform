package com.sliit.studyhub.controller;

import com.sliit.studyhub.model.Student;
import com.sliit.studyhub.model.dto.StudentResponse;
import com.sliit.studyhub.service.MatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class MatchingController {
    private final MatchingService matchingService;
    
    @GetMapping("/peers")
    public Page<com.sliit.studyhub.model.dto.MatchResultDTO> getPeers(@AuthenticationPrincipal UserDetails user, Pageable pageable) {
        return matchingService.getPeerMatches(user.getUsername(), pageable);
    }
    
    @GetMapping("/mentors")
    public Page<com.sliit.studyhub.model.dto.MatchResultDTO> getMentors(@AuthenticationPrincipal UserDetails user, Pageable pageable) {
        return matchingService.getMentorMatches(user.getUsername(), pageable);
    }

    @GetMapping("/crossprogram")
    public Page<com.sliit.studyhub.model.dto.MatchResultDTO> getCrossProgram(@AuthenticationPrincipal UserDetails user, Pageable pageable) {
        return matchingService.getCrossProgramMatches(user.getUsername(), pageable);
    }

    @GetMapping("/suggest")
    public com.sliit.studyhub.model.dto.GroupCreationSuggestion suggestGroup(@AuthenticationPrincipal UserDetails user) {
        return matchingService.suggestGroupCreation(user.getUsername());
    }
}
