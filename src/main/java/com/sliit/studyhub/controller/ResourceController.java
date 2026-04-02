package com.sliit.studyhub.controller;

import com.sliit.studyhub.model.Resource;
import com.sliit.studyhub.model.dto.ResourceSearchRequest;
import com.sliit.studyhub.repository.ResourceRepository;
import com.sliit.studyhub.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {
    private final ResourceService resourceService;
    private final ResourceRepository resourceRepository;

    private final com.sliit.studyhub.service.CloudinaryService cloudinaryService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<Resource> uploadResource(
            @RequestPart("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("moduleCode") String moduleCode,
            @RequestParam("resourceType") String resourceType,
            @AuthenticationPrincipal UserDetails user) throws java.io.IOException {
        
        // 1. Upload file stream to Cloudinary
        String fileUrl = cloudinaryService.uploadFile(file);

        // 2. Build the Resource object
        Resource resource = new Resource();
        resource.setTitle(title);
        resource.setDescription(description);
        resource.setModuleCode(moduleCode);
        resource.setResourceType(resourceType);
        resource.setFileUrl(fileUrl);
        
        return ResponseEntity.ok(resourceService.uploadResource(resource, user.getUsername()));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Resource>> search(
            @RequestParam(required = false) String moduleCode,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String program,
            @RequestParam(required = false) Integer uploaderIntake,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) Double minRating,
            @RequestParam(defaultValue = "default") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails user) {
            
        ResourceSearchRequest req = new ResourceSearchRequest();
        req.setModuleCode(moduleCode);
        req.setYear(year);
        req.setSemester(semester);
        req.setProgram(program);
        req.setUploaderIntake(uploaderIntake);
        req.setResourceType(resourceType);
        req.setMinRating(minRating);
        req.setSortBy(sortBy);
        req.setPage(page);
        req.setSize(size);
        if (user != null) {
            req.setSearcherId(user.getUsername());
        }
        
        return ResponseEntity.ok(resourceService.searchResources(req));
    }

    @PostMapping("/{resourceId}/review")
    public ResponseEntity<Resource> addReview(
            @PathVariable String resourceId,
            @RequestParam int rating,
            @RequestParam String comment,
            @RequestParam(defaultValue = "false") boolean isAnonymous,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(resourceService.addReview(resourceId, user.getUsername(), rating, comment, isAnonymous));
    }

    @GetMapping("/{resourceId}/reviews")
    public ResponseEntity<java.util.List<com.sliit.studyhub.model.Review>> getReviews(@PathVariable String resourceId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
        // Sort reviews by date (newest first)
        return ResponseEntity.ok(resource.getReviews().stream()
                .sorted((r1, r2) -> {
                    try {
                        java.time.LocalDate d1 = java.time.LocalDate.parse(r1.getDate());
                        java.time.LocalDate d2 = java.time.LocalDate.parse(r2.getDate());
                        return d2.compareTo(d1); // Newest first
                    } catch (Exception e) {
                        return 0;
                    }
                })
                .map(r -> {
            com.sliit.studyhub.model.Review clone = new com.sliit.studyhub.model.Review();
            clone.setRating(r.getRating());
            clone.setComment(r.getComment());
            clone.setDate(r.getDate());
            clone.setAnonymous(r.isAnonymous());
            clone.setStudentId(r.isAnonymous() ? "Anonymous" : r.getStudentId());
            return clone;
        }).toList());
    }

    /**
     * Task 5: Increment download counter and return download URL.
     * Call this whenever a user clicks the download link.
     */
    @PostMapping("/{resourceId}/download")
    public ResponseEntity<Map<String, String>> incrementDownload(@PathVariable String resourceId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource not found: " + resourceId));
        resource.setDownloads(resource.getDownloads() + 1);
        resourceRepository.save(resource);
        
        // Return the file URL so frontend can fetch and download it
        return ResponseEntity.ok(Map.of("fileUrl", resource.getFileUrl()));
    }
}
