package com.sliit.studyhub.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data transfer object for curriculum modules.
 * Represents a module offered in a specific program, year, and semester.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurriculumModuleDTO {
    private String id;
    private String program;      // IT, CS, DS, SE, etc.
    private int year;            // 1, 2, 3, 4
    private int semester;        // 1, 2
    private String moduleCode;   // IT1050, IT2060, etc.
    private String moduleName;   // Mathematics, Database Systems, etc.
    private String description;  // Optional: brief module description
    private boolean isCore;      // true if mandatory, false if elective
    private String credits;      // e.g., "3", "4"
}
