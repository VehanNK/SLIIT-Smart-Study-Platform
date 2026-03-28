package com.sliit.studyhub.service;

import com.sliit.studyhub.model.Student;
import com.sliit.studyhub.model.dto.RegisterRequest;
import com.sliit.studyhub.repository.StudentRepository;
import com.sliit.studyhub.util.StudentIdParser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentService {
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentIdParser idParser;
    private final CurriculumService curriculumService;

    /**
     * Full registration — uses explicitly provided faculty, program, year, semester from the form.
     * New Student ID format: IT23561298 / EN23561298 / BS23561298
     */
    public Student register(RegisterRequest request) {
        String studentId = request.getStudentId().trim().toUpperCase();

        if (studentRepository.existsByStudentId(studentId)) {
            throw new RuntimeException("A student with ID '" + studentId + "' is already registered");
        }

        // Validate ID prefix matches faculty
        String prefix = studentId.length() >= 2 ? studentId.substring(0, 2) : "";
        String faculty = request.getFaculty() != null ? request.getFaculty().toUpperCase() : "";
        boolean prefixValid = switch (faculty) {
            case "COMPUTING"    -> prefix.equals("IT");
            case "ENGINEERING"  -> prefix.equals("EN");
            case "BUSINESS"     -> prefix.equals("BS");
            default             -> false;
        };
        if (!prefixValid) {
            throw new RuntimeException("Student ID prefix '" + prefix + "' does not match the selected faculty");
        }

        // Validate format: prefix (2 chars) + 8 digits
        if (!studentId.matches("^(IT|EN|BS)\\d{8}$")) {
            throw new RuntimeException("Invalid Student ID format. Expected e.g. IT23561298");
        }

        // Auto-generate email from student ID: IT23561298 -> it23561298@my.sliit.lk
        String email = studentId.toLowerCase() + "@my.sliit.lk";

        // Task 1 check: prevent duplicate emails
        if (studentRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already in use");
        }

        // Derive intakeYear from digits 2-3 of ID (e.g. IT23561298 → "23" → 2023)
        int intakeYear = 2000 + Integer.parseInt(studentId.substring(2, 4));

        int year = request.getAcademicYear() > 0 ? request.getAcademicYear() : 1;
        int semester = request.getSemester() > 0 ? request.getSemester() : 1;
        String program = request.getProgram() != null && !request.getProgram().isBlank()
                ? request.getProgram().trim().toUpperCase() : prefix;

        Student student = new Student(studentId, program, intakeYear, year, email, passwordEncoder.encode(request.getPassword()));
        student.setName(request.getName() != null ? request.getName().trim() : null);
        student.setFaculty(faculty);
        student.setCurrentSemester(semester);

        if (request.getStudyStyle() != null && !request.getStudyStyle().isBlank()) {
            student.setStudyStyle(request.getStudyStyle().trim());
        }

        // Eagerly assign curriculum modules using year + semester
        List<String> modules = deriveModules(program, year, semester);
        student.setCurrentModules(modules);

        return studentRepository.save(student);
    }

    /** Legacy convenience overload used internally (e.g. tests). */
    public Student register(String studentId, String password) {
        RegisterRequest req = new RegisterRequest();
        req.setStudentId(studentId);
        req.setPassword(password);
        return register(req);
    }

    public Student findByStudentId(String studentId) {
        Student student = studentRepository.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        // Lazy Migration: Auto-populate semester and modules if missing
        if (student.getCurrentModules() == null || student.getCurrentModules().isEmpty()) {
            int semester = deriveSemester();
            student.setCurrentSemester(semester);

            List<String> modules = deriveModules(
                    student.getProgram(),
                    student.getCurrentYear(),
                    semester
            );

            student.setCurrentModules(modules);
            studentRepository.save(student);
        }

        return student;
    }

    public int deriveSemester() {
        int month = java.time.LocalDate.now().getMonthValue();
        // Feb–July → Semester 1
        if (month >= 2 && month <= 7) {
            return 1;
        }
        // Aug–Jan → Semester 2
        return 2;
    }

    public java.util.List<String> deriveModules(String program, int year, int semester) {
        java.util.List<String> modules = curriculumService.getModules(program, year, semester);
        if (!modules.isEmpty()) {
            return modules;
        }

        // Default generic assignment if no specific curriculum match exists.
        return java.util.List.of(program.toUpperCase() + year + "0" + semester + "0");
    }

    public Student updateStudyStyle(String studentId, String studyStyle) {
        Student student = findByStudentId(studentId);
        student.setStudyStyle(studyStyle);
        return studentRepository.save(student);
    }

    public Student updateModuleConfidence(String studentId, java.util.Map<String, Integer> conf) {
        Student student = findByStudentId(studentId);
        student.setModuleConfidence(conf);
        return studentRepository.save(student);
    }

    public Student updatePreferences(String studentId, java.util.Map<String, Object> prefs) {
        Student student = findByStudentId(studentId);
        if (prefs.containsKey("reminderEnabled")) {
            student.setReminderEnabled((Boolean) prefs.get("reminderEnabled"));
        }
        return studentRepository.save(student);
    }
}
