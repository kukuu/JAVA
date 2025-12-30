# Directory Structure

```
real-time-alert-engine/
├── .github/
│   └── workflows/
│       ├── security-scan.yml
│       ├── compliance-check.yml
│       └── deployment.yml
├── config/
│   ├── kubernetes/
│   │   ├── namespaces/
│   │   ├── network-policies/
│   │   ├── psp/
│   │   └── istio/
│   └── vault/
│       └── policies/
├── docs/
│   ├── compliance/
│   ├── architecture/
│   └── operational-runbooks/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── alerts/
│   │   │   ├── dashboard/
│   │   │   ├── map/
│   │   │   └── admin/
│   │   ├── contexts/
│   │   │   ├── auth/
│   │   │   └── audit/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   └── types/
│   ├── public/
│   └── tests/
├── backend/
│   ├── alert-service/
│   ├── correlation-engine/
│   ├── geospatial-service/
│   ├── ingestors/
│   │   ├── 911-ingestor/
│   │   ├── social-media-ingestor/
│   │   └── sensor-ingestor/
│   └── common/
│       ├── security-core/
│       ├── data-models/
│       └── audit-lib/
├── infrastructure/
│   ├── terraform/
│   ├── ansible/
│   └── monitoring/
└── scripts/
    ├── security/
    └── compliance/
```
