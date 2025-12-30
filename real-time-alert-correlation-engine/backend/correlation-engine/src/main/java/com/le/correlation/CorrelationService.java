// backend/correlation-engine/src/main/java/com/le/correlation/CorrelationService.java
//Correlation Engine (Quarkus)

package com.le.correlation;

import io.quarkus.runtime.StartupEvent;
import io.smallrye.mutiny.Multi;
import io.smallrye.reactive.messaging.kafka.Record;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.eclipse.microprofile.reactive.messaging.Outgoing;
import org.jboss.logging.Logger;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

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
            .group().by(alert -> generateClusterKey(alert.getPayload()))
            .onItem().transformToMulti(group -> {
                Alert alert = group.key();
                return Multi.createFrom().iterable(group)
                    .group().intoLists().of(Duration.ofSeconds(5), 100)
                    .onItem().transformToMulti(alertList -> {
                        return processAlertBatch(alertList, alert);
                    });
            })
            .merge();
    }
    
    private Multi<Record<String, CorrelatedIncident>> processAlertBatch(
            List<Record<String, Alert>> alerts, Alert baseAlert) {
        
        List<Alert> alertBatch = alerts.stream()
            .map(Record::getPayload)
            .toList();
        
        // Geospatial clustering
        List<AlertCluster> clusters = geospatialService.performClustering(
            alertBatch, 
            CLUSTER_RADIUS_METERS
        );
        
        // Rule engine evaluation
        return Multi.createFrom().iterable(clusters)
            .onItem().transform(cluster -> {
                IncidentEvaluation evaluation = ruleEngine.evaluate(cluster);
                
                if (evaluation.isCritical()) {
                    CorrelatedIncident incident = createIncident(cluster, evaluation);
                    return Record.of(incident.getId(), incident);
                }
                return null;
            })
            .filter(Objects::nonNull);
    }
    
    private String generateClusterKey(Alert alert) {
        // Generate spatial-temporal key for grouping
        Point point = geometryFactory.createPoint(
            new Coordinate(
                alert.getLocation().getX(),
                alert.getLocation().getY()
            )
        );
        
        long timeBucket = alert.getTimestamp().toEpochMilli() / 
                         (TIME_WINDOW.toMillis());
        
        return String.format("%d_%.4f_%.4f", 
            timeBucket,
            point.getX(),
            point.getY()
        );
    }
    
    private CorrelatedIncident createIncident(
            AlertCluster cluster, 
            IncidentEvaluation evaluation) {
        
        CorrelatedIncident incident = new CorrelatedIncident();
        incident.setId(UUID.randomUUID().toString());
        incident.setTimestamp(java.time.Instant.now());
        incident.setLocation(cluster.getCentroid());
        incident.setAlertIds(cluster.getAlertIds());
        incident.setConfidenceScore(evaluation.getConfidence());
        incident.setSeverity(evaluation.getSeverity());
        incident.setRecommendedActions(evaluation.getRecommendedActions());
        incident.setPatternType(evaluation.getPatternType());
        
        // Add forensic metadata
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
        
        // Rule 1: Multiple high-priority alerts in same location
        if (cluster.countByPriority(Priority.HIGH) >= 3) {
            evaluation.setSeverity(Severity.CRITICAL);
            triggeredRules.add("MULTIPLE_HIGH_PRIORITY");
        }
        
        // Rule 2: Mixed source correlation
        if (cluster.hasSource(AlertSource.CALL_911) && 
            cluster.hasSource(AlertSource.SOCIAL_MEDIA)) {
            evaluation.setSeverity(
                evaluation.getSeverity().compareTo(Severity.HIGH) > 0 ? 
                evaluation.getSeverity() : Severity.HIGH
            );
            triggeredRules.add("MULTI_SOURCE_CORRELATION");
        }
        
        // Rule 3: Threat intelligence match
        if (threatIntelligence.checkLocation(cluster.getCentroid())) {
            evaluation.setSeverity(Severity.CRITICAL);
            triggeredRules.add("THREAT_INTEL_MATCH");
        }
        
        // Rule 4: Temporal pattern (rapid succession)
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