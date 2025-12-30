# Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     REACT Frontend (TLS 1.3+)                    │
│  (OAuth2/OpenID Connect, RBAC, Audit Logging, Secure Headers)   │
└──────────────────────────────┬──────────────────────────────────┘
                                │ HTTPS/WSS
┌──────────────────────────────▼──────────────────────────────────┐
│               API Gateway (Spring Cloud Gateway)                │
│     (Rate Limiting, JWT Validation, CORS, Request Tracing)      │
└──────────────────────────────┬──────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
┌────────▼────────┐    ┌────────▼────────┐    ┌───────▼───────┐
│  Alert Service  │    │ Correlation     │    │ Geospatial   │
│  (Spring Boot)  │    │ Engine (Quarkus)│    │ Service      │
│                 │    │                 │    │ (Spring Boot)│
└────────┬────────┘    └────────┬────────┘    └───────┬───────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                   ┌────────────▼────────────┐
                   │   Kafka Cluster (TLS)   │
                   │   (Schema Registry,     │
                   │    ACLs, Encryption)    │
                   └────────────┬────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
┌────────▼────────┐    ┌────────▼────────┐    ┌───────▼───────┐
│ 911 Call        │    │ Social Media    │    │ Sensor        │
│ Ingestor        │    │ Ingestor        │    │ Ingestor      │
│ (Spring Cloud   │    │ (Quarkus)       │    │ (Spring Boot) │
│  Stream)        │    │                 │    │               │
└─────────────────┘    └─────────────────┘    └───────────────┘
```
