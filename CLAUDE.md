# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rails WP Monorepo is a production-ready Rails application built around a WordPress-compatible database schema, split into two independent workspaces:

- **backWP**: Rails 8.1.2 API-only backend (REST + GraphQL) running on port 8888
- **frontWP**: Frontend UI assets and pages running on port 8080 via nginx

The architecture enforces clean HTTP boundaries between layers. Backend owns models, services, and endpoints; frontend owns pages, components, and client state.

## Quick Start

### Boot the full stack
```bash
docker compose up --build
```

Access services:
- Frontend: http://localhost:8080
- Backend API: http://localhost:8888
- API docs (Swagger): http://localhost:8888/api-docs
- GraphQL endpoint: POST http://localhost:8888/graphql
- Database admin (phpMyAdmin): http://localhost:8181

### Initialize WordPress (first time only)
Navigate to `http://localhost:8080/admin/setup.html` or POST to `/api/v2/setup` to create the admin user and site options.

## Backend (backWP) Commands

### Setup
```bash
cd backWP
bundle install
```

### Development & Testing
```bash
# Run server (via docker compose is preferred for full stack)
docker compose exec backwp bundle exec rails s -b '0.0.0.0'

# Run all tests
docker compose exec backwp bundle exec rspec

# Run specific test file
docker compose exec backwp bundle exec rspec spec/path/to/spec_file.rb

# Run tests matching pattern
docker compose exec backwp bundle exec rspec spec/ -e "pattern_name"

# Run with coverage
docker compose exec backwp bundle exec rspec --require spec_helper
```

### Code Quality & Security
```bash
# Run RuboCop (Omakase style)
docker compose exec backwp bundle exec rubocop

# Run Brakeman (security audit)
docker compose exec backwp bundle exec brakeman -q

# Audit gems for known vulnerabilities
docker compose exec backwp bundle exec bundler-audit check
```

### API Documentation
```bash
# Regenerate Swagger docs after modifying RSpec request specs
docker compose exec backwp bundle exec rake rswag:specs:swaggerize
```

### Data Management
```bash
# Export posts to JSON
docker compose exec backwp bundle exec rake wordpress:export_posts_json

# Export users to CSV
docker compose exec backwp bundle exec rake wordpress:export_users_csv
```

## Frontend (frontWP) Commands

### Setup
```bash
cd frontWP
npm install
```

### CSS & Styling
```bash
# Build Tailwind CSS (minified)
npm run build:css

# Watch mode during development
npm run watch:css
```

The Tailwind source is at `frontWP/assets/styles/application.css`, compiled to `frontWP/assets/styles/application.tailwind.css`. Tailwind v4 is in use.

## Backend Architecture

### Workspace Structure
- **app/controllers**: REST endpoints organized by API version (v2 namespaced)
- **app/services**: Business logic and workflow orchestration
- **app/models**: WordPress-compatible domain entities
- **app/middleware**: Rack middleware for cross-cutting concerns
- **app/utilities**: Shared helpers (end with `Helper` or `Utility`)
- **app/graphql**: GraphQL schema, types, and resolvers
- **app/serializers**: JSON serialization contracts (JSONAPI format)

### Key Patterns
- **Authentication**: Devise + JWT tokens. Users are `WpUser` model (WordPress-compatible). Login via `POST /api/v2/login`.
- **API Versioning**: Routes namespaced under `api/v2`. Controllers follow the namespace path convention.
- **REST Endpoints**:
  - `POST /api/v2/login` — authenticate and get JWT token
  - `POST /api/v2/register` — create new user
  - `GET /api/v2/users/me` — current user profile
  - `GET /api/v2/posts` — list posts
  - `POST /graphql` — GraphQL queries/mutations
- **Database**: MySQL 2+ (via MariaDB 10.11) with WordPress schema compatibility
- **Caching**: Redis (port 6380 in compose) via `solid_cache` gem

### Naming Conventions
- Files: `snake_case`
- Classes/modules: `PascalCase`
- Service classes end with `Service` suffix
- Database models match WordPress tables

### Testing with RSpec
- Configuration: `.rspec` requires `spec_helper`
- Specs generate Swagger docs via rswag integration
- Use `docker compose exec backwp bundle exec rspec` to run tests

## Frontend Architecture

### Workspace Structure
- **pages**: Route-oriented UI templates (mounted at root)
- **components**: Reusable UI building blocks and layouts
- **hooks**: Client-side behavior modules
- **state**: Centralized state containers and selectors
- **assets**: Static resources (CSS, fonts, images)

### Naming Conventions
- Folders: `kebab-case` or lowercase
- Files: `camelCase` or `kebab-case`
- Exports aggregated through `index.js` files in each directory

### Styling
- **Framework**: Tailwind CSS v4
- **Source**: `assets/styles/application.css`
- **Compiled Output**: `assets/styles/application.tailwind.css` (minified)
- For CSS changes, run `npm run watch:css` during development

## Docker Compose Services

| Service | Port | Purpose |
|---------|------|---------|
| `backwp` | 8888 | Rails API backend |
| `frontwp` | 8080 | nginx serving frontend |
| `db` | 3307 | MariaDB (MySQL-compatible) |
| `redis` | 6380 | Redis cache/session store |
| `phpmyadmin` | 8181 | Database UI (optional) |

Database: `wpress691` (WordPress schema), user: `root`, password: `password`

## Known Limitations

- **Password Hashing**: Legacy WordPress PHPass hashes not supported; new users use Bcrypt (Devise)
- **Database Indexes**: Adding indexes to `post_date` may fail on some MySQL configs due to legacy `0000-00-00` dates
- **Security Scanning**: Brakeman may encounter dependency issues in Docker environment

## Development Workflow

1. Run `docker compose up --build` for full stack
2. Make changes in `backWP` or `frontWP`
3. Backend changes reload automatically (Puma in dev mode)
4. Frontend CSS: run `npm run watch:css` for auto-compilation
5. Run tests frequently: `docker compose exec backwp bundle exec rspec`
6. Check code quality: `rubocop` and `brakeman`
