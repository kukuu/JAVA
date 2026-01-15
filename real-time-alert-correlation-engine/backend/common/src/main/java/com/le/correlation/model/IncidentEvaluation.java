package com.le.correlation.model;

import java.util.List;

public class IncidentEvaluation {
    private Severity severity = Severity.LOW;
    private double confidence = 0.0;
    private boolean isCritical = false;
    private List<String> triggeredRules;
    private String patternType;
    private List<String> recommendedActions;
    
    public Severity getSeverity() {
        return severity;
    }
    
    public void setSeverity(Severity severity) {
        this.severity = severity;
    }
    
    public double getConfidence() {
        return confidence;
    }
    
    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }
    
    public boolean isCritical() {
        return isCritical;
    }
    
    public void setCritical(boolean critical) {
        isCritical = critical;
    }
    
    public List<String> getTriggeredRules() {
        return triggeredRules;
    }
    
    public void setTriggeredRules(List<String> triggeredRules) {
        this.triggeredRules = triggeredRules;
    }
    
    public String getPatternType() {
        return patternType;
    }
    
    public void setPatternType(String patternType) {
        this.patternType = patternType;
    }
    
    public List<String> getRecommendedActions() {
        return recommendedActions;
    }
    
    public void setRecommendedActions(List<String> recommendedActions) {
        this.recommendedActions = recommendedActions;
    }
}