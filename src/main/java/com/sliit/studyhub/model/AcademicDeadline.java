package com.sliit.studyhub.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "academic_deadlines")
public class AcademicDeadline {
    @Id
    private String id;
    private String moduleCode;
    private String deadlineType; // ASSIGNMENT, EXAM, PROJECT
    private LocalDateTime date;
    private String description;
}
