package com.sliit.studyhub.service;

import com.sliit.studyhub.model.Resource;
import com.sliit.studyhub.model.Review;
import com.sliit.studyhub.model.dto.ResourceSearchRequest;
import com.sliit.studyhub.repository.ResourceRepository;
import com.sliit.studyhub.util.StudentIdParser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceService {
    private final ResourceRepository resourceRepository;
    private final StudentIdParser idParser;
    private final StudentService studentService;
    private final RankingService rankingService;
    private final org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;

    // -----------------------------------------------------------------------
    // Upload
    // -----------------------------------------------------------------------

    public Resource uploadResource(Resource resource, String uploaderStudentId) {
        var parsed = idParser.parse(uploaderStudentId);
        var student = studentService.findByStudentId(uploaderStudentId);
        resource.setUploadedBy(uploaderStudentId);
        resource.setUploaderIntake(parsed.intakeYear);
        resource.setUploaderProgram(parsed.program);
        resource.setUploaderYear(student.getCurrentYear());
        resource.setUploaderSemester(student.getCurrentSemester());
        resource.setUploadedAt(java.time.LocalDateTime.now());

        // Keep syllabus fields populated even when frontend does not send them explicitly.
        if (resource.getYear() <= 0) {
            resource.setYear(student.getCurrentYear());
        }
        if (resource.getSemester() <= 0) {
            resource.setSemester(student.getCurrentSemester());
        }

        if (resource.getModuleCode() != null) {
            resource.setModuleCode(resource.getModuleCode().trim().toUpperCase());
        }
        if (resource.getReviews() == null) resource.setReviews(new java.util.ArrayList<>());
        return resourceRepository.save(resource);
    }

    // -----------------------------------------------------------------------
    // Task 2 — Advanced search with filters, sorting & pagination
    // -----------------------------------------------------------------------

    public Page<Resource> searchResources(ResourceSearchRequest req) {
        Sort sort = buildSort(req.getSortBy());
        Pageable pageable = PageRequest.of(
                Math.max(0, req.getPage()),
                Math.min(50, req.getSize() > 0 ? req.getSize() : 10),
                sort
        );

        org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();

        if (req.getModuleCode() != null && !req.getModuleCode().trim().isEmpty()) {
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("moduleCode").is(req.getModuleCode().trim()));
        }
        if (req.getProgram() != null && !req.getProgram().trim().isEmpty()) {
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("uploaderProgram").is(req.getProgram().trim()));
        }
        if (req.getUploaderIntake() != null) {
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("uploaderIntake").is(req.getUploaderIntake()));
        }
        if (req.getYear() != null) {
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("year").is(req.getYear()));
        }
        if (req.getSemester() != null) {
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("semester").is(req.getSemester()));
        }
        if (req.getResourceType() != null && !req.getResourceType().trim().isEmpty()) {
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("resourceType").is(req.getResourceType().trim()));
        }
        if (req.getMinRating() != null) {
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("avgRating").gte(req.getMinRating()));
        }

        long total = mongoTemplate.count(query, Resource.class);
        
        List<Resource> list;
        String sortBy = req.getSortBy() == null ? "default" : req.getSortBy().trim().toLowerCase();
        if ("default".equals(sortBy) || "avgrating".equals(sortBy) || "rating".equals(sortBy)) {
            // Memory sort using RankingService for complex personalized ranking
            List<Resource> allMatching = mongoTemplate.find(query, Resource.class);
            allMatching.sort((r1, r2) -> rankingService.compareByScore(r1, r2, req.getSearcherId()));
            
            // Paginate in memory
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), allMatching.size());
            if (start <= end) {
                list = allMatching.subList(start, end);
            } else {
                list = new java.util.ArrayList<>();
            }
        } else {
            query.with(pageable);
            list = mongoTemplate.find(query, Resource.class);
        }

        return new org.springframework.data.domain.PageImpl<>(list, pageable, total);
    }

    // -----------------------------------------------------------------------
    // Task 3: Smart Resource Recommendation
    // -----------------------------------------------------------------------
    public List<Resource> getRecommendedResources(com.sliit.studyhub.model.Student student) {
        List<Resource> result = null;
        if (student.getCurrentModules() != null && !student.getCurrentModules().isEmpty()) {
            result = resourceRepository.findTop10ByModuleCodeInAndUploaderProgramOrderByAvgRatingDesc(
                    student.getCurrentModules(),
                    student.getProgram()
            );
        }
        if (result == null || result.isEmpty()) {
            Page<Resource> top = resourceRepository.findAll(PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "avgRating")));
            return top.getContent();
        }
        return result;
    }

    /** Legacy overload — kept for backward compatibility with old controller signature. */
    public List<Resource> searchResources(String moduleCode, Integer year, Integer semester, String program) {
        if (moduleCode != null && year != null && semester != null) {
            return resourceRepository.findByModuleCodeAndYearAndSemester(moduleCode, year, semester);
        }
        if (program != null && !program.isBlank()) {
            return resourceRepository.findByUploaderProgram(program);
        }
        return resourceRepository.findAll();
    }

    private Sort buildSort(String sortBy) {
        if (sortBy == null) return Sort.by(Sort.Direction.DESC, "avgRating");
        return switch (sortBy.toLowerCase()) {
            case "rating", "avgrating" -> Sort.by(Sort.Direction.DESC, "avgRating");
            case "downloads", "popularity" -> Sort.by(Sort.Direction.DESC, "downloads");
            case "newest"    -> Sort.by(Sort.Direction.DESC, "uploadedAt");
            default          -> Sort.by(Sort.Direction.DESC, "avgRating");
        };
    }

    // -----------------------------------------------------------------------
    // Task 3 — Review system: prevent duplicate reviews per student
    // -----------------------------------------------------------------------

    public Resource addReview(String resourceId, String studentId, int rating, String comment, boolean isAnonymous) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource not found: " + resourceId));

        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        // Prevent uploader from reviewing their own resource
        if (resource.getUploadedBy() != null && resource.getUploadedBy().equals(studentId)) {
            throw new RuntimeException("You cannot review your own resource");
        }

        // Task 3: prevent duplicate reviews
        boolean alreadyReviewed = resource.getReviews().stream()
                .anyMatch(r -> r.getStudentId().equals(studentId));
        if (alreadyReviewed) {
            throw new RuntimeException("You have already reviewed this resource");
        }

        Review review = new Review();
        review.setStudentId(studentId);
        review.setRating(rating);
        review.setComment(comment != null ? comment.trim() : "");
        review.setDate(LocalDate.now().toString());
        review.setAnonymous(isAnonymous);
        resource.getReviews().add(review);

        // Recalculate average rating
        double avg = resource.getReviews().stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
        resource.setAvgRating(Math.round(avg * 10.0) / 10.0); // 1 decimal place

        return resourceRepository.save(resource);
    }
}
