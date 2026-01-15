package com.le.correlation.model;

import org.locationtech.jts.geom.Point;
import java.time.Instant;
import java.util.Map;

public class Alert {
    private String id;
    private AlertSource source;
    private Priority priority;
    private Point location;
    private Instant timestamp;
    private Map<String, Object> metadata;
    
    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public AlertSource getSource() { return source; }
    public void setSource(AlertSource source) { this.source = source; }
    
    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }
    
    public Point getLocation() { return location; }
    public void setLocation(Point location) { this.location = location; }
    
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
}