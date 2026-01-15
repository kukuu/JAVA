package com.le.correlation;

import io.quarkus.runtime.StartupEvent;
import io.smallrye.mutiny.Multi;
import io.smallrye.reactive.messaging.kafka.Record;
import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.eclipse.microprofile.reactive.messaging.Outgoing;
import org.jboss.logging.Logger;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import com.le.correlation.model.Severity;
import com.le.correlation.model.Priority;
import com.le.correlation.model.AlertSource;
import com.le.correlation.model.IncidentEvaluation;
import com.le.correlation.model.AlertCluster;
import com.le.correlation.model.CorrelatedIncident;
import com.le.correlation.model.Alert;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class CorrelationService {
    
    private static final Logger LOG = Logger.getLogger(CorrelationService.class);
    private static final double CLUSTER_RADIUS_METERS = 500.0;
    private static final Duration TIME_WINDOW = Duration.ofMinutes(30);
    
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    private final Map<String, AlertCluster> activeClusters = new ConcurrentHashMap<>();
    
    @Inject
    GeospatialService geospatialService;
    
    @Inject
    RuleEngine ruleEngine;
    
    void onStart(@Observes StartupEvent ev) {
        LOG.info("Correlation Engine starting...");
    }
    
    @Incoming("alerts")
    @Outgoing("correlated-events")
    public Multi<Record<String, CorrelatedIncident>> correlateAlerts(
            Multi<Record<String, Alert>> alerts) {
        
        return alerts
            .onItem().transformToMulti(alertRecord -> {
                Alert alert = alertRecord.value();
                String clusterKey = generateClusterKey(alert);
                
                // Get or create cluster
                AlertCluster cluster = activeClusters.computeIfAbsent(clusterKey, 
                    k -> new AlertCluster(k, new ArrayList<>()));
                
                // Add alert to cluster - USING getAlerts() method
                cluster.getAlerts().add(alert);
                
                // Check if cluster should be evaluated
                if (shouldEvaluateCluster(cluster)) {
                    List<AlertCluster> clusters = geospatialService.performClustering(
                        cluster.getAlerts(), CLUSTER_RADIUS_METERS
                    );
                    
                    return Multi.createFrom().iterable(clusters)
                        .onItem().transform(clust -> {
                            IncidentEvaluation evaluation = ruleEngine.evaluate(clust);
                            if (evaluation.isCritical()) {
                                CorrelatedIncident incident = createIncident(clust, evaluation);
                                removeProcessedAlerts(clust);
                                return Record.of(incident.getId(), incident);
                            }
                            return null;
                        })
                        .filter(Objects::nonNull);
                }
                
                return Multi.createFrom().empty();
            })
            .merge();
    }
    
    private boolean shouldEvaluateCluster(AlertCluster cluster) {
        return cluster.size() >= 3 || 
               Duration.between(cluster.getFirstAlertTime(), cluster.getLastAlertTime())
                       .compareTo(Duration.ofMinutes(5)) > 0;
    }
    
    private void removeProcessedAlerts(AlertCluster processedCluster) {
        for (String alertId : processedCluster.getAlertIds()) {
            activeClusters.values().forEach(cluster -> {
                cluster.removeAlert(alertId);
            });
        }
        
        // Clean up empty clusters
        activeClusters.values().removeIf(cluster -> cluster.size() == 0);
    }
    
    private String generateClusterKey(Alert alert) {
        Point point = geometryFactory.createPoint(
            new Coordinate(
                alert.getLocation().getX(),
                alert.getLocation().getY()
            )
        );
        
        long timeBucket = alert.getTimestamp().toEpochMilli() / TIME_WINDOW.toMillis();
        
        return String.format("%d_%.4f_%.4f", timeBucket, point.getX(), point.getY());
    }
    
    private CorrelatedIncident createIncident(AlertCluster cluster, IncidentEvaluation evaluation) {
        CorrelatedIncident incident = new CorrelatedIncident();
        incident.setId(UUID.randomUUID().toString());
        incident.setTimestamp(java.time.Instant.now());
        incident.setLocation(cluster.getCentroid());
        incident.setAlertIds(cluster.getAlertIds());
        incident.setConfidenceScore(evaluation.getConfidence());
        incident.setSeverity(evaluation.getSeverity());
        incident.setRecommendedActions(evaluation.getRecommendedActions());
        incident.setPatternType(evaluation.getPatternType());
        
        incident.setForensicMetadata(Map.of(
            "cluster_size", cluster.size(),
            "sources", cluster.getSourceTypes(),
            "time_range", cluster.getTimeRange().toString(),
            "rule_triggers", evaluation.getTriggeredRules()
        ));
        
        return incident;
    }
}

// Rule Engine with LE-specific rules
@ApplicationScoped
class RuleEngine {
    
    @Inject
    ThreatIntelligenceService threatIntelligence;
    
    public IncidentEvaluation evaluate(AlertCluster cluster) {
        IncidentEvaluation evaluation = new IncidentEvaluation();
        List<String> triggeredRules = new ArrayList<>();
        
        evaluation.setSeverity(Severity.MEDIUM);
        
        if (cluster.countByPriority(Priority.HIGH) >= 3) {
            evaluation.setSeverity(Severity.CRITICAL);
            triggeredRules.add("MULTIPLE_HIGH_PRIORITY");
        }
        
        if (cluster.hasSource(AlertSource.CALL_911) && 
            cluster.hasSource(AlertSource.SOCIAL_MEDIA)) {
            evaluation.setSeverity(
                evaluation.getSeverity().compareTo(Severity.HIGH) > 0 ? 
                evaluation.getSeverity() : Severity.HIGH
            );
            triggeredRules.add("MULTI_SOURCE_CORRELATION");
        }
        
        if (threatIntelligence.checkLocation(cluster.getCentroid())) {
            evaluation.setSeverity(Severity.CRITICAL);
            triggeredRules.add("THREAT_INTEL_MATCH");
        }
        
        if (cluster.getTimeRange().toMillis() < Duration.ofMinutes(5).toMillis() &&
            cluster.size() >= 5) {
            evaluation.setSeverity(Severity.HIGH);
            triggeredRules.add("RAPID_SUCCESSION");
        }
        
        evaluation.setTriggeredRules(triggeredRules);
        evaluation.setConfidence(calculateConfidence(cluster, triggeredRules));
        evaluation.setCritical(evaluation.getSeverity().compareTo(Severity.HIGH) >= 0);
        
        return evaluation;
    }
    
    private double calculateConfidence(AlertCluster cluster, List<String> rules) {
        double baseConfidence = 0.5;
        baseConfidence += rules.size() * 0.1;
        baseConfidence += Math.min(cluster.size() * 0.05, 0.3);
        return Math.min(baseConfidence, 1.0);
    }
}