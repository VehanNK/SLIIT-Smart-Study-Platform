package com.sliit.studyhub.repository;

import com.sliit.studyhub.model.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends MongoRepository<Student, String> {
    Optional<Student> findByStudentId(String studentId);
    boolean existsByStudentId(String studentId);
    boolean existsByEmail(String email);

    // Task 7 (Stage 1): targeted queries for matching
    List<Student> findByProgramAndIntakeYear(String program, int intakeYear);
    List<Student> findByIntakeYearLessThan(int intakeYear);

    // Task 8: pagination support
    Page<Student> findByProgramAndIntakeYear(String program, int intakeYear, Pageable pageable);
}
