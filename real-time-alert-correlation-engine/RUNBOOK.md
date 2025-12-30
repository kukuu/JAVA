# COMPLETE RUNNING INSTRUCTIONS

## Prerequisites

```
# Install Required Software
# 1. Node.js 18+ and npm
# 2. Java 17+ and Maven
# 3. Docker and Docker Compose
# 4. Git

# Verify installations
node --version      # Should be 18+
npm --version       # Should be 9+
java --version      # Should be 17+
mvn --version       # Should be 3.6+
docker --version    # Should be 20+
docker-compose --version
git --version
```
Step 1: Clone and Setup Project

```
# Clone the repository
git clone https://github.com/your-org/le-alert-correlation-system.git
cd le-alert-correlation-system

# Create environment files
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Generate security keys
openssl genrsa -out backend/security-keys/jwt-private.key 2048
openssl rsa -in backend/security-keys/jwt-private.key -pubout -out backend/security-keys/jwt-public.key

# Generate SSL certificates for development
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout backend/security-keys/ssl.key \
  -out backend/security-keys/ssl.crt \
  -subj "/C=US/ST=State/L=City/O=LE/CN=localhost"
```

Step 2: Configure Environment Variables

```
# Edit frontend/.env
nano frontend/.env

# Add these values:
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
VITE_APP_VERSION=1.0.0
VITE_APP_TITLE="LE Alert Correlation System"
VITE_ENCRYPTION_KEY=your-secure-encryption-key-32-chars
VITE_SENTRY_DSN=  # Optional for error tracking

# Edit backend/.env
nano backend/.env

# Add these values:
JWT_SECRET=your-jwt-secret-key-256-bit
DB_PASSWORD=secure-postgres-password
MONGO_PASSWORD=secure-mongo-password
REDIS_PASSWORD=secure-redis-password
KAFKA_PASSWORD=secure-kafka-password
VAULT_TOKEN=development-token
ENCRYPTION_KEY=your-backend-encryption-key
```

Step 3: Start Infrastructure with Docker

```

# Navigate to project root
cd le-alert-correlation-system

# Start all infrastructure services
docker-compose up -d

# Verify services are running
docker-compose ps

# Expected output:
# Name                State   Ports
# ---------------------------------------
# mongodb             Up      27017/tcp
# postgres            Up      5432/tcp
# redis               Up      6379/tcp
# zookeeper           Up      2181/tcp
# kafka               Up      9092/tcp, 9093/tcp
# schema-registry     Up      8081/tcp
# prometheus          Up      9090/tcp
# grafana             Up      3001/tcp
# jaeger              Up      16686/tcp, 14250/tcp, 14268/tcp

# Initialize databases
docker-compose exec postgres psql -U le_admin -d le_system -f /docker-entrypoint-initdb.d/init.sql
docker-compose exec mongodb mongosh /docker-entrypoint-initdb.d/init.js

# Create Kafka topics
./kafka-setup/topics-create.sh

# Access monitoring dashboards:
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
# Jaeger: http://localhost:16686

```

Step 4: Build and Run Backend Services

```
# Navigate to backend directory
cd backend

# Build all Java services
mvn clean install -DskipTests

# Or build individual services
mvn clean install -pl common-lib -am
mvn clean install -pl api-gateway -am
mvn clean install -pl alert-service -am
mvn clean install -pl correlation-engine -am
mvn clean install -pl auth-service -am

# Option 1: Run with Spring Boot Maven plugin
# Run API Gateway
cd api-gateway
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Open new terminal, run Alert Service
cd backend/alert-service
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Open new terminal, run Auth Service
cd backend/auth-service
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Open new terminal, run Correlation Engine
cd backend/correlation-engine
mvn quarkus:dev

# Option 2: Run with Docker
# Build Docker images
docker build -t le-api-gateway:latest -f api-gateway/Dockerfile .
docker build -t le-alert-service:latest -f alert-service/Dockerfile .
docker build -t le-correlation-engine:latest -f correlation-engine/Dockerfile .
docker build -t le-auth-service:latest -f auth-service/Dockerfile .

# Run with Docker Compose
cd ..
docker-compose -f docker-compose-backend.yml up -d

# Verify backend services
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}

# Test authentication
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Expected: JWT token response

```

