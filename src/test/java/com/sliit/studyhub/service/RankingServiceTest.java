package com.sliit.studyhub.service;

import com.sliit.studyhub.model.Resource;
import com.sliit.studyhub.util.RankingWeights;
import com.sliit.studyhub.util.ABTestingConfig;
import com.sliit.studyhub.util.StudentIdParser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("RankingService Tests")
class RankingServiceTest {
    
    private RankingService rankingService;
    
    @Mock
    private StudentIdParser idParser;
    
    @Mock
    private ABTestingConfig abTestingConfig;
    
    private RankingWeights defaultWeights;
    
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        // Use default weights for tests
        defaultWeights = RankingWeights.builder()
                .weightRating(3.0)
                .weightDownloads(2.0)
                .weightProgramMatch(10.0)
                .weightIntakeProximity(5.0)
                .weightRecency(1.0)
                .build();
        
        // Mock ABTestingConfig to be disabled (so tests use default weights)
        when(abTestingConfig.isEnabled()).thenReturn(false);
        
        rankingService = new RankingService(defaultWeights, abTestingConfig, idParser);
    }
    
    @Test
    @DisplayName("Should score based on rating and downloads when no searcher ID")
    void testBaseScoring() {
        Resource resource = new Resource();
        resource.setAvgRating(4.5);
        resource.setDownloads(10);
        
        double score = rankingService.calculateScore(resource, null);
        
        // Expected: 4.5 * 3.0 + 10 * 2.0 = 13.5 + 20 = 33.5
        assertEquals(33.5, score, 0.01);
    }
    
    @Test
    @DisplayName("Should apply program match bonus when searcher program matches uploader")
    void testProgramMatchBonus() {
        StudentIdParser.ParsedStudentId searcherParsed = new StudentIdParser.ParsedStudentId(
                "IT", 2023, 2, "1001"
        );
        
        when(idParser.parse("ST/2023/1001")).thenReturn(searcherParsed);
        
        Resource resource = new Resource();
        resource.setAvgRating(3.0);
        resource.setDownloads(5);
        resource.setUploaderProgram("IT");
        resource.setUploaderIntake(2023);
        
        double score = rankingService.calculateScore(resource, "ST/2023/1001");
        
        // Expected: 3.0*3 + 5*2 + 10 (program match) + 5 (intake gap=0) = 9 + 10 + 10 + 5 = 34
        assertEquals(34.0, score, 0.01);
    }
    
    @Test
    @DisplayName("Should not apply program match bonus when programs differ")
    void testNoProgramMatchBonus() {
        StudentIdParser.ParsedStudentId searcherParsed = new StudentIdParser.ParsedStudentId(
                "CS", 2023, 2, "1001"
        );
        
        when(idParser.parse("ST/2023/1001")).thenReturn(searcherParsed);
        
        Resource resource = new Resource();
        resource.setAvgRating(3.0);
        resource.setDownloads(5);
        resource.setUploaderProgram("IT");
        resource.setUploaderIntake(2023);
        
        double score = rankingService.calculateScore(resource, "ST/2023/1001");
        
        // Expected: 3.0*3 + 5*2 + 0 (no program match) + 5 (intake gap=0) = 9 + 10 + 0 + 5 = 24
        assertEquals(24.0, score, 0.01);
    }
    
    @Test
    @DisplayName("Should apply decreasing intake proximity bonus based on gap")
    void testIntakeProximityBonus() {
        StudentIdParser.ParsedStudentId searcherParsed = new StudentIdParser.ParsedStudentId(
                "IT", 2023, 2, "1001"
        );
        
        when(idParser.parse("ST/2023/1001")).thenReturn(searcherParsed);
        
        // Test gap = 0 (same intake)
        Resource resource1 = new Resource();
        resource1.setAvgRating(3.0);
        resource1.setDownloads(0);
        resource1.setUploaderIntake(2023);
        
        double score1 = rankingService.calculateScore(resource1, "ST/2023/1001");
        // Expected: 9 + 0 + 0 + 5 (gap=0, bonus=5) = 14
        assertEquals(14.0, score1, 0.01);
        
        // Test gap = 1 year
        Resource resource2 = new Resource();
        resource2.setAvgRating(3.0);
        resource2.setDownloads(0);
        resource2.setUploaderIntake(2022);  // 1 year older
        
        double score2 = rankingService.calculateScore(resource2, "ST/2023/1001");
        // Expected: 9 + 0 + 0 + 4 (gap=1, bonus=5-1=4) = 13
        assertEquals(13.0, score2, 0.01);
        
        // Test gap = 5+ years (no bonus, max deduction)
        Resource resource3 = new Resource();
        resource3.setAvgRating(3.0);
        resource3.setDownloads(0);
        resource3.setUploaderIntake(2018);  // 5 years older
        
        double score3 = rankingService.calculateScore(resource3, "ST/2023/1001");
        // Expected: 9 + 0 + 0 + 0 (gap=5, bonus=max(0,5-5)=0) = 9
        assertEquals(9.0, score3, 0.01);
    }
    
    @Test
    @DisplayName("Should apply recency bonus for recent uploads")
    void testRecencyBonus() {
        Resource resource = new Resource();
        resource.setAvgRating(3.0);
        resource.setDownloads(0);
        resource.setUploadedAt(LocalDateTime.now().minusDays(5));  // 5 days ago
        
        double score = rankingService.calculateScore(resource, null);
        
        // Expected: 9 + 0 + recency_bonus
        // recency_bonus = 1.0 * (1.0 - 5/30) ≈ 0.833
        double expectedRecencyBonus = 1.0 * (1.0 - 5.0 / 30.0);
        double expected = 9.0 + expectedRecencyBonus;
        
        assertEquals(expected, score, 0.01);
    }
    
    @Test
    @DisplayName("Should not apply recency bonus for old uploads (>30 days)")
    void testNoRecencyBonusForOldUploads() {
        Resource resource = new Resource();
        resource.setAvgRating(3.0);
        resource.setDownloads(0);
        resource.setUploadedAt(LocalDateTime.now().minusDays(60));  // 60 days ago
        
        double score = rankingService.calculateScore(resource, null);
        
        // Expected: 9 + 0 + 0 (no recency bonus) = 9
        assertEquals(9.0, score, 0.01);
    }
    
    @Test
    @DisplayName("Should handle null uploadedAt gracefully")
    void testNullUploadedAt() {
        Resource resource = new Resource();
        resource.setAvgRating(3.0);
        resource.setDownloads(5);
        resource.setUploadedAt(null);
        
        double score = rankingService.calculateScore(resource, null);
        
        // Expected: 3.0*3 + 5*2 + 0 = 9 + 10 = 19
        assertEquals(19.0, score, 0.01);
    }
    
    @Test
    @DisplayName("Should order resources by score descending in comparator")
    void testCompareByScore() {
        Resource r1 = new Resource();
        r1.setAvgRating(5.0);
        r1.setDownloads(10);
        
        Resource r2 = new Resource();
        r2.setAvgRating(3.0);
        r2.setDownloads(5);
        
        int cmp = rankingService.compareByScore(r1, r2, null);
        
        // r1 should come first (higher score)
        assertTrue(cmp < 0, "Higher-scoring resource should come first");
    }
    
    @Test
    @DisplayName("Should handle invalid searcher ID gracefully (skip personalization)")
    void testInvalidSearcherIdHandled() {
        when(idParser.parse("INVALID")).thenThrow(new RuntimeException("Invalid ID"));
        
        Resource resource = new Resource();
        resource.setAvgRating(3.0);
        resource.setDownloads(5);
        resource.setUploaderProgram("IT");
        resource.setUploaderIntake(2023);
        
        // Should not throw; should fall back to base scoring
        double score = rankingService.calculateScore(resource, "INVALID");
        
        // Expected: 3.0*3 + 5*2 = 19
        assertEquals(19.0, score, 0.01);
    }
    
    @Test
    @DisplayName("Weights validation should pass for non-negative values")
    void testWeightsValidation() {
        RankingWeights weights = RankingWeights.builder()
                .weightRating(1.0)
                .weightDownloads(1.0)
                .weightProgramMatch(1.0)
                .weightIntakeProximity(1.0)
                .weightRecency(1.0)
                .build();
        
        assertDoesNotThrow(weights::validate);
    }
    
    @Test
    @DisplayName("Weights validation should fail for negative values")
    void testWeightsValidationFails() {
        RankingWeights weights = RankingWeights.builder()
                .weightRating(-1.0)  // Invalid
                .weightDownloads(1.0)
                .weightProgramMatch(1.0)
                .weightIntakeProximity(1.0)
                .weightRecency(1.0)
                .build();
        
        assertThrows(IllegalArgumentException.class, weights::validate);
    }
}
