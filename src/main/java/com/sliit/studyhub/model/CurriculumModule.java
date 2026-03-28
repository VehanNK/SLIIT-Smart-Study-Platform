package com.sliit.studyhub.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

/**
 * Curriculum module model.
 * Stores the official curriculum structure: which modules are offered
 * for each program, year, and semester combination.
 */
@Document(collection = "curriculum_modules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@CompoundIndexes({
    @CompoundIndex(name = "program_year_semester_idx", def = "{'program': 1, 'year': 1, 'semester': 1}"),
    @CompoundIndex(name = "program_year_semester_code_idx", def = "{'program': 1, 'year': 1, 'semester': 1, 'moduleCode': 1}")
})
public class CurriculumModule {
    @Id
    private String id;
    
    private String program;      // IT, CS, DS, SE, ISM, CSNE
    private int year;            // 1, 2, 3, 4
    private int semester;        // 1, 2
    private String moduleCode;   // IT1050, IT2060, CS1010, etc.
    private String moduleName;   // Mathematics, Database Systems, etc.
    private String description;  // Optional description
    private boolean isCore;      // true if mandatory, false if elective
    private String credits;      // e.g., "3" or "4"
    
    private long createdAt;      // Timestamp when module was added
    private long updatedAt;      // Timestamp when module was last updated
}
