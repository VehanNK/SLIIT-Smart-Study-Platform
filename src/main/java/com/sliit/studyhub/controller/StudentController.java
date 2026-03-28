package com.sliit.studyhub.controller;

import com.sliit.studyhub.model.Student;
import com.sliit.studyhub.model.dto.StudentResponse;
import com.sliit.studyhub.model.dto.UpdateProfileRequest;
import com.sliit.studyhub.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class StudentController {

    private final StudentRepository studentRepository;
    private final com.sliit.studyhub.service.StudentService studentService;

    /**
     * Task 1 — Update the current student's editable profile fields.
     * PUT /api/students/profile
     */
    @PutMapping("/profile")
    public ResponseEntity<StudentResponse> updateProfile(
            @RequestBody UpdateProfileRequest req,
            @AuthenticationPrincipal UserDetails user) {

        Student student = studentRepository.findByStudentId(user.getUsername())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Only update fields that were actually provided
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            student.setEmail(req.getEmail().trim());
        }
        if (req.getStudyStyle() != null && !req.getStudyStyle().isBlank()) {
            String style = req.getStudyStyle().trim().toLowerCase();
            if (!style.equals("visual") && !style.equals("auditory") && !style.equals("kinesthetic")) {
                throw new IllegalArgumentException(
                    "studyStyle must be one of: visual, auditory, kinesthetic"
                );
            }
            student.setStudyStyle(style);
        }
        if (req.getProfilePicture() != null && !req.getProfilePicture().isBlank()) {
            student.setProfilePicture(req.getProfilePicture().trim());
        }

        studentRepository.save(student);
        return ResponseEntity.ok(StudentResponse.from(student));
    }

    /**
     * GET /api/students/{studentId} — public profile lookup (safe DTO).
     */
    @GetMapping("/{studentId}")
    public ResponseEntity<StudentResponse> getProfile(@PathVariable String studentId) {
        Student student = studentRepository.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        return ResponseEntity.ok(StudentResponse.from(student));
    }

    @GetMapping("/curriculum/modules")
    public ResponseEntity<java.util.List<String>> getCurriculumModules(
            @RequestParam String program,
            @RequestParam int year,
            @RequestParam int semester) {
        // Use StudentService derive fallback so module options are never empty for valid context.
        return ResponseEntity.ok(studentService.deriveModules(program, year, semester));
    }
}
