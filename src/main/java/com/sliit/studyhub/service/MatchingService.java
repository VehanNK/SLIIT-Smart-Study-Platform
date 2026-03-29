package com.sliit.studyhub.service;

import com.sliit.studyhub.model.dto.StudentResponse;
import com.sliit.studyhub.repository.StudentRepository;
import com.sliit.studyhub.util.StudentIdParser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

import com.sliit.studyhub.model.Student;
import com.sliit.studyhub.model.dto.GroupCreationSuggestion;

import java.util.Collections;
import java.util.Comparator;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchingService {
    private final StudentRepository studentRepository;
    private final StudentIdParser idParser;

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;
    public Page<com.sliit.studyhub.model.dto.MatchResultDTO> getPeerMatches(String studentId, Pageable pageable) {
        Student current = studentRepository.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        // Get candidates in same program + intake
        List<Student> candidates = studentRepository.findByProgramAndIntakeYear(current.getProgram(), current.getIntakeYear());

        // Score, sort, and convert
        List<com.sliit.studyhub.model.dto.MatchResultDTO> responses = candidates.stream()
                .filter(s -> !s.getStudentId().equals(studentId))
                .sorted((s1, s2) -> Integer.compare(calculatePeerScore(s2, current), calculatePeerScore(s1, current)))
                .map(s -> {
                    com.sliit.studyhub.model.dto.MatchResultDTO r = new com.sliit.studyhub.model.dto.MatchResultDTO();
                    r.setStudentId(s.getStudentId());
                    r.setProgram(s.getProgram());
                    r.setIntakeYear(s.getIntakeYear());
                    r.setCurrentYear(s.getCurrentYear());
                    r.setStudyStyle(s.getStudyStyle());
                    r.setProfilePicture(s.getProfilePicture());
                    r.setMatchScore(calculatePeerScore(s, current));
                    
                    java.util.List<String> reasons = new java.util.ArrayList<>();
                    reasons.add("Same Intake");
                    if (s.getStudyStyle() != null && s.getStudyStyle().equalsIgnoreCase(current.getStudyStyle())) {
                        reasons.add("Same Study Style");
                    }
                    r.setMatchReasons(reasons);
                    return r;
                })
                .toList();

        return paginateList(responses, pageable);
    }

    private int calculatePeerScore(Student candidate, Student current) {
        int score = 0;
        // Intake is already same from DB query, so +10
        score += 10;
        
        // Modules overlap
        if (current.getCurrentModules() != null && candidate.getCurrentModules() != null) {
            int overlapScore = 0;
            for (String mod : current.getCurrentModules()) {
                if (candidate.getCurrentModules().contains(mod)) {
                    overlapScore += 2;
                    if (current.getModuleConfidence() != null && candidate.getModuleConfidence() != null) {
                        Integer c1 = current.getModuleConfidence().get(mod);
                        Integer c2 = candidate.getModuleConfidence().get(mod);
                        if (c1 != null && c2 != null) {
                            // If they have similar confidence, give them points (up to 5 for exact match)
                            int diff = Math.abs(c1 - c2);
                            overlapScore += Math.max(0, 5 - diff);
                        }
                    }
                }
            }
            score += Math.min(overlapScore, 20); // Cap at 20
        }
        
        // Study style match
        if (current.getStudyStyle() != null && !current.getStudyStyle().isBlank() &&
                current.getStudyStyle().equalsIgnoreCase(candidate.getStudyStyle())) {
            score += 5;
        }
        return score;
    }

    public Page<com.sliit.studyhub.model.dto.MatchResultDTO> getMentorMatches(String studentId, Pageable pageable) {
        Student current = studentRepository.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        // Get seniors (earlier intake) in same program
        List<Student> candidates = studentRepository.findByIntakeYearLessThan(current.getIntakeYear())
                .stream()
                .filter(s -> s.getProgram().equalsIgnoreCase(current.getProgram()))
                .toList();
                
        // Score: Higher current year = higher mentor viability
        // Additional score if they studied the exact module? Hard without historic transcripts, 
        // but assume year > target means they completed.
        List<com.sliit.studyhub.model.dto.MatchResultDTO> responses = candidates.stream()
                .sorted((s1, s2) -> Integer.compare(calculateMentorScore(s2, current), calculateMentorScore(s1, current)))
                .map(s -> {
                    com.sliit.studyhub.model.dto.MatchResultDTO r = new com.sliit.studyhub.model.dto.MatchResultDTO();
                    r.setStudentId(s.getStudentId());
                    r.setProgram(s.getProgram());
                    r.setIntakeYear(s.getIntakeYear());
                    r.setCurrentYear(s.getCurrentYear());
                    r.setStudyStyle(s.getStudyStyle());
                    r.setProfilePicture(s.getProfilePicture());
                    r.setMatchScore(calculateMentorScore(s, current));
                    
                    java.util.List<String> reasons = new java.util.ArrayList<>();
                    reasons.add("Senior in " + s.getProgram());
                    if (s.getStudyStyle() != null && s.getStudyStyle().equalsIgnoreCase(current.getStudyStyle())) {
                        reasons.add("Same Study Style");
                    }
                    r.setMatchReasons(reasons);
                    return r;
                })
                .toList();
                
        return paginateList(responses, pageable);
    }
    
    private int calculateMentorScore(Student mentor, Student current) {
        int score = 0;
        // Priority to mentors just 1 year ahead (closer relevance) or more senior? 
        // Let's reward higher years.
        score += mentor.getCurrentYear() * 5;
        if (mentor.getStudyStyle() != null && mentor.getStudyStyle().equalsIgnoreCase(current.getStudyStyle())) {
            score += 5;
        }
        return score;
    }

    // Auto Group Creation Suggestion
    public GroupCreationSuggestion suggestGroupCreation(String studentId) {
        Student current = studentRepository.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        if (current.getCurrentModules() == null || current.getCurrentModules().isEmpty()) {
            return null; // cannot suggest group without modules
        }

        // Safely pick the first module as the target
        String targetModule = current.getCurrentModules().stream().findFirst().orElse(null);
        if (targetModule == null) return null;

        List<Student> candidates = studentRepository.findByProgramAndIntakeYear(current.getProgram(), current.getIntakeYear());
        
        // Find 3 top peers who also take this module
        List<String> suggestedPeers = candidates.stream()
                .filter(s -> !s.getStudentId().equals(studentId))
                .filter(s -> s.getCurrentModules() != null && s.getCurrentModules().contains(targetModule))
                .sorted((s1, s2) -> Integer.compare(calculatePeerScore(s2, current), calculatePeerScore(s1, current)))
                .limit(3)
                .map(Student::getStudentId)
                .distinct()
                .toList();

        if (suggestedPeers.size() < 2) return null; // Not enough peers to form a group

        return new GroupCreationSuggestion(
                targetModule,
                suggestedPeers,
                "Create a new study group for " + targetModule + " with " + suggestedPeers.size() + " highly compatible peers!",
                85, // Default score
                "Matched based on shared intake year and common study modules"
        );
    }

    private <T> Page<T> paginateList(List<T> list, Pageable pageable) {
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), list.size());
        if (start > list.size()) {
            return new PageImpl<>(List.of(), pageable, list.size());
        }
        return new PageImpl<>(list.subList(start, end), pageable, list.size());
    }

    public Page<com.sliit.studyhub.model.dto.MatchResultDTO> getCrossProgramMatches(String studentId, Pageable pageable) {
        Student current = studentRepository.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        if (current.getCurrentModules() == null || current.getCurrentModules().isEmpty()) {
             return new PageImpl<>(List.of(), pageable, 0);
        }

        org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
        query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("program").ne(current.getProgram()));
        query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("currentModules").in(current.getCurrentModules()));

        List<Student> candidates = mongoTemplate.find(query, Student.class);

        List<com.sliit.studyhub.model.dto.MatchResultDTO> responses = candidates.stream()
                .filter(s -> !s.getStudentId().equals(studentId))
                .sorted((s1, s2) -> Integer.compare(calculatePeerScore(s2, current), calculatePeerScore(s1, current)))
                .map(s -> {
                    com.sliit.studyhub.model.dto.MatchResultDTO r = new com.sliit.studyhub.model.dto.MatchResultDTO();
                    r.setStudentId(s.getStudentId());
                    r.setProgram(s.getProgram());
                    r.setIntakeYear(s.getIntakeYear());
                    r.setCurrentYear(s.getCurrentYear());
                    r.setStudyStyle(s.getStudyStyle());
                    r.setProfilePicture(s.getProfilePicture());
                    r.setMatchScore(calculatePeerScore(s, current));
                    
                    java.util.List<String> reasons = new java.util.ArrayList<>();
                    reasons.add("Shared Modules across programs");
                    r.setMatchReasons(reasons);
                    return r;
                })
                .toList();

        return paginateList(responses, pageable);
    }
}