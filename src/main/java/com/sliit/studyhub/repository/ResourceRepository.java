package com.sliit.studyhub.repository;

import com.sliit.studyhub.model.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface ResourceRepository extends MongoRepository<Resource, String> {

    // Basic module/year/semester search
    List<Resource> findByModuleCodeAndYearAndSemester(String moduleCode, int year, int semester);
    Page<Resource> findByModuleCodeAndYearAndSemester(String moduleCode, int year, int semester, Pageable pageable);

    // Program-based search
    List<Resource> findByUploaderProgram(String program);
    Page<Resource> findByUploaderProgram(String program, Pageable pageable);

    // Dynamic Search for Frontend
    @Query("{ 'moduleCode': { $regex: ?0, $options: 'i' }, 'uploaderProgram': { $regex: ?1, $options: 'i' } }")
    Page<Resource> searchByModuleAndProgram(String moduleCode, String program, Pageable pageable);

    // Task 2: filter by minimum average rating
    @Query("{ 'avgRating': { $gte: ?0 } }")
    Page<Resource> findByAvgRatingGreaterThanEqual(double minRating, Pageable pageable);

    // Combined: module+year+semester+minRating
    @Query("{ 'moduleCode': ?0, 'year': ?1, 'semester': ?2, 'avgRating': { $gte: ?3 } }")
    Page<Resource> findByModuleYearSemesterAndMinRating(
            String moduleCode, int year, int semester, double minRating, Pageable pageable);

    // Paginated full list (for browse-all)
    Page<Resource> findAll(Pageable pageable);

    // Resource type filter
    Page<Resource> findByResourceType(String resourceType, Pageable pageable);

    // Smart Recommendation (Top 10 highest-rated resources matching user's current modules and program)
    List<Resource> findTop10ByModuleCodeInAndUploaderProgramOrderByAvgRatingDesc(
            List<String> moduleCodes, String program);

    // Deprecated legacy — kept for backward compat
    List<Resource> findByUploaderProgramAndUploaderIntake(String program, int intake);
}