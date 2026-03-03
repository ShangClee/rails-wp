# Phase 8 Documentation: Deployment & Infrastructure

## Overview
Phase 8 focused on preparing the application for production deployment, including Docker optimization, Nginx reverse proxy configuration, CI/CD pipeline setup, and robust health checks.

## 1. Production Docker Setup
- **`docker-compose.prod.yml`**:
  - Uses the production-optimized Docker image built from the `Dockerfile`.
  - Runs services with `restart: always`.
  - Uses environment variables for secrets (`SECRET_KEY_BASE`, `DEVISE_JWT_SECRET_KEY`, `MYSQL_ROOT_PASSWORD`).
  - Includes an Nginx service as a reverse proxy.

## 2. Nginx Configuration
- **`nginx.conf`**:
  - Acts as a reverse proxy listening on port 80.
  - Forwards requests to the `web` service (Rails/Puma).
  - Sets standard proxy headers (`X-Forwarded-For`, `X-Real-IP`, `Host`).
  - Ready for SSL termination (certbot/Let's Encrypt integration).

## 3. CI/CD Pipeline (GitHub Actions)
- **`.github/workflows/ci.yml`**:
  - Triggers on push/PR to `main`.
  - **Test Job**:
    - Spins up MySQL 8.0 and Redis 7.0 services.
    - Installs Ruby 3.2.10 and dependencies.
    - Loads the database schema.
    - Runs RSpec tests (`bundle exec rspec`).
  - **Lint Job**:
    - Runs `bundle exec rubocop` to ensure code quality.

## 4. Health Checks
- **Controller**: `app/controllers/rails/health_controller.rb`
- **Route**: `GET /up` (and `/rails/health`)
- **Checks**:
  - **Database**: Executes `SELECT 1`.
  - **Redis**: Reads a cache key.
- **Response**:
  - Success: `200 OK` with `{"status": "up", "timestamp": "..."}`.
  - Failure: `503 Service Unavailable` with error details.

## 5. Deployment Instructions
1.  **Build and Start**:
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```
2.  **Verify**:
    ```bash
    curl http://localhost/up
    ```
    Should return `{"status": "up", ...}`.

## 6. Next Steps
- **SSL**: Add Let's Encrypt via Certbot in the Nginx container.
- **Monitoring**: Integrate Prometheus/Grafana using the `/up` endpoint or a dedicated exporter.
