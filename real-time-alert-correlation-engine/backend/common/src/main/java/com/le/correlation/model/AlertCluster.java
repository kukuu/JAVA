package com.le.correlation.model;

import org.locationtech.jts.geom.Point;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;

public class AlertCluster {
    private List<String> alertIds;
    private Point centroid;
    private Instant startTime;
    private Instant endTime;
    private Set<String> sourceTypes;
    
    public int size() {
        return alertIds != null ? alertIds.size() : 0;
    }
    
    public int countByPriority(Priority priority) {
        return size() / 2;
    }
    
    public boolean hasSource(AlertSource source) {
        return sourceTypes != null && sourceTypes.contains(source.name());
    }
    
    public Point getCentroid() {
        return centroid;
    }
    
    public void setCentroid(Point centroid) {
        this.centroid = centroid;
    }
    
    public List<String> getAlertIds() {
        return alertIds;
    }
    
    public void setAlertIds(List<String> alertIds) {
        this.alertIds = alertIds;
    }
    
    public Set<String> getSourceTypes() {
        return sourceTypes;
    }
    
    public void setSourceTypes(Set<String> sourceTypes) {
        this.sourceTypes = sourceTypes;
    }
    
    public Duration getTimeRange() {
        if (startTime != null && endTime != null) {
            return Duration.between(startTime, endTime);
        }
        return Duration.ZERO;
    }
    
    public Instant getStartTime() {
        return startTime;
    }
    
    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }
    
    public Instant getEndTime() {
        return endTime;
    }
    
    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }
}