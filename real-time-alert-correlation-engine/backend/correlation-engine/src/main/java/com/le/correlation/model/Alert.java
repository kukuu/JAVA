package com.le.correlation.model;

import org.locationtech.jts.geom.Point;
import java.time.Instant;

public class Alert {
    private String id;
    private String type;
    private Point location;
    private Instant timestamp;
    private Priority priority;
    private AlertSource source;
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public Point getLocation() { return location; }
    public void setLocation(Point location) { this.location = location; }
    
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    
    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }
    
    public AlertSource getSource() { return source; }
    public void setSource(AlertSource source) { this.source = source; }
}