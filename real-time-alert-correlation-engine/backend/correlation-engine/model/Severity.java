package com.le.correlation.model;

public enum Severity {
    LOW,
    MEDIUM, 
    HIGH,
    CRITICAL;
    
    // DO NOT add compareTo() - it already exists!
    // The built-in compareTo() uses ordinal values:
    // LOW.ordinal() = 0, MEDIUM = 1, HIGH = 2, CRITICAL = 3
    // So: LOW.compareTo(HIGH) returns -2 (0 - 2)
    // And: CRITICAL.compareTo(MEDIUM) returns 2 (3 - 1)
}