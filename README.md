# Rails WP CMS (API + Server-rendered UI)

A production-ready CMS built with Ruby on Rails 8, strictly adhering to the WordPress database schema. It provides REST + GraphQL APIs, JWT authentication, and an optional server-rendered UI while maintaining compatibility with legacy WordPress data.

## Features

- **Legacy Compatibility**: Full ORM mapping of WordPress tables (`wp_posts`, `wp_users`, etc.).
- **REST API v2**: Standardized JSON:API endpoints for Posts, Users, Taxonomies, and Media.
- **GraphQL API**: Flexible query interface using `graphql-ruby`.
- **Server-rendered UI**: Simple HTML pages for browsing posts (CMS-capable mode).
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
    - **Frontend**: `http://localhost:3000/` (posts) and `http://localhost:3000/posts/:id`
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

## From API-only to CMS-capable (Server-rendered UI)

This repo started as an API-only Rails app (`config.api_only = true`) providing REST + GraphQL over a WordPress-compatible MySQL schema. It can be upgraded into a CMS-capable Rails app that serves HTML pages (server-rendered UI) while keeping the API endpoints.

### What changed

#### 1) Enable Rails view stack

- Switched from API-only to full Rails middleware so controllers can render templates, use sessions/cookies, and serve assets:
  - Set `config.api_only = false` in [application.rb](file:///Users/shang/Prj2026/rails-wp/config/application.rb)

#### 2) Add a minimal “standard Rails” frontend stack

- Added gems for a lightweight Rails UI:
  - `propshaft` (asset pipeline)
  - `importmap-rails` (JS without Node bundling)
  - `turbo-rails` (Hotwire navigation)
  - `stimulus-rails` (optional controllers)
  - See [Gemfile](file:///Users/shang/Prj2026/rails-wp/Gemfile)
- Added importmap + JS entrypoint:
  - [importmap.rb](file:///Users/shang/Prj2026/rails-wp/config/importmap.rb)
  - [application.js](file:///Users/shang/Prj2026/rails-wp/app/javascript/application.js)
- Added a minimal stylesheet:
  - [application.css](file:///Users/shang/Prj2026/rails-wp/app/assets/stylesheets/application.css)

#### 3) Add frontend routes and controllers

- Added HTML routes:
  - `root "posts#index"`
  - `resources :posts, only: [:index, :show]`
  - See [routes.rb](file:///Users/shang/Prj2026/rails-wp/config/routes.rb)
- Added a web base controller that uses `ActionController::Base` (important for HTML rendering):
  - [web_controller.rb](file:///Users/shang/Prj2026/rails-wp/app/controllers/web_controller.rb)
- Added a basic Posts controller (frontend):
  - [posts_controller.rb](file:///Users/shang/Prj2026/rails-wp/app/controllers/posts_controller.rb)

#### 4) Add views (layout + posts)

- Added the main HTML layout:
  - [application.html.erb](file:///Users/shang/Prj2026/rails-wp/app/views/layouts/application.html.erb)
- Added pages:
  - [index.html.erb](file:///Users/shang/Prj2026/rails-wp/app/views/posts/index.html.erb) (list recent posts)
  - [show.html.erb](file:///Users/shang/Prj2026/rails-wp/app/views/posts/show.html.erb) (render a single post)

### How it works

- Frontend pages read from the same WordPress-mapped models you already have (e.g. `WpPost`).
- The existing API namespace remains available:
  - `/api/v2/...` continues to serve JSON.
  - `/graphql` continues to serve GraphQL.
- The post show page uses `sanitize(@post.post_content)` to reduce XSS risk when rendering stored HTML.

### Running locally (Docker)

```bash
docker compose build web
docker compose up -d
```

- Frontend:
  - `http://localhost:3000/`
  - `http://localhost:3000/posts/:id`
- API:
  - `http://localhost:3000/api/v2/posts`
  - `http://localhost:3000/graphql` (POST)
  - `http://localhost:3000/api-docs`

### Next steps to make it a “real CMS”

- Add an admin UI (create/edit/publish posts) using server-rendered forms + Turbo.
- Add authorization rules for admin screens (reuse `devise` + existing roles/capabilities).
- Add media upload UI using Active Storage + your existing API patterns.

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
