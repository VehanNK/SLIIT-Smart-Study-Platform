package com.sliit.studyhub.model.dto;

import com.sliit.studyhub.model.Student;
import lombok.Data;

import java.util.List;

/**
 * Task 6 — Safe public view of a Student.
 * NEVER return Student directly in API responses that go to other students.
 * Password, internal ID, and other sensitive fields are omitted.
 */
@Data
public class StudentResponse {
    private String studentId;
    private String program;
    private int    intakeYear;
    private int    currentYear;
    private int    currentSemester;
    private String email;
    private String studyStyle;
    private String profilePicture;
    private List<String> currentModules;
    private java.util.Map<String, Integer> moduleConfidence;
    private int matchScore;

    public static StudentResponse from(Student s) {
        StudentResponse r = new StudentResponse();
        r.setStudentId(s.getStudentId());
        r.setProgram(s.getProgram());
        r.setIntakeYear(s.getIntakeYear());
        r.setCurrentYear(s.getCurrentYear());
        r.setCurrentSemester(s.getCurrentSemester());
        r.setEmail(s.getEmail());
        r.setStudyStyle(s.getStudyStyle());
        r.setProfilePicture(s.getProfilePicture());
        r.setCurrentModules(s.getCurrentModules());
        r.setModuleConfidence(s.getModuleConfidence());
        return r;
    }
}
