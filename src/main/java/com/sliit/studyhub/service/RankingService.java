package com.sliit.studyhub.service;

import com.sliit.studyhub.model.Resource;
import com.sliit.studyhub.util.RankingWeights;
import com.sliit.studyhub.util.ABTestingConfig;
import com.sliit.studyhub.util.StudentIdParser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Encapsulates personalized ranking logic for resources.
 * Calculates a composite score based on configurable weights.
 */
@Service
@RequiredArgsConstructor
public class RankingService {
    
    private final RankingWeights weights;
    private final ABTestingConfig abTestingConfig;
    private final StudentIdParser idParser;
    
    /**
     * Calculate a composite ranking score for a resource given a searcher's student ID.
     * 
     * @param resource the resource to score
     * @param searcherId the student ID of the searcher (can be null/empty for anonymous)
     * @return a composite score; higher is more relevant
     */
    public double calculateScore(Resource resource, String searcherId) {
        RankingWeights activeWeights = getActiveWeights();
        double score = 0.0;
        
        // 1. Base scores: rating and downloads (always applied)
        if (resource.getAvgRating() > 0) {
            score += resource.getAvgRating() * activeWeights.getWeightRating();
        }
        if (resource.getDownloads() > 0) {
            score += resource.getDownloads() * activeWeights.getWeightDownloads();
        }
        
        // 2. Personalized scores (if searcher is identified)
        if (searcherId != null && !searcherId.trim().isEmpty()) {
            try {
                var searcherParsed = idParser.parse(searcherId);
                
                // Program match bonus
                if (resource.getUploaderProgram() != null 
                    && searcherParsed.program != null
                    && searcherParsed.program.equalsIgnoreCase(resource.getUploaderProgram())) {
                    score += activeWeights.getWeightProgramMatch();
                }
                
                // Intake proximity bonus (closer = higher bonus)
                Integer uploaderIntake = resource.getUploaderIntake();
                if (uploaderIntake != null && uploaderIntake > 0) {
                    int intakeGap = Math.abs(searcherParsed.intakeYear - uploaderIntake);
                    double intakeBonus = Math.max(0, activeWeights.getWeightIntakeProximity() - intakeGap);
                    score += intakeBonus;
                }
                
            } catch (Exception e) {
                // If student ID parsing fails, skip personalization
                // (e.g., malformed ID; proceed with base scores only)
            }
        }
        
        // 3. Recency bonus (if uploadedAt is recent, e.g., within 30 days)
        if (resource.getUploadedAt() != null) {
            LocalDateTime now = LocalDateTime.now();
            long daysSinceUpload = java.time.temporal.ChronoUnit.DAYS
                .between(resource.getUploadedAt(), now);
            
            // Bonus decays: fresh uploads get more weight, older ones get less
            if (daysSinceUpload >= 0 && daysSinceUpload <= 30) {
                double recencyBonus = activeWeights.getWeightRecency() * (1.0 - daysSinceUpload / 30.0);
                score += recencyBonus;
            }
        }
        
        return score;
    }
    
    /**
     * Comparator for sorting resources by score (descending).
     * Higher scores come first.
     */
    public int compareByScore(Resource r1, Resource r2, String searcherId) {
        double score1 = calculateScore(r1, searcherId);
        double score2 = calculateScore(r2, searcherId);
        return Double.compare(score2, score1);  // Descending (higher first)
    }

    /**
     * Get the active ranking weights (either from A/B testing variant or default).
     */
    private RankingWeights getActiveWeights() {
        if (abTestingConfig != null && abTestingConfig.isEnabled()) {
            var variant = abTestingConfig.getActiveVariant();
            return RankingWeights.builder()
                    .weightRating(variant.getWeightRating())
                    .weightDownloads(variant.getWeightDownloads())
                    .weightProgramMatch(variant.getWeightProgramMatch())
                    .weightIntakeProximity(variant.getWeightIntakeProximity())
                    .weightRecency(variant.getWeightRecency())
                    .build();
        }
        return weights;
    }
}
