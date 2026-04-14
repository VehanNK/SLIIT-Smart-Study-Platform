package com.sliit.studyhub.controller;

import com.sliit.studyhub.model.dto.CurriculumModuleDTO;
import com.sliit.studyhub.service.CurriculumService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin endpoints for managing curriculum modules.
 * These are used by administrators to define which modules are available
 * for each program, year, and semester combination.
 */
@RestController
@RequestMapping("/api/admin/curriculum")
@RequiredArgsConstructor
public class AdminCurriculumController {

    private final CurriculumService curriculumService;

    /**
     * GET /api/admin/curriculum/modules?program=IT&year=2&semester=1
     * List all modules for a given program, year, and semester.
     */
    @GetMapping("/modules")
    public ResponseEntity<List<CurriculumModuleDTO>> listModules(
            @RequestParam String program,
            @RequestParam int year,
            @RequestParam int semester) {
        List<CurriculumModuleDTO> modules = curriculumService.listModules(program, year, semester);
        return ResponseEntity.ok(modules);
    }

    /**
     * POST /api/admin/curriculum/modules
     * Create a new module for a curriculum.
     */
    @PostMapping("/modules")
    public ResponseEntity<CurriculumModuleDTO> createModule(@RequestBody CurriculumModuleDTO dto) {
        CurriculumModuleDTO created = curriculumService.createModule(dto);
        return ResponseEntity.ok(created);
    }

    /**
     * PUT /api/admin/curriculum/modules/{id}
     * Update an existing curriculum module.
     */
    @PutMapping("/modules/{id}")
    public ResponseEntity<CurriculumModuleDTO> updateModule(
            @PathVariable String id,
            @RequestBody CurriculumModuleDTO dto) {
        CurriculumModuleDTO updated = curriculumService.updateModule(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/admin/curriculum/modules/{id}
     * Delete a curriculum module.
     */
    @DeleteMapping("/modules/{id}")
    public ResponseEntity<Void> deleteModule(@PathVariable String id) {
        curriculumService.deleteModule(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/admin/curriculum/programs
     * List all available programs in the system.
     */
    @GetMapping("/programs")
    public ResponseEntity<List<String>> listPrograms() {
        List<String> programs = curriculumService.listPrograms();
        return ResponseEntity.ok(programs);
    }
}
