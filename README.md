# Rails WP Monorepo (API-Only + CMU-UI)

A production-ready Rails codebase built around a WordPress-compatible schema, reorganized into a backend `API-Only` workspace and a frontend `CMU-UI` workspace for clearer ownership and maintainability.

## Features

- **Legacy Compatibility**: Full ORM mapping of WordPress tables (`wp_posts`, `wp_users`, etc.).
- **REST API v2**: Standardized JSON:API endpoints for Posts, Users, Taxonomies, and Media.
- **GraphQL API**: Flexible query interface using `graphql-ruby`.
- **Separated Frontend Workspace**: `CMU-UI` stores frontend pages/components/assets.
- **Authentication**: Secure JWT-based authentication with `devise-jwt`.
- **RBAC**: Role-Based Access Control mirroring WordPress capabilities.
- **Caching**: Redis-based fragment and low-level caching.
- **Documentation**: Integrated Swagger/OpenAPI documentation.

## Prerequisites

- Docker & Docker Compose
- Ruby 3.2+ (if running locally without Docker)

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd rails-wp
    ```

2.  **Start the environment**:
    ```bash
    docker compose build web
    docker compose up -d
    ```

3.  **Setup the database**:
    The database is initialized with the WordPress schema automatically. If needed:
    ```bash
    docker compose exec web bundle exec rails db:migrate
    ```

4.  **Access the application**:
    - **CMU-UI**: `http://localhost:3001/`
    - **API**: `http://localhost:3000/api/v2`
    - **GraphQL**: `http://localhost:3000/graphql` (POST)
    - **Swagger Docs**: `http://localhost:3000/api-docs`

## API Documentation

### REST API
- **Posts**: `GET /api/v2/posts`
- **Users**: `GET /api/v2/users/me`
- **Taxonomies**: `GET /api/v2/taxonomies`
- **Media**: `POST /api/v2/media`

### GraphQL
Query example:
```graphql
query {
  posts(limit: 5) {
    postTitle
    author {
      displayName
    }
  }
}
```

## Repository Architecture

- Backend workspace: [API-Only/README.md](file:///Users/shang/Prj2026/rails-wp/API-Only/README.md)
- Frontend workspace: [CMU-UI/README.md](file:///Users/shang/Prj2026/rails-wp/CMU-UI/README.md)
- Backend runtime config: [application.rb](file:///Users/shang/Prj2026/rails-wp/API-Only/config/application.rb)
- Backend routes: [routes.rb](file:///Users/shang/Prj2026/rails-wp/API-Only/config/routes.rb)

### Separation Rules

- `API-Only` owns REST/GraphQL endpoints, models, services, middleware, and utilities.
- `CMU-UI` owns pages, components, assets, hooks, and state exports.
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
