package com.sliit.studyhub.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;
import java.util.ArrayList;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "resources")
public class Resource {
    @Id
    private String id;
    private String title;
    private String description;
    private String fileUrl;
    private String moduleCode;
    private int year;
    private int semester;
    private String resourceType;
    private String uploadedBy;
    private int uploaderIntake;
    private String uploaderProgram;
    private int uploaderYear;
    private int uploaderSemester;
    private LocalDateTime uploadedAt;
    private int downloads = 0;
    private double avgRating = 0.0;
    private List<Review> reviews = new ArrayList<>();
}