package com.sliit.studyhub.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "attendance_records")
public class AttendanceRecord {
    @Id
    private String id;
    private String sessionId;
    private String studentId;
    private LocalDateTime checkedInAt = LocalDateTime.now();
}
