package com.sliit.studyhub.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchResultDTO {
    private String studentId;
    private String program;
    private int intakeYear;
    private int currentYear;
    private String studyStyle;
    private String profilePicture;
    
    // Match logic specific fields
    private int matchScore;
    private List<String> matchReasons; // e.g., "Same Intake", "High Confidence in Java", "Same Study Style"
    private String connectionStatus; // "NONE", "PENDING_SENT", "PENDING_RECEIVED", "CONNECTED"
}
