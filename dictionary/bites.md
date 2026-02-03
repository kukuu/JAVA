## **@JsonIgnore**: 
Is a Jackson annotation used to exclude a property from JSON serialization and deserialization.

**In short:**

It tells Jackson to ignore a specific field or method when converting Java objects to/from JSON.

  - Common use cases:
    - Hide sensitive data (like passwords) in API responses
    - Break circular references in object relationships
    - Exclude transient or calculated fields from JSON
```

public class User {
    private String name;
    private String email;
    
    @JsonIgnore  // Password won't appear in JSON
    private String password;
}
```

## @JsonInclude 

Is a Jackson annotation that controls when a property should be included in JSON output based on its value.

- Common examples:

  - @JsonInclude(Include.NON_NULL) – Exclude properties with null values
  - @JsonInclude(Include.NON_EMPTY) – Exclude null, empty collections, empty strings, etc.
  - @JsonInclude(Include.NON_DEFAULT) – Exclude values equal to Java defaults
 
```
  @JsonInclude(JsonInclude.Include.NON_NULL)
public class Product {
    private String name;  // Only appears if not null
    private Integer stock; // Only appears if not null
}
```
This ensures cleaner JSON by automatically omitting null/empty fields

## @Schema
Is a Swagger/OpenAPI annotation that provides metadata about API models, properties, parameters, or operations for API documentation generation.

- Common uses:

  - Add descriptions and examples to API schemas
  - Define required fields, data types, and constraints
  - Control how models appear in generated documentation
  - Specify example values for properties and parameters
```
@Schema(description = "Represents a user account")
public class User {
    @Schema(description = "User's full name", example = "John Doe", required = true)
    private String name;
    
    @Schema(description = "User's email address", example = "john@example.com")
    private String email;
}
```
This annotation helps generate clear, informative API documentation in tools like Swagger UI or OpenAPI-based documentation systems

## @Data 
Is a Lombok annotation that automatically generates common boilerplate code for a Java class, including getters, setters, toString(), equals(), hashCode(), and a constructor for all final fields.

- In practice:
  - You replace dozens of lines of repetitive code with just @Data above your class.

```
@Data
public class User {
    private String name;
    private String email;
}
```
This single annotation gives you all getters, setters, toString(), equals()/hashCode(), and a constructor without writing any of them manually.

## Lombok @NoArgsConstructor

Is a Lombok annotation that automatically generates a no-argument (empty) constructor for a Java class

## @Id 
Is a Spring Data annotation that marks a field as the primary identifier (primary key) for an entity in database operations.

## org.springframework.data.annotation.Transient 
@Transient Is a Spring Data annotation that marks a field as temporary, excluding it from database persistence (saving or reading).

```
public class User {
    @Id
    private String id;
    private String name;
    
    @Transient
    private String temporaryToken; // Not stored in database
}
```

This is the Spring Data equivalent of JPA's @javax.persistence.Transient, but works across various Spring Data modules (MongoDB, Redis, etc.)

Its purpose is to explicitly mark a field that should be excluded from database storage/retrieval, keeping it only in the application's memory during runtime.

## org.springframework.data.Mongodb.core.geo.GeoJsonPoint 

@GeoJsonPoint is a Spring Data MongoDB class that represents a geographic location (longitude and latitude) in GeoJSON format for storing and querying geospatial data in MongoDB.

## org.springframework.data.mongodb.core.index.GeoSpatialIndexType
@GeoSpatialIndexType is an enum in Spring Data MongoDB that specifies the type of geospatial index (such as GEO_2DSPHERE or GEO_2D) to create for efficient location-based queries in MongoDB.

## org.springframework.data.mongodb.core.index.GeoSpatialIndexed 
@GeoSpatialIndexed Is a Spring Data MongoDB annotation that marks a field (like GeoJsonPoint) to have a geospatial database index created, enabling fast location-based queries such as "find near this point" or "within this area".


## org.springframwork.data.mongodb.core.index.Indexed 
@Indexed is a Spring Data MongoDB annotation that marks a field for database indexing, making queries on that field faster while slowing down write operations slightly.

```

public class User {
    @Indexed
    private String email; // Database will index this field
}

```

## org.springframework.data.mongodb.core.mapping.Document

 Is a Spring Data MongoDB annotation that marks a Java class as a persistable entity, mapping it to a MongoDB collection (like @Entity in JPA).



 ## java.validation.constraints.NotBlank

 @NotBls a Java validation constraint that ensures a string field is not null and contains at least one non-whitespace character.

 ##  javax.validation.constraints.NotNull 
 @NotNull  is a Java validation constraint that ensures a field, parameter, or return value is not null (but allows empty strings/collections).

 ## java.time.Instant is
 Instant is a Java class representing a single moment in time (a timestamp) in UTC, with nanosecond precision, independent of time zones or calendars.

 ```
// Represents a specific moment in UTC, like "2024-03-15T14:30:00.123456789Z"
Instant timestamp = Instant.now(); // Gets current UTC timestamp
Instant specificTime = Instant.parse("2024-03-15T10:30:00Z"); // Fixed moment in UTC
```
## java.util.List 
is a Java interface that represents an ordered collection of elements, allowing duplicates, index-based access, and maintaining insertion order.

##  java.util.Map
 Is a Java interface that stores key-value pairs, where each unique key maps to a single value, allowing fast retrieval of values by their associated keys.
