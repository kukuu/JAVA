package com.le.correlation.service;

import org.locationtech.jts.geom.Point;

public interface ThreatIntelligenceService {
    boolean checkLocation(Point location);
}