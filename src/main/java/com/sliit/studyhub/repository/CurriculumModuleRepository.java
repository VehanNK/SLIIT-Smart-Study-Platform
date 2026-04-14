package com.sliit.studyhub.repository;

import com.sliit.studyhub.model.CurriculumModule;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CurriculumModuleRepository extends MongoRepository<CurriculumModule, String> {
    
    /**
     * Find all modules for a given program, year, and semester.
     */
    List<CurriculumModule> findByProgramAndYearAndSemester(String program, int year, int semester);
    
    /**
     * Find a specific module by program, year, semester, and code.
     */
    Optional<CurriculumModule> findByProgramAndYearAndSemesterAndModuleCode(
            String program, int year, int semester, String moduleCode);
    
    /**
     * Find all unique programs in the curriculum.
     */
    @Query(value = "{}", fields = "{'program': 1}")
    List<CurriculumModule> findDistinctPrograms();
    
    /**
     * Find all modules for a given program.
     */
    List<CurriculumModule> findByProgram(String program);
}
