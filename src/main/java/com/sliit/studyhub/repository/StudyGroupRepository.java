package com.sliit.studyhub.repository;

import com.sliit.studyhub.model.StudyGroup;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface StudyGroupRepository extends MongoRepository<StudyGroup, String> {
    List<StudyGroup> findByModuleCodeAndYearAndSemester(String moduleCode, int year, int semester);
    List<StudyGroup> findByMembersContaining(String studentId);
    // Task 4: proper suggestions query
    List<StudyGroup> findByTargetProgramAndYear(String targetProgram, int year);
    List<StudyGroup> findByTargetProgramInAndYear(List<String> targetPrograms, int year);
}