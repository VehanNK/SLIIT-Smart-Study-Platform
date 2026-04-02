package com.sliit.studyhub.model.dto;

import lombok.Data;

@Data
public class ResourceSearchRequest {
    private String  moduleCode;
    private Integer year;
    private Integer semester;
    private String  program;
    private Integer uploaderIntake;
    private String  resourceType;
    private Double  minRating;      // filter by minimum avgRating
    private String  sortBy;        // "rating" | "downloads" | "newest"
    private int     page = 0;
    private int     size = 10;
    private String  searcherId;
}
