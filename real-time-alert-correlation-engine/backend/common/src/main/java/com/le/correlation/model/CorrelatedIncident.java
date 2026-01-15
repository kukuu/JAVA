package com.le.correlation.model;

import org.locationtech.jts.geom.Point;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public class CorrelatedIncident {
    private String id;
    private Instant timestamp;
    private Point location;
    private List<String> alertIds;
    private double confidenceScore;
    private Severity severity;
    private List<String> recommendedActions;
    private String patternType;
    private Map<String, Object> forensicMetadata;
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public Instant getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
    
    public Point getLocation() {
        return location;
    }
    
    public void setLocation(Point location) {
        this.location = location;
    }
    
    public List<String> getAlertIds() {
        return alertIds;
    }
    
    public void setAlertIds(List<String> alertIds) {
        this.alertIds = alertIds;
    }
    
    public double getConfidenceScore() {
        return confidenceScore;
    }
    
    public void setConfidenceScore(double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }
    
    public Severity getSeverity() {
        return severity;
    }
    
    public void setSeverity(Severity severity) {
        this.severity = severity;
    }
    
    public List<String> getRecommendedActions() {
        return recommendedActions;
    }
    
    public void setRecommendedActions(List<String> recommendedActions) {
        this.recommendedActions = recommendedActions;
    }
    
    public String getPatternType() {
        return patternType;
    }
    
    public void setPatternType(String patternType) {
        this.patternType = patternType;
    }
    
    public Map<String, Object> getForensicMetadata() {
        return forensicMetadata;
    }
    
    public void setForensicMetadata(Map<String, Object> forensicMetadata) {
        this.forensicMetadata = forensicMetadata;
    }
}