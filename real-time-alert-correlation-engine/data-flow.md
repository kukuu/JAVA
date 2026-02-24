# Data Flow

- Ingestion Phase: Multiple Kafka streams ingest real-time data

- Normalization: Data normalized to common alert format with geospatial enrichment

- Correlation: Geospatial clustering and pattern matching

- Incident Flagging: ML-based anomaly detection and rule engine

- Notification: Real-time alerts to authorized personnel

- Audit: Complete audit trail with non-repudiation

# real-time-alert-correlation-engine/backend/common/data-models/src/main/java/com/le/models/Alert.java

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