Step 5: Build and Run React Frontend

```
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Install specific versions if needed
npm install react@18.2.0 react-dom@18.2.0
npm install @tanstack/react-query@4.32.6
npm install leaflet@1.9.4 react-leaflet@4.2.1

# Option 1: Development mode with hot reload
npm run dev

# Access at: http://localhost:3000

# Option 2: Production build and serve
npm run build
npm run preview

# Access at: http://localhost:4173

# Option 3: Docker for frontend
docker build -t le-alerts-ui:latest -f Dockerfile.prod .
docker run -p 3000:80 le-alerts-ui:latest

# Access at: http://localhost:3000
```

Step 6: Test the Complete System

```
# Test API endpoints
# 1. Health check
curl http://localhost:8080/actuator/health

# 2. Get alerts (requires authentication)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/v1/alerts

# 3. WebSocket connection test
# Open browser console at http://localhost:3000
# Check WebSocket connection in Network tab

# 4. Simulate data ingestion
# Send test alert to Kafka
./scripts/send-test-alert.sh

# Or use HTTP endpoint
curl -X POST http://localhost:8080/api/v1/alerts/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "TEST",
    "category": "TEST_ALERT",
    "priority": "HIGH",
    "location": {"lat": 40.7128, "lng": -74.0060}
  }'

# 5. Check correlation engine output
# View logs: docker-compose logs correlation-engine
# Or check MongoDB: 
docker-compose exec mongodb mongosh le_alerts --eval "db.incidents.find().pretty()"

```

Step 7: Development Workflow

```
# 1. Start all services in development mode
# Terminal 1: Infrastructure
docker-compose up -d

# Terminal 2: Backend services
cd backend
./scripts/start-dev.sh

# Terminal 3: Frontend
cd frontend
npm run dev

# 2. Running tests
# Frontend tests
cd frontend
npm run test            # Unit tests
npm run test:coverage   # Coverage report
npm run test:e2e       # End-to-end tests

# Backend tests
cd backend
mvn test               # All tests
mvn test -pl alert-service  # Specific service

# 3. Code quality checks
cd frontend
npm run lint
npm run type-check
npm run format

cd backend
mvn spotless:check    # Code formatting
mvn pmd:check         # Static analysis
mvn spotbugs:check    # Bug patterns

# 4. Security scanning
npm run security:scan
mvn dependency-check:check

# 5. Build for production
cd frontend
npm run build:prod

cd backend
mvn clean package -Pprod
```

Step 8: Deployment Commands

```
# Deploy to Kubernetes (if configured)
./scripts/deploy-k8s.sh

# Deploy to AWS
./scripts/deploy-aws.sh --env production

# Deploy with Terraform
cd infrastructure/terraform
terraform init
terraform plan
terraform apply -auto-approve

# Backup and restore
./scripts/backup.sh
./scripts/restore.sh backup-2024-01-15.tar.gz

```

## Quick Start Script

- Create a start-all.sh script:

```

#!/bin/bash
# start-all.sh
echo "Starting LE Alert Correlation System..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Step 1: Starting infrastructure...${NC}"
docker-compose up -d --wait

echo -e "${GREEN}Step 2: Building backend services...${NC}"
cd backend
mvn clean install -DskipTests
cd ..

echo -e "${GREEN}Step 3: Starting backend services...${NC}"
cd backend
./scripts/start-dev.sh &
BACKEND_PID=$!
cd ..

echo -e "${GREEN}Step 4: Installing frontend dependencies...${NC}"
cd frontend
npm install

echo -e "${GREEN}Step 5: Starting React development server...${NC}"
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}✓ System starting up...${NC}"
echo -e "Access points:"
echo -e "  Frontend:    ${GREEN}http://localhost:3000${NC}"
echo -e "  API Gateway: ${GREEN}http://localhost:8080${NC}"
echo -e "  Grafana:     ${GREEN}http://localhost:3001${NC}"
echo -e "  Prometheus:  ${GREEN}http://localhost:9090${NC}"
echo -e ""
echo -e "Default credentials:"
echo -e "  Username: admin"
echo -e "  Password: admin123"
echo -e ""
echo -e "Press Ctrl+C to stop all services"

# Wait for termination
trap "kill $BACKEND_PID $FRONTEND_PID; docker-compose down; exit" INT TERM
wait

```
- Make it executable and run:

