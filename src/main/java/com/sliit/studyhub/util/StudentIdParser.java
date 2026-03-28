package com.sliit.studyhub.util;

import org.springframework.stereotype.Component;
import java.time.Year;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class StudentIdParser {

    // Legacy format: ST/2022/1234
    private static final Pattern LEGACY_PATTERN = Pattern.compile("^([A-Z]{2,3})/(\\d{4})/(\\d+)$");
    // New format: IT23561298
    private static final Pattern NEW_PATTERN = Pattern.compile("^(IT|EN|BS)(\\d{2})(\\d{6})$");

    public ParsedStudentId parse(String studentId) {
        if (studentId == null || studentId.isBlank()) {
            throw new IllegalArgumentException("Student ID must not be blank");
        }
        
        String cleanId = studentId.trim().toUpperCase();

        Matcher legacyMatcher = LEGACY_PATTERN.matcher(cleanId);
        if (legacyMatcher.matches()) {
            String prefix = legacyMatcher.group(1);
            int intakeYear = Integer.parseInt(legacyMatcher.group(2));
            String number = legacyMatcher.group(3);
            validateYear(intakeYear);
            return new ParsedStudentId(mapProgramCode(prefix), intakeYear, calculateCurrentYear(intakeYear), number);
        }

        Matcher newMatcher = NEW_PATTERN.matcher(cleanId);
        if (newMatcher.matches()) {
            String prefix = newMatcher.group(1);
            int intakeYear = 2000 + Integer.parseInt(newMatcher.group(2));
            String number = newMatcher.group(3);
            validateYear(intakeYear);
            return new ParsedStudentId(mapProgramCode(prefix), intakeYear, calculateCurrentYear(intakeYear), number);
        }

        throw new IllegalArgumentException(
            "Invalid student ID format. Expected PREFIX/YYYY/NNNN (e.g. ST/2022/1234) or IT23561298"
        );
    }
    
    private void validateYear(int intakeYear) {
        int currentCalYear = Year.now().getValue();
        if (intakeYear < 2000 || intakeYear > currentCalYear + 1) {
            throw new IllegalArgumentException("Intake year " + intakeYear + " is out of valid range");
        }
    }

    private String mapProgramCode(String code) {
        return switch (code) {
            case "ST", "IT", "SE", "CS", "DS" -> "IT";
            case "EN", "ENG", "CE", "EE", "ME" -> "ENG";
            case "BS", "BA", "FM", "HRM" -> "BS";
            default -> code; // Fallback to raw code
        };
    }

    private int calculateCurrentYear(int intakeYear) {
        int diff = Year.now().getValue() - intakeYear;
        if (diff <= 0) return 1;
        if (diff >= 4) return 4;
        return diff + 1;
    }

    // -----------------------------------------------------------------------
    public static class ParsedStudentId {
        public final String program;
        public final int    intakeYear;
        public final int    currentYear;
        public final String number;

        public ParsedStudentId(String program, int intakeYear, int currentYear, String number) {
            this.program     = program;
            this.intakeYear  = intakeYear;
            this.currentYear = currentYear;
            this.number      = number;
        }
    }
}