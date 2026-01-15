package com.le.correlation;

import com.le.correlation.model.Alert;
import com.le.correlation.model.AlertCluster;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import javax.enterprise.context.ApplicationScoped;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class GeospatialService {
    
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    
    public List<AlertCluster> performClustering(List<Alert> alerts, double radiusMeters) {
        List<AlertCluster> clusters = new ArrayList<>();
        
        if (!alerts.isEmpty()) {
            AlertCluster cluster = new AlertCluster("cluster-1", alerts);
            
            double sumX = 0;
            double sumY = 0;
            for (Alert alert : alerts) {
                sumX += alert.getLocation().getX();
                sumY += alert.getLocation().getY();
            }
            
            Point centroid = geometryFactory.createPoint(
                new Coordinate(sumX / alerts.size(), sumY / alerts.size())
            );
            cluster.setCentroid(centroid);
            
            clusters.add(cluster);
        }
        
        return clusters;
    }
}