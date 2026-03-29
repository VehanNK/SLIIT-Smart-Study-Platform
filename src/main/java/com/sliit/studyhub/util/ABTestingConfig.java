package com.sliit.studyhub.util;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * A/B testing configuration for ranking algorithms.
 * Allows different weight variants to be tested and compared.
 * 
 * Example application.properties:
 *   ab-testing.enabled=true
 *   ab-testing.variant=variant-b
 *   ab-testing.variant-a.weight-rating=3.0
 *   ab-testing.variant-b.weight-rating=2.5
 */
@Component
@ConfigurationProperties(prefix = "ab-testing")
@Data
@NoArgsConstructor
public class ABTestingConfig {
    
    private boolean enabled = false;
    private String variant = "default";  // default, variant-a, variant-b, variant-c
    
    // Variant A weights (conservative: higher weight on rating)
    private VariantWeights variantA = new VariantWeights();
    
    // Variant B weights (aggressive: higher weight on program match)
    private VariantWeights variantB = new VariantWeights();
    
    // Variant C weights (recency-focused: higher weight on new uploads)
    private VariantWeights variantC = new VariantWeights();
    
    /**
     * Get the active variant weights based on current configuration.
     */
    public VariantWeights getActiveVariant() {
        if (!enabled) {
            return new VariantWeights(); // Return defaults
        }
        
        return switch (variant.toLowerCase()) {
            case "variant-a" -> variantA;
            case "variant-b" -> variantB;
            case "variant-c" -> variantC;
            default -> new VariantWeights();
        };
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VariantWeights {
        private double weightRating = 3.0;
        private double weightDownloads = 2.0;
        private double weightProgramMatch = 10.0;
        private double weightIntakeProximity = 5.0;
        private double weightRecency = 1.0;
    }
}
