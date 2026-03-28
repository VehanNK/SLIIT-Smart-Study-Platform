package com.sliit.studyhub.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "students")
public class Student {
    @Id
    private String id;

    @Indexed(unique = true)
    private String studentId;       // e.g., IT23561298

    private String name;            // Full name
    private String faculty;         // COMPUTING, ENGINEERING, BUSINESS
    private String program;         // IT, SE, CS, DS, ISE, CSNE, CE, EE, ME, BA, FM, HRM
    private int intakeYear;         // derived from ID digits (e.g., 23 → 2023)
    private int currentYear;        // 1, 2, 3, 4 (explicitly set by student)
    private int currentSemester;    // 1 or 2 (explicitly set by student)
    private String email;
    private String password;        // encoded
    private String studyStyle;      // visual, auditory, kinesthetic
    private String profilePicture;  // optional
    private List<String> currentModules = new ArrayList<>();
    private java.util.Map<String, Integer> moduleConfidence = new java.util.HashMap<>();
    private boolean reminderEnabled = false;

    // Constructor for backward compatibility
    public Student(String studentId, String program, int intakeYear, int currentYear, String email, String password) {
        this.studentId = studentId;
        this.program = program;
        this.intakeYear = intakeYear;
        this.currentYear = currentYear;
        this.email = email;
        this.password = password;
    }
}