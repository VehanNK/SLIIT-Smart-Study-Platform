package com.sliit.studyhub.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupCreationSuggestion {
    private String moduleCode;
    private List<String> suggestedPeerIds;
    private String message;
    private int score;
    private String rationale;
}
