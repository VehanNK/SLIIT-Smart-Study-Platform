package com.sliit.studyhub.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "sessions")
public class StudySession {
    @Id
    private String id;
    private String groupId;
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String meetingLink;     // Zoom/Google Meet URL
    private List<String> attendees; // list of studentIds
    private String createdBy;
}