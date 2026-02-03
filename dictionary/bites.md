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