```

chmod +x start-all.sh
./start-all.sh

```

## Troubleshooting Guide

```
# 1. Port conflicts
lsof -i :3000  # Check what's using port 3000
kill -9 <PID>  # Kill process

# 2. Database connection issues
docker-compose logs postgres
docker-compose exec postgres pg_isready

# 3. Kafka issues
docker-compose logs kafka
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# 4. React build issues
rm -rf frontend/node_modules frontend/package-lock.json
npm cache clean --force
npm install

# 5. Java build issues
mvn clean
rm -rf ~/.m2/repository/com/le
mvn install -U

# 6. Memory issues (increase heap)
export MAVEN_OPTS="-Xmx2G -XX:MaxPermSize=512M"
export NODE_OPTIONS="--max-old-space-size=4096"

# 7. Reset everything
docker-compose down -v
rm -rf backend/target frontend/dist

```

## Useful Development URLs

```
Local Development:
- React App: http://localhost:3000
- API Gateway: http://localhost:8080
- API Documentation: http://localhost:8080/swagger-ui.html
- GraphQL Playground: http://localhost:8080/graphiql
- Eureka Dashboard: http://localhost:8761
- Config Server: http://localhost:8888
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)
- Jaeger Tracing: http://localhost:16686
- Kafka UI: http://localhost:8082 (if Kafdrop running)
- MongoDB Express: http://localhost:8083
- PGAdmin: http://localhost:5050 (admin@admin.com/admin)

Production URLs (example):
- Application: https://alerts.le.example.com
- API: https://api.le.example.com
- Monitoring: https://monitor.le.example.com
- Documentation: https://docs.le.example.com

```

## Security Setup Commands


```
# Generate SSL certificates for production
openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt \
  -subj "/C=US/ST=State/L=City/O=LE/CN=alerts.le.example.com"

# Set up Vault for secrets management
docker run -d --name vault -p 8200:8200 vault:latest
export VAULT_ADDR='http://localhost:8200'
vault operator init
vault login
vault secrets enable -path=secret kv-v2

# Store secrets
vault kv put secret/le-alerts/production \
  jwt_secret="your-jwt-secret" \
  db_password="secure-password" \
  encryption_key="your-encryption-key"

# Configure HashiCorp Vault Agent
# See infrastructure/vault/ for configuration
```

## Performance Testing

```
# Load test with k6
k6 run scripts/load-test.js

# Stress test API
artillery run scripts/stress-test.yml

# Monitor performance
docker-compose logs -f --tail=100 alert-service
```

## React Frontend Startup Methods

Method 1: Standard React Development Server

```
# In the frontend directory, you have multiple options:

# Option A: Using Vite (Modern, Fast) - RECOMMENDED
cd frontend
npm run dev
# Access at: http://localhost:3000

# Option B: If using Create React App (Traditional)
cd frontend
npm start
# Access at: http://localhost:3000

# Option C: Production preview
cd frontend
npm run build
npm run preview
# Access at: http://localhost:4173
```

### Complete Step-by-Step Running Instructions

Step 1: Navigate to Correct Directory

```
# Assuming you're in the project root
pwd
# Should show: /path/to/le-alert-correlation-system

# Navigate to frontend
cd frontend

# List files to verify
ls -la
# Should show: package.json, src/, public/, vite.config.ts, etc.
```

Step 2: Install Dependencies (First Time Only)

```
# Install all dependencies
npm install

# Or if you want specific versions
npm ci  # Clean install from package-lock.json
```

Step 3: Configure Environment

```
# Copy example environment file
cp .env.example .env

# Edit the .env file with your settings
nano .env

# Add these minimum configurations:
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
VITE_APP_TITLE="LE Alert System"
```

Step 4: Start React Frontend

