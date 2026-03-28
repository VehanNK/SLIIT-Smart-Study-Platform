package com.sliit.studyhub.service;

import com.sliit.studyhub.model.CurriculumModule;
import com.sliit.studyhub.model.dto.CurriculumModuleDTO;
import com.sliit.studyhub.repository.CurriculumModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CurriculumService {

    private final CurriculumModuleRepository curriculumRepository;

    // Fallback hardcoded curriculum for backward compatibility
    private static final Map<String, Map<Integer, Map<Integer, List<String>>>> CURRICULUM = Map.of(
            "IT", Map.of(
                    1, Map.of(
                            1, List.of("IT1010", "IT1020", "IT1030", "IT1040"),
                            2, List.of("IT1050", "IT1060", "IT1080", "IT1090")
                    ),
                    2, Map.of(
                            1, List.of("IT2010", "IT2020", "IT2030", "IT2040"),
                            2, List.of("IT2050", "IT2060", "IT2080", "IT2090")
                    ),
                    3, Map.of(
                            1, List.of("IT3010", "IT3020", "IT3030"),
                            2, List.of("IT3040", "IT3050", "IT3060")
                    ),
                    4, Map.of(
                            1, List.of("IT4010", "IT4020"),
                            2, List.of("IT4010", "IT4020")
                    )
            ),
            "SE", Map.of(
                    1, Map.of(
                            1, List.of("SE1010", "SE1020"),
                            2, List.of("SE1010", "SE1020")
                    ),
                    2, Map.of(
                            1, List.of("SE2010", "SE2020"),
                            2, List.of("SE2010", "SE2020")
                    )
            )
    );

    /**
     * Get modules for a student (backward compatible).
     * Tries database first, falls back to hardcoded curriculum.
     */
    public List<String> getModules(String program, int year, int semester) {
        if (program == null || program.isBlank()) {
            return List.of();
        }

        // Try to get from database first
        List<CurriculumModule> dbModules = curriculumRepository.findByProgramAndYearAndSemester(program.toUpperCase(), year, semester);
        if (!dbModules.isEmpty()) {
            return dbModules.stream()
                    .map(CurriculumModule::getModuleCode)
                    .collect(Collectors.toList());
        }

        // Fall back to hardcoded curriculum
        Map<Integer, Map<Integer, List<String>>> byYear = CURRICULUM.get(program.toUpperCase());
        if (byYear == null) {
            return List.of();
        }

        Map<Integer, List<String>> bySemester = byYear.get(year);
        if (bySemester == null) {
            return List.of();
        }

        return bySemester.getOrDefault(semester, List.of());
    }

    /**
     * List all modules for a given program, year, and semester (admin).
     */
    public List<CurriculumModuleDTO> listModules(String program, int year, int semester) {
        List<CurriculumModule> modules = curriculumRepository.findByProgramAndYearAndSemester(program, year, semester);
        return modules.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Create a new curriculum module (admin).
     */
    public CurriculumModuleDTO createModule(CurriculumModuleDTO dto) {
        if (dto.getProgram() == null || dto.getProgram().isBlank()) {
            throw new IllegalArgumentException("Program is required");
        }
        if (dto.getYear() < 1 || dto.getYear() > 4) {
            throw new IllegalArgumentException("Year must be between 1 and 4");
        }
        if (dto.getSemester() < 1 || dto.getSemester() > 2) {
            throw new IllegalArgumentException("Semester must be 1 or 2");
        }
        if (dto.getModuleCode() == null || dto.getModuleCode().isBlank()) {
            throw new IllegalArgumentException("Module code is required");
        }

        // Check for duplicate
        var existing = curriculumRepository.findByProgramAndYearAndSemesterAndModuleCode(
                dto.getProgram(), dto.getYear(), dto.getSemester(), dto.getModuleCode());
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Module already exists for this program, year, and semester");
        }

        CurriculumModule module = CurriculumModule.builder()
                .program(dto.getProgram().trim().toUpperCase())
                .year(dto.getYear())
                .semester(dto.getSemester())
                .moduleCode(dto.getModuleCode().trim().toUpperCase())
                .moduleName(dto.getModuleName() != null ? dto.getModuleName().trim() : "")
                .description(dto.getDescription() != null ? dto.getDescription().trim() : "")
                .isCore(dto.isCore())
                .credits(dto.getCredits() != null ? dto.getCredits().trim() : "3")
                .createdAt(System.currentTimeMillis())
                .updatedAt(System.currentTimeMillis())
                .build();

        CurriculumModule saved = curriculumRepository.save(module);
        return toDTO(saved);
    }

    /**
     * Update an existing curriculum module (admin).
     */
    public CurriculumModuleDTO updateModule(String id, CurriculumModuleDTO dto) {
        CurriculumModule module = curriculumRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Curriculum module not found: " + id));

        if (dto.getModuleName() != null && !dto.getModuleName().isBlank()) {
            module.setModuleName(dto.getModuleName().trim());
        }
        if (dto.getDescription() != null) {
            module.setDescription(dto.getDescription().trim());
        }
        if (dto.getCredits() != null && !dto.getCredits().isBlank()) {
            module.setCredits(dto.getCredits().trim());
        }
        module.setCore(dto.isCore());
        module.setUpdatedAt(System.currentTimeMillis());

        CurriculumModule saved = curriculumRepository.save(module);
        return toDTO(saved);
    }

    /**
     * Delete a curriculum module (admin).
     */
    public void deleteModule(String id) {
        if (!curriculumRepository.existsById(id)) {
            throw new RuntimeException("Curriculum module not found: " + id);
        }
        curriculumRepository.deleteById(id);
    }

    /**
     * List all unique programs in the curriculum (admin).
     */
    public List<String> listPrograms() {
        return curriculumRepository.findAll().stream()
                .map(CurriculumModule::getProgram)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    /**
     * Convert CurriculumModule entity to DTO.
     */
    private CurriculumModuleDTO toDTO(CurriculumModule module) {
        return CurriculumModuleDTO.builder()
                .id(module.getId())
                .program(module.getProgram())
                .year(module.getYear())
                .semester(module.getSemester())
                .moduleCode(module.getModuleCode())
                .moduleName(module.getModuleName())
                .description(module.getDescription())
                .isCore(module.isCore())
                .credits(module.getCredits())
                .build();
    }
}