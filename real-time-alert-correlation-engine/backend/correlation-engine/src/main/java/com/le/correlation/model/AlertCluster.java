package com.le.correlation.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.time.Duration;
import java.time.Instant;
import org.locationtech.jts.geom.Point;

public class AlertCluster {
    private String id;
    private List<Alert> alerts;
    private Point centroid;
    
    // Constructor
    public AlertCluster(String id, List<Alert> alerts) {
        this.id = id;
        this.alerts = alerts != null ? alerts : new ArrayList<>();
    }
    
    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public List<Alert> getAlerts() { return alerts; }
    public void setAlerts(List<Alert> alerts) { this.alerts = alerts; }
    
    public Point getCentroid() { return centroid; }
    public void setCentroid(Point centroid) { this.centroid = centroid; }
    
    // Utility methods
    public int size() {
        return alerts.size();
    }
    
    public List<String> getAlertIds() {
        return alerts.stream().map(Alert::getId).collect(Collectors.toList());
    }
    
    public Set<AlertSource> getSourceTypes() {
        return alerts.stream().map(Alert::getSource).collect(Collectors.toSet());
    }
    
    public int countByPriority(Priority priority) {
        return (int) alerts.stream()
                .filter(alert -> alert.getPriority() == priority)
                .count();
    }
    
    public boolean hasSource(AlertSource source) {
        return alerts.stream().anyMatch(alert -> alert.getSource() == source);
    }
    
    public Duration getTimeRange() {
        if (alerts.isEmpty()) return Duration.ZERO;
        
        Instant first = alerts.stream()
            .map(Alert::getTimestamp)
            .min(Instant::compareTo)
            .orElse(Instant.now());
            
        Instant last = alerts.stream()
            .map(Alert::getTimestamp)
            .max(Instant::compareTo)
            .orElse(Instant.now());
            
        return Duration.between(first, last);
    }
    
    public Instant getFirstAlertTime() {
        return alerts.stream()
            .map(Alert::getTimestamp)
            .min(Instant::compareTo)
            .orElse(Instant.now());
    }
    
    public Instant getLastAlertTime() {
        return alerts.stream()
            .map(Alert::getTimestamp)
            .max(Instant::compareTo)
            .orElse(Instant.now());
    }
    
    // Add method to remove alerts by ID
    public void removeAlert(String alertId) {
        alerts.removeIf(alert -> alert.getId().equals(alertId));
    }
}