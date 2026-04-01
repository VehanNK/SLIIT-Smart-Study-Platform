package com.sliit.studyhub.model;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class Review {
    private String studentId;
    private int rating;
    private String comment;
    private String date;
    private boolean isAnonymous;
}