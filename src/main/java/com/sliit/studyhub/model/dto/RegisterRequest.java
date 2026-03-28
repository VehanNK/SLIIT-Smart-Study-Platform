package com.sliit.studyhub.model.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;            // Full name
    private String studentId;       // e.g. IT23561298, EN23561298, BS23561298
    private String password;
    private String email;           // auto-generated on frontend, confirmed here
    private String faculty;         // "COMPUTING", "ENGINEERING", "BUSINESS"
    private String program;         // IT, SE, CS, DS, ISE, CSNE, CE, EE, ME, BA, FM, HRM
    private int academicYear;       // 1, 2, 3, 4 (student's actual year)
    private int semester;           // 1 or 2
    private String studyStyle;      // visual, auditory, kinesthetic
}
