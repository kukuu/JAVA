package com.le.correlation.service;

import com.le.correlation.model.Alert;
import com.le.correlation.model.AlertCluster;
import java.util.List;

public interface GeospatialService {
    List<AlertCluster> performClustering(List<Alert> alerts, double radiusMeters);
}