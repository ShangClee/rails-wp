# Rails WP Monorepo (backWP + frontWP)

A production-ready Rails codebase built around a WordPress-compatible schema, reorganized into a backend `backWP` workspace and a frontend `frontWP` workspace for clearer ownership and maintainability.

## Structure

- **Separated Backend Workspace**: `backWP` contains the Rails API-only application.
- **Separated Frontend Workspace**: `frontWP` stores frontend pages/components/assets.
- **Root-Level Docker Orchestration**: `docker-compose.yml` manages both services plus `db`, `redis`, and `phpmyadmin`.

## Quick Start

### 1. Boot Everything
```bash
docker compose up --build
```

### 2. Access Services
- **Frontend (frontWP)**: `http://localhost:8080/`
- **Backend API (backWP)**: `http://localhost:8888/`
- **Database Admin (phpMyAdmin)**: `http://localhost:8181/`

## Workspaces

- Backend workspace: [backWP/README.md](file:///Users/shang/Prj2026/rails-wp/backWP/README.md)
- Frontend workspace: [frontWP/README.md](file:///Users/shang/Prj2026/rails-wp/frontWP/README.md)

## Key Files

- Backend runtime config: [application.rb](file:///Users/shang/Prj2026/rails-wp/backWP/config/application.rb)
- Backend routes: [routes.rb](file:///Users/shang/Prj2026/rails-wp/backWP/config/routes.rb)
- Docker orchestration: [docker-compose.yml](file:///Users/shang/Prj2026/rails-wp/docker-compose.yml)

## Responsibility

- `backWP` owns REST/GraphQL endpoints, models, services, middleware, and utilities.
- `frontWP` owns pages, components, assets, hooks, and state exports.
- Cross-folder coupling is minimized through HTTP boundaries (`/api/v2`, `/graphql`).

## Management Tasks

### Data Export
Export posts to JSON:
```bash
docker compose exec web bundle exec rake wordpress:export_posts_json
```

Export users to CSV:
```bash
docker compose exec web bundle exec rake wordpress:export_users_csv
```

### Swagger Generation
Regenerate Swagger docs after modifying specs:
```bash
docker compose exec web bundle exec rake rswag:specs:swaggerize
```

## Known Issues & Limitations

- **Database Indexes**: Adding indexes to `post_date` may fail on some MySQL configurations due to legacy `0000-00-00` dates.
- **Security Audit**: Brakeman scan may encounter dependency issues in the Docker environment.
- **Passwords**: Legacy WordPress password hashes (PHPass) are not currently supported for login; new users use Devise's Bcrypt.

## License
MIT
