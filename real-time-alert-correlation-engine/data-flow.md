# Data Flow

- Ingestion Phase: Multiple Kafka streams ingest real-time data

- Normalization: Data normalized to common alert format with geospatial enrichment

- Correlation: Geospatial clustering and pattern matching

- Incident Flagging: ML-based anomaly detection and rule engine

- Notification: Real-time alerts to authorized personnel

- Audit: Complete audit trail with non-repudiation

- Code Architecture
  - 1. **Imports Strategy**
    2. **Domain Model Design Goals**
    3. **Business Logic Methods**
    4. **Design Patterns & Conventions**

# backend/common/data-models/src/main/java/com/le/models/Alert.java

**Code**

```
// backend/common/data-models/src/main/java/com/le/models/Alert.java
//Data Models with Encryption

package com.le.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.Map;

```
**Purpose**

- **Jackson annotations**: Control JSON serialization/deserialization (ignore fields, include non-null values)
- **Swagger**: Generate OpenAPI documentation for API models
- **Lombok**: Reduce boilerplate code with auto-generated getters/setters and constructors
- **Spring Data MongoDB annotations**: Map Java objects to MongoDB documents, define indexes, and handle geospatial data
- **Validation constraints**: Ensure data integrity with field validations
- **Java time/util**: Handle timestamps and collections in the model


## real-time-alert-correlation-engine/backend/common/security-core/src/main/java/com/le/security/SecurityConfig.java

### Overall Purpose
This file configures security for a reactive microservice, implementing **OAuth2 resource server** capabilities with JWT-based authentication and comprehensive security controls.

### Key Components & Goals

#### 1. **Imports Strategy**
- **Reactive Security**: Uses WebFlux security (`EnableWebFluxSecurity`) for non-blocking, reactive applications
- **JWT Support**: Imports Nimbus for JWT decoding and validation
- **CORS Configuration**: Includes reactive CORS support for cross-origin requests
- **Reactive Types**: Uses `Mono` and reactive streams for non-blocking operations

#### 2. **Security Configuration Goals**
The `securityWebFilterChain` method establishes:
- **CSRF Protection**: Disabled (common for stateless REST APIs using tokens)
- **CORS**: Enables cross-origin requests with specific configuration
- **Authorization Rules**:
  - Public access to health and Prometheus endpoints
  - Scope-based authorization for API endpoints:
    - `/alerts/**` requires `SCOPE_alerts:read`
    - `/correlation/**` requires `SCOPE_correlation:write`
  - All other endpoints require authentication
- **OAuth2 Resource Server**: Validates JWT tokens from the authorization server
- **Security Headers**: Implements CSP, XSS protection, and frame options

#### 3. **CORS Configuration**
Configures browser security for frontend access:
- Allows only specific origin (`dashboard.le.example.com`)
- Permits common HTTP methods and headers
- Enables credentials (cookies, authorization headers)
- Caches preflight responses for 1 hour

#### 4. **JWT Decoder**
Sets up token validation by pointing to the OIDC provider's JWKS endpoint, which provides the public keys to verify JWT signatures.

This is a **production-ready security configuration** that implements industry best practices for a reactive microservice in a microservices architecture.




## real-time-alert-correlation-engine/backend/common/src/main/java/com/le/correlation/model/Alert.java

**Purpose**

 This is a **domain model class** representing an `Alert` entity. 

### Overall Purpose
This file defines the data structure for an **alert** in the correlation module, likely representing security events, incidents, or notifications that need to be processed and correlated.

### Key Components & Goals

#### 1. **Imports Strategy**
- **Geospatial Support**: Uses JTS (Java Topology Suite) `Point` for location data, enabling geographic coordinates and spatial queries
- **Temporal Support**: Uses `Instant` for precise, timezone-aware timestamps (UTC-based)
- **Flexible Data**: Uses `Map<String, Object>` for extensible metadata without schema rigidity

#### 2. **Domain Model Design Goals**

The `Alert` class establishes a rich domain object with:

- **Unique Identification**: `id` field for tracking and referencing specific alerts
- **Source Tracking**: `AlertSource` enum/class to identify where the alert originated
- **Priority Classification**: `Priority` enum/class for severity levels (likely CRITICAL, HIGH, MEDIUM, LOW)
- **Geospatial Context**: `Point` location to pin-point where the alert occurred (latitude/longitude)
- **Temporal Precision**: `Instant` timestamp for exact event time, crucial for correlation and sequencing
- **Extensibility**: `metadata` map for additional context without changing the data model

#### 3. **Design Patterns & Conventions**
- **JavaBean Pattern**: Standard getters/setters for compatibility with frameworks (Spring, Jackson serialization)
- **Immutable-like Structure**: Fields are privately encapsulated, controlled access via methods
- **Type Safety**: Strong typing for core fields (String, enum, Point, Instant) with flexibility only in metadata

This is a **core domain entity** designed to support:
- **Alert correlation**: Finding relationships between alerts based on time, location, and metadata
- **Geographic visualization**: Mapping alerts by location
- **Prioritization**: Filtering and routing based on severity
- **Audit trail**: Tracking when alerts occurred with precise timestamps


