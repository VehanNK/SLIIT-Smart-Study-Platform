package com.sliit.studyhub.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@Document(collection = "connection_requests")
public class ConnectionRequest {
    @Id
    private String id;
    private String fromStudentId;
    private String toStudentId;
    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED
    private String createdAt = java.time.Instant.now().toString();
}