```
# Start the React development server
npm run dev

# OR (since we defined "start" script)
npm start

# Expected output:
# ➜  Local:   http://localhost:3000/
# ➜  Network: http://192.168.1.100:3000/
# ➜  press h to show help

# Open browser to: http://localhost:3000
```

- Option B: With Backend Services

```
# Terminal 1: Start infrastructure (Kafka, MongoDB, etc.)
cd ..  # Go to project root
docker-compose up -d

# Terminal 2: Start Java backend services
cd backend
./scripts/start-backend.sh

# Terminal 3: Start React frontend
cd ../frontend
npm start  # or npm run dev

# Open browser to: http://localhost:3000

```

- Option C: Using the start-all.sh Script

```

# Make the script executable
chmod +x start-all.sh

# Run the complete system
./start-all.sh

# This script will:
# 1. Start Docker infrastructure
# 2. Build and start Java backend
# 3. Install frontend dependencies
# 4. Start React frontend with npm run dev

```

Step 5: Verify Frontend is Running

```

# Check if React is running
curl http://localhost:3000

# Check running processes
ps aux | grep -i "node.*react"

# Check logs in the terminal where you ran npm start
# You should see:
# ✓ Built in 1.23s
# ➜  Local:   http://localhost:3000/

```

## Common Issues and Solutions

- Issue 1: Port 3000 already in use

```

# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
# Edit package.json scripts:
# "start": "vite --port 3001"

```

- Issue 2: Node modules missing/corrupt

```
# Clean install
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

- Issue 3: TypeScript errors

```
# Check TypeScript compilation
npx tsc --noEmit

# Or run the type check script
npm run type-check
```

## Development Workflow Example

### Running the system:
```
# Open 3 terminal windows

# TERMINAL 1: Infrastructure
cd le-alert-correlation-system
docker-compose up -d

# TERMINAL 2: Backend services
cd le-alert-correlation-system/backend
./scripts/start-dev.sh
# Wait for: "Started AlertApplication in X seconds"

# TERMINAL 3: React frontend
cd le-alert-correlation-system/frontend
npm start
# Wait for: "Local: http://localhost:3000"

# Now open browser to http://localhost:3000
# Login with: admin / admin123

```

### Production Deployment

```
# Build the React app
cd frontend
npm run build:prod

# The build output will be in: frontend/dist/

# To serve the built files locally:
npm install -g serve
serve -s dist -p 3000

# Or use the preview command:
npm run preview
# Access at: http://localhost:4173

```

### React Development Tips

```
# Hot Module Replacement is enabled by default
# Changes to your code will auto-refresh in browser

# Open React DevTools in browser (F12 -> Components/Profiler)

# Environment variables in React code:
console.log(import.meta.env.VITE_API_URL)

# To add new dependencies:
npm install <package-name> --save

# To update dependencies:
npm update

```

### Testing the Frontend

```
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests (requires backend running)
npm run test:e2e

# Generate test coverage report
npm run test:coverage
# Open: frontend/coverage/index.html
```

### Debugging React

```
# Add debugger statements in code
debugger;

# Use React DevTools browser extension

# Check console for errors

# Use network tab to see API requests

# To debug build issues:
npm run build -- --debug

# To analyze bundle size:
npm run build -- --report
```

### Quick Reference Card

```

# FRONTEND COMMANDS (run in frontend/ directory)
npm install          # Install dependencies
npm start           # Start development server
npm run dev         # Same as npm start
npm run build       # Build for production
npm run preview     # Preview production build
npm test           # Run tests
npm run lint       # Check code quality

# BACKEND COMMANDS (run in backend/ directory)
mvn clean install  # Build all services
mvn spring-boot:run # Run Spring Boot app
./scripts/start-dev.sh # Start all backend services

# INFRASTRUCTURE (run in project root)
docker-compose up -d  # Start databases, Kafka, etc.
docker-compose down   # Stop infrastructure

# COMPLETE SYSTEM
./start-all.sh        # Start everything (frontend + backend + infra)

```

### Vite Configuration for React (vite.config.ts)

```

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    open: true,  // Auto-open browser
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

```