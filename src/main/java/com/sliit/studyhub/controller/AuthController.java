package com.sliit.studyhub.controller;

import com.sliit.studyhub.model.Student;
import com.sliit.studyhub.model.dto.RegisterRequest;
import com.sliit.studyhub.security.JwtUtil;
import com.sliit.studyhub.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final StudentService studentService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> request) {
        String studentId = request.get("studentId");
        String password  = request.get("password");
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(studentId, password)
        );
        String token = jwtUtil.generateToken(studentId);
        return ResponseEntity.ok(Map.of("token", token, "studentId", studentId));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody RegisterRequest request) {
        Student saved = studentService.register(request);
        return ResponseEntity.ok(Map.of(
                "message", "Student registered successfully",
                "studentId", saved.getStudentId(),
                "program", saved.getProgram(),
                "currentYear", String.valueOf(saved.getCurrentYear())
        ));
    }

    /** Returns the profile of the currently authenticated student. */
    @GetMapping("/me")
    public ResponseEntity<Student> me(@AuthenticationPrincipal UserDetails user) {
        Student student = studentService.findByStudentId(user.getUsername());
        student.setPassword(null); // never expose hashed password
        return ResponseEntity.ok(student);
    }

    @PutMapping("/me/confidence")
    public ResponseEntity<Student> updateConfidence(@RequestBody Map<String, Integer> conf, @AuthenticationPrincipal UserDetails user) {
        Student student = studentService.updateModuleConfidence(user.getUsername(), conf);
        student.setPassword(null);
        return ResponseEntity.ok(student);
    }

    @PutMapping("/me/preferences")
    public ResponseEntity<Student> updatePreferences(@RequestBody Map<String, Object> prefs, @AuthenticationPrincipal UserDetails user) {
        Student student = studentService.updatePreferences(user.getUsername(), prefs);
        student.setPassword(null);
        return ResponseEntity.ok(student);
    }
}