## real-time-alert-correlation-engine/backend/common/src/main/java/com/le/correlation/model/AlertCluster.java

This is a **domain model class** representing an `AlertCluster` - a grouping of related alerts after correlation.
### Overall Purpose
This file defines the data structure for a **cluster of correlated alerts**, representing a collection of related security events that have been grouped together based on patterns, proximity, or relationships.

### Key Components & Goals

#### 1. **Imports Strategy**
- **Geospatial Support**: Uses JTS `Point` for the cluster's geographic center (centroid)
- **Temporal Support**: 
  - `Instant` for precise start/end times of the cluster
  - `Duration` for calculating the time span of the cluster
- **Collection Support**: `List` for ordered alert IDs, `Set` for unique source types

#### 2. **Domain Model Design Goals**

The `AlertCluster` class establishes a **correlation result** with:

- **Alert References**: `alertIds` list linking to individual alerts in the cluster
- **Geospatial Summary**: `centroid` representing the average geographic location of all alerts
- **Temporal Boundaries**: `startTime` and `endTime` defining the cluster's time window
- **Source Diversity**: `sourceTypes` set tracking which systems generated the alerts

#### 3. **Business Logic Methods**

The class provides derived information:

- **Cluster Size**: `size()` returns the number of alerts in the cluster
- **Priority Distribution**: `countByPriority()` - Note: Currently returns `size()/2` as a placeholder/demo implementation
- **Source Membership**: `hasSource()` checks if alerts from a specific source are in the cluster
- **Time Range**: `getTimeRange()` calculates the duration between earliest and latest alert

#### 4. **Design Patterns & Conventions**
- **Derived Properties**: Methods like `getTimeRange()` compute values rather than storing them
- **JavaBean Pattern**: Standard getters/setters for framework compatibility
- **Immutable-like Structure**: Encapsulated fields with controlled access

This is a **correlation output entity** designed to:

- **Group related alerts**: Reducing alert noise through correlation
- **Provide summary statistics**: Geographic center, time span, and composition
- **Enable analysis**: Query cluster properties (size, sources, time range)
- **Support visualization**: Centroid for mapping, time range for timeline display

.......
  
.......

**Code**

```
@Data
@NoArgsConstructor
@Document(collection = "alerts")
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Base alert model with PII encryption")
public class Alert {
    
    @Id
    @Schema(description = "Unique alert identifier", example = "alert-12345")
    private String id;
    
    @NotNull
    @Schema(description = "Alert source type", example = "911_CALL")
    private AlertSource source;
    
    @NotBlank
    @Schema(description = "Alert source ID", example = "911-2024-001234")
    private String sourceId;
    
    @NotNull
    @Schema(description = "Alert timestamp")
    private Instant timestamp;
    
    @NotBlank
    @Schema(description = "Alert category", example = "EMERGENCY_MEDICAL")
    private String category;
    
    @NotNull
    @Schema(description = "Alert priority", example = "HIGH")
    private Priority priority;
    
    @NotNull
    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    @Schema(description = "Geospatial coordinates")
    private GeoJsonPoint location;
    
    @Indexed
    @Schema(description = "Encrypted PII data")
    private String encryptedPii;
    
    @Transient
    @JsonIgnore
    @Schema(description = "Decrypted PII (transient)", hidden = true)
    private Map<String, Object> piiData;
    
    @Schema(description = "Alert metadata")
    private Map<String, Object> metadata;
    
    @Schema(description = "Confidence score 0-1")
    private Double confidenceScore = 1.0;
    
    @Schema(description = "Correlation IDs")
    private List<String> correlationIds;
    
    @Indexed
    @Schema(description = "Incident ID if correlated")
    private String incidentId;
    
    @Schema(description = "Audit trail")
    private List<AuditEntry> auditTrail;
    
    public enum AlertSource {
        CALL_911,
        SOCIAL_MEDIA,
        SENSOR,
        BOLO,
        PATROL
    }
    
    public enum Priority {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }
    
    @Data
    @NoArgsConstructor
    public static class AuditEntry {
        private Instant timestamp;
        private String userId;
        private String action;
        private String details;
        private String signature;
    }
}
```
**Purpose**

- **Class-level annotations**: Lombok generates getters/setters (`@Data`) and no-arg constructor, Spring maps to MongoDB "alerts" collection, Jackson ignores null values in JSON output, and Swagger provides API documentation.
- **Field definitions**: Define alert data structure with validation constraints (`@NotNull`/`@NotBlank`), database indexes for geospatial and regular fields, transient/ignored fields for unencrypted PII, and schema descriptions for API documentation.
- **Nested enums and class**: Define allowed source types and priority levels with type safety, plus an inner audit entry class for tracking who modified alerts and when.
- **Transient  fields**: Are fields that are not persisted to the database. In this code:

_private Map<String, Object>_ piiData is marked with @Transient, so it won't be stored in MongoDB

It contains decrypted PII data that exists only in memory at runtime

The actual encrypted PII is stored in the encryptedPii field that is persisted

This pattern allows the application to work with decrypted data temporarily while ensuring only encrypted values are stored permanently in the database.


