# Phase 1 Documentation: Foundation & Environment

## Overview
Phase 1 focused on initializing the Rails 8 project and establishing a robust Docker-based development environment that mirrors the production setup, with a specific focus on compatibility with the legacy WordPress database schema.

## 1. Project Initialization
- **Framework**: Rails 8.1.2 (API Mode).
- **Ruby Version**: 3.2.10.
- **Database**: MySQL 8.0 (Chosen for strict compatibility with WordPress).
- **Caching**: Redis 7.0.

## 2. Infrastructure (Docker)
We containerized the entire application stack using Docker Compose to ensure consistency across development and production.

- **`Dockerfile`**:
  - Based on `ruby:3.2.10-slim`.
  - Multi-stage build for optimized image size.
  - Installs system dependencies: `default-libmysqlclient-dev`, `build-essential`, `git`.
  - Configured for production-ready assets (although API-only, some assets/assets pipeline concepts remain relevant for admin UIs if added later).

- **`docker-compose.yml`**:
  - **Services**:
    - `web`: The Rails API server (Puma).
    - `db`: MySQL 8.0 container.
    - `redis`: Redis 7.0 container for caching and Sidekiq (future use).
  - **Volumes**: Persists MySQL data to `db_data` and Redis data to `redis_data`.
  - **Networking**: All services share a `default` bridge network.

## 3. Database Configuration
The core challenge was integrating a modern Rails application with a legacy WordPress schema.

- **`config/database.yml`**:
  - Configured to use `mysql2` adapter.
  - Sets collation to `utf8mb4_unicode_ci` to match WordPress standards.
  - **Strict Mode**: We had to be mindful of MySQL strict mode settings, as legacy WP dates (e.g., `0000-00-00`) can conflict with `NO_ZERO_DATE`.

- **Schema Import**:
  - We imported the provided SQL dump `WordPressInitDBv.6.9.1.sql` into the Docker MySQL container.
  - This established the standard WordPress tables: `wp_posts`, `wp_users`, `wp_options`, etc.

## 4. Verification
- Successfully booted the Rails app via `docker compose up`.
- Verified database connectivity by inspecting `ActiveRecord::Base.connection.tables` in the Rails console, confirming the presence of all `wp_*` tables.
- Confirmed Redis connectivity for caching.

## 5. Next Steps
- Proceed to Phase 2: Mapping these raw SQL tables to ActiveRecord models.
