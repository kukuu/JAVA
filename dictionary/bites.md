- **@JsonIgnore**: Is a Jackson annotation used to exclude a property from JSON serialization and deserialization.

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


