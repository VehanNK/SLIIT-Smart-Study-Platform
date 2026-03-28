package com.sliit.studyhub.model.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String email;
    private String studyStyle;      // visual, auditory, kinesthetic
    private String profilePicture;  // URL string
    private java.util.Map<String, Integer> moduleConfidence; // per-module confidence (1-100)
}
