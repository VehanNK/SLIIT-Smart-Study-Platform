package com.sliit.studyhub.model.dto;

import com.sliit.studyhub.model.Resource;
import com.sliit.studyhub.model.StudyGroup;
import com.sliit.studyhub.model.StudySession;
import lombok.Data;

import java.util.List;

@Data
public class DashboardResponse {
    private List<Resource> recommendedResources;
    private List<StudyGroup> suggestedGroups;
    private List<MatchResultDTO> recommendedPeers;
    private List<StudySession> upcomingSessions;
}
