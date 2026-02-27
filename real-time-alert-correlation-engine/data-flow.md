# Data Flow

- Ingestion Phase: Multiple Kafka streams ingest real-time data

- Normalization: Data normalized to common alert format with geospatial enrichment

- Correlation: Geospatial clustering and pattern matching

- Incident Flagging: ML-based anomaly detection and rule engine

- Notification: Real-time alerts to authorized personnel

- Audit: Complete audit trail with non-repudiation

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

**purpose**


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


