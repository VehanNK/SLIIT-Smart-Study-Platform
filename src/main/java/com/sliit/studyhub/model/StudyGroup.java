package com.sliit.studyhub.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "groups")
public class StudyGroup {
    @Id
    private String id;
    private String name;
    private String moduleCode;      // e.g., IT1050
    private String moduleName;
    private int year;
    private int semester;
    private String targetProgram;   // IT, CS, etc. or "ALL"
    private String createdBy;       // studentId of creator
    private List<String> members = new ArrayList<>();
    private List<String> admins = new ArrayList<>();
    private List<String> resources = new ArrayList<>(); // resource IDs
    private String description;
    
    // New UI fields
    private int maxMembers = 15;
    private boolean isPublic = true;
    private List<String> tags = new ArrayList<>();
    private List<Announcement> announcements = new ArrayList<>();

    @Data
    @NoArgsConstructor
    public static class Announcement {
        private String id = java.util.UUID.randomUUID().toString();
        private String text;
        private String authorId;
        private String createdAt = java.time.Instant.now().toString();

        public Announcement(String text, String authorId) {
            this.text = text;
            this.authorId = authorId;
        }
    }
}