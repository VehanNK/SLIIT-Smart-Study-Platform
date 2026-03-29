package com.sliit.studyhub.util;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configurable ranking weights for resource personalized scoring.
 * Weights are applied in searchResources() to rank resources by relevance.
 * 
 * Example application.properties:
 *   ranking.weight-rating=3.0
 *   ranking.weight-downloads=2.0
 *   ranking.weight-program-match=10.0
 *   ranking.weight-intake-proximity=5.0
 *   ranking.weight-recency=1.0
 */
@Component
@ConfigurationProperties(prefix = "ranking")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RankingWeights {
    
    // Default weights if not overridden in properties
    private double weightRating = 3.0;
    private double weightDownloads = 2.0;
    private double weightProgramMatch = 10.0;
    private double weightIntakeProximity = 5.0;
    private double weightRecency = 1.0;
    
    /**
     * Validate that all weights are non-negative.
     */
    public void validate() {
        if (weightRating < 0 || weightDownloads < 0 || weightProgramMatch < 0 
            || weightIntakeProximity < 0 || weightRecency < 0) {
            throw new IllegalArgumentException("All ranking weights must be non-negative");
        }
    }
}
