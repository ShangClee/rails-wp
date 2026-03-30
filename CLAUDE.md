# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rails WP Monorepo is a **complete WordPress-compatible CMS** built with Rails 8.1.2, featuring a REST/GraphQL API backend, a vanilla-JS admin panel, and a public-facing web frontend. The application is organized into two independent workspaces:

- **backWP**: Rails 8.1.2 backend with REST API (`/api/v2/*`), GraphQL endpoint, and public web pages
  - 21+ REST endpoints for CRUD operations
  - GraphQL queries and mutations for posts, users, categories, tags
  - Public frontend at port 8888 (posts, pages, comments)
  - Admin setup wizard at `POST /api/v2/setup`

- **frontWP**: Frontend assets split into two parts:
  - **adminWP/** — Vanilla JS SPA admin console (9 modules) at http://localhost:8080/admin/
  - **pages/**, **components/** — Tailwind-styled ERB templates (served by Rails backend)

The architecture enforces clean separation: Backend owns models, services, and endpoints; frontend owns UI and client state. WordPress schema compatibility maintained throughout.

## Quick Start

### Boot the full stack
```bash
docker compose up --build
```

### Access Services
**Public CMS:**
- Public frontend: http://localhost:8888 (posts listing)
- Single post: http://localhost:8888/posts/:id
- Pages: http://localhost:8888/:slug (e.g., `/about`)

**Admin Panel:**
- Admin console: http://localhost:8080/admin/
- Admin setup wizard: http://localhost:8080/admin/setup.html

**APIs & Tools:**
- Backend API base: http://localhost:8888/api/v2
- GraphQL endpoint: `POST http://localhost:8888/graphql`
- Swagger docs: http://localhost:8888/api-docs
- phpMyAdmin: http://localhost:8181 (user: `root`, password: `password`)

### First-Time Setup
1. Wait for all containers to start: `docker compose up --build`
2. Visit **http://localhost:8080/admin/setup.html** (nginx serves this static page)
3. Fill the setup form:
   - Site Title, Admin Email, Admin Username, Password
   - Site URL: `http://localhost:8888` (the Rails backend)
4. Click "Complete Setup"
5. You'll be redirected to admin panel: **http://localhost:8080/adminWP/**
6. Create posts/pages via UI or API, view public site at **http://localhost:8888**

**Note**: The setup wizard calls `POST /api/v2/setup` on the Rails backend to initialize WordPress.

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

### Frontend Type Generation
```bash
# Regenerate JSDoc typedefs from GraphQL schema (run after schema changes)
# From project root (host machine, not Docker):
JSDOC_OUTPUT=frontWP/jsdoc/types.js docker compose exec -e JSDOC_OUTPUT=/rails/../../frontWP/jsdoc/types.js backwp bundle exec rake jsdoc:generate

# Or simpler: write to stdout and redirect
docker compose exec backwp bundle exec rake jsdoc:generate JSDOC_OUTPUT=/rails/tmp/types.js \
  && docker compose cp backwp:/rails/tmp/types.js frontWP/jsdoc/types.js
```

The generated file is at `frontWP/jsdoc/types.js`. Modules opt in by adding:
```javascript
// @ts-check
/// <reference path="../../../../jsdoc/types.js" />
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
- **app/controllers**:
  - `api/v2/*_controller.rb` — REST API endpoints (posts, pages, comments, media, taxonomies, categories, tags, menus, settings, users, health)
  - `posts_controller.rb`, `pages_controller.rb` — Public frontend controllers (non-namespaced)
  - `graphql_controller.rb` — GraphQL query/mutation execution
- **app/services**: Business logic orchestration
  - `PostService` — create/update/destroy posts with authorization
  - `CreateCommentService` — post comments with validation and count incrementing
  - `MenuItemService` — manage nav menu items and relationships
  - `UserRoleService` — assign user roles via PHP-serialized `wp_capabilities`
- **app/models**: WordPress-compatible domain entities (WpPost, WpUser, WpComment, WpTerm, WpTermTaxonomy, WpOption, etc.)
- **app/middleware**: Rack middleware for cross-cutting concerns
- **app/utilities**: Shared helpers
  - `SettingsUtility` — read/write whitelisted wp_options
- **app/graphql**: GraphQL schema, types, and resolvers
  - `mutations/create_post.rb`, `mutations/update_post.rb`, `mutations/delete_post.rb`
  - `types/query_type.rb` — posts, pages, users, categories, tags queries
  - `types/mutation_type.rb` — post mutations
- **app/serializers**: JSONAPI serialization contracts
  - `WpPostSerializer`, `WpUserSerializer`, `WpCommentSerializer`, `WpMenuSerializer`, `WpTermTaxonomySerializer`
- **app/views**: ERB templates for public frontend
  - `layouts/application.html.erb` — Tailwind navbar + footer layout
  - `posts/index.html.erb`, `posts/show.html.erb` — Post listing & detail with comments
  - `pages/show.html.erb` — Static page display

### Key Patterns
- **Authentication**: Devise + JWT. Users are `WpUser` (WordPress-compatible). Login via `POST /api/v2/login` or registration at `POST /api/v2/register`. Get current user: `GET /api/v2/users/me`.
- **API Versioning**: All API routes namespaced under `api/v2`. Controllers follow the namespace path convention.
- **Authorization**: Role-based (administrator, editor, author, contributor, subscriber) via `WpAuthenticatable` concern. Predicate methods: `admin?`, `editor?`, `author?`, `contributor?`, `subscriber?`.
- **Serialization**: All API responses use JSONAPI format via `jsonapi-serializer` gem.
- **Services Layer**: Non-trivial logic extracted to service objects (`PostService`, `CreateCommentService`, `MenuItemService`, `UserRoleService`). Thin controllers delegate to services.
- **Database**: MariaDB 10.11 (MySQL-compatible) with exact WordPress schema. No migrations—bootstrapped from `WordPressInitDBv.6.9.1.sql`.
- **Caching**: Redis (port 6380 in compose) via `solid_cache` gem. Post listings cached 12 hours by default.
- **GraphQL**: Full queries and mutations support via `graphql-ruby` gem. Authenticated context passes `current_user`.

### REST API Endpoints

**Posts** (`/api/v2/posts`)
- `GET /api/v2/posts` — List published posts (paginated, cached 12h)
- `POST /api/v2/posts` — Create post (admin/editor/author only)
- `GET /api/v2/posts/:id` — Get single post
- `PATCH /api/v2/posts/:id` — Update post (owner/editor/admin only)
- `DELETE /api/v2/posts/:id` — Delete post (owner/editor/admin only)

**Pages** (`/api/v2/pages`)
- Same CRUD pattern as posts, scoped to `post_type = 'page'`

**Comments** (`/api/v2/comments`)
- `GET /api/v2/comments` — List comments (filter by `?post_id=`, `?approved=true`)
- `POST /api/v2/comments` — Create comment (anyone, auto-approve if logged-in)
- `GET /api/v2/comments/:id` — Get single comment
- `PATCH /api/v2/comments/:id` — Update (author/editor/admin only)
- `DELETE /api/v2/comments/:id` — Delete (editor/admin only)

**Media** (`/api/v2/media`)
- `GET /api/v2/media` — List attachments
- `POST /api/v2/media` — Upload file (multipart/form-data)
- `DELETE /api/v2/media/:id` — Delete attachment

**Taxonomies** (`/api/v2/categories`, `/api/v2/tags`, `/api/v2/taxonomies`)
- Standard CRUD for categories and tags
- `TaxonomiesController` handles all taxonomy types via `?type=` param

**Menus** (`/api/v2/menus`)
- `GET /api/v2/menus` — List all menus
- `POST /api/v2/menus` — Create menu
- `GET /api/v2/menus/:id` — Get menu with items
- `PATCH /api/v2/menus/:id` — Update menu
- `DELETE /api/v2/menus/:id` — Delete menu
- `POST /api/v2/menus/:id/items` — Add item to menu
- `PATCH /api/v2/menus/:id/items/:item_id` — Update item
- `DELETE /api/v2/menus/:id/items/:item_id` — Delete item

**Users** (`/api/v2/users`)
- `GET /api/v2/users` — List users (admin only)
- `GET /api/v2/users/me` — Current user profile
- `GET /api/v2/users/:id` — Get user (auth required)
- `PATCH /api/v2/users/:id` — Update user (owner/admin)
- `PATCH /api/v2/users/:id/role` — Change user role (admin only)

**Settings** (`/api/v2/settings`)
- `GET /api/v2/settings` — Get whitelisted site options (admin only)
- `PATCH /api/v2/settings` — Update settings (admin only)
- Whitelisted keys: `blogname`, `blogdescription`, `siteurl`, `home`, `admin_email`, `timezone_string`, `date_format`, `time_format`, `posts_per_page`, `default_comment_status`

**Health** (`/api/v2/health`)
- `GET /api/v2/health` — System health: DB/Redis status, content counts (auth required)

**Auth** (`/api/v2/*` via Devise)
- `POST /api/v2/login` — Authenticate and get JWT token
- `POST /api/v2/register` — Create new user account
- `DELETE /api/v2/logout` — Logout (revokes token, if implemented)

**Setup** (`/api/v2/setup`)
- `GET /api/v2/setup` — Check if WordPress is installed
- `POST /api/v2/setup` — First-time installation (creates admin user, sets options)

### GraphQL Endpoint

`POST /graphql` — Execute GraphQL queries and mutations

**Queries:**
```graphql
query {
  posts(limit: 10, offset: 0) { id title content status }
  post(id: 1) { id title content author { id name } }
  pages { id title }
  users { id username email roles }
  categories { id name slug count }
  tags { id name slug count }
  viewer { id email roles }
}
```

**Mutations:**
```graphql
mutation {
  createPost(title: "...", content: "...", status: "draft") {
    post { id title }
    errors
  }
  updatePost(id: 1, title: "...") { post { id } errors }
  deletePost(id: 1) { success errors }
}
```

### Naming Conventions
- Files: `snake_case`
- Classes/modules: `PascalCase`
- Service classes end with `Service` suffix (e.g., `PostService`)
- Utility modules end with `Utility` or `Helper` (e.g., `SettingsUtility`)
- Database models match WordPress tables exactly

### Testing with RSpec
- Configuration: `.rspec` requires `spec_helper`
- Specs generate Swagger docs via rswag integration
- Use `docker compose exec backwp bundle exec rspec` to run tests

## Frontend Architecture

The frontend is split into two parts:

### Admin Panel (Vanilla JS SPA)
**Location**: `frontWP/adminWP/`

Standalone single-page application with hash-based routing. No framework dependencies—pure vanilla JavaScript + HTML/CSS.

**Entry point**: `frontWP/adminWP/index.htm`

**Core Shell** (`shared/js/admin-shell.js`):
- Hash routing: `#cms/posts`, `#system/users`, etc.
- JWT authentication: reads token from `localStorage`, attaches to API requests
- Module loader: dynamically imports page modules
- Skeleton loader, toast notifications, utility functions

**CMS Modules** (9 fully implemented):
| Module | Route | Features |
|--------|-------|----------|
| `cms-posts.js` | `#cms/posts` | Post CRUD with modals, real API calls |
| `cms-pages.js` | `#cms/pages` | Page CRUD + parent dropdown |
| `cms-media.js` | `#cms/media` | File upload grid, multipart form |
| `cms-menus.js` | `#cms/menus` | Menu builder, drag-to-reorder items |
| `system-users.js` | `#system/users` | User list, role change dropdown |
| `system-roles.js` | `#system/roles` | Live role counts, descriptions |
| `system-tokens.js` | `#system/tokens` | Decoded JWT claims, expiry info |
| `system-health.js` | `#system/health` | DB/Redis/content stats |
| `system-settings.js` | `#system/settings` | Load/save site options |

**Shared Utilities** (`shared/js/api-helpers.js`):
- `parseJsonapi()` — Flatten JSONAPI envelope to flat objects
- `renderModal()` — Create modal overlays with forms
- `confirmDelete()` — Confirmation dialogs

### Public Frontend (ERB Templates)
**Location**: Served by Rails backend at port 8888

**Controllers**:
- `PostsController` — `GET /`, `GET /posts/:id`
- `PagesController` — `GET /:slug`

**Views**:
- `layouts/application.html.erb` — Tailwind navbar/footer shell
- `posts/index.html.erb` — Posts listing (truncated excerpts)
- `posts/show.html.erb` — Single post + approved comments + comment form (vanilla JS)
- `pages/show.html.erb` — Static page display

**Features**:
- Comments display (approved only)
- Comment submission form (vanilla JS POST to `/api/v2/comments`)
- Auto-approval for logged-in users, pending for guests
- Tailwind CSS styling (v4)

### Workspace Structure
- **adminWP/** — Admin SPA
  - `index.htm` — Main shell with CSS variables + layout
  - `shared/js/admin-shell.js` — Core router + auth + module loader
  - `shared/js/api-helpers.js` — JSONAPI parser, modal, confirm helpers
  - `shared/js/modules/` — 9 CMS modules (cms-posts, cms-pages, cms-media, cms-menus, system-users, system-roles, system-tokens, system-health, system-settings)
- **pages/** — Public frontend registry (for Rails routing)
  - `posts/index.html.erb`, `posts/show.html.erb` → moved to backWP
  - `pages/show.html.erb` → moved to backWP
- **components/** — Reusable ERB components (currently empty)
- **hooks/** — Client-side behavior modules (currently empty)
- **state/** — Centralized state (currently empty)
- **assets/** — Static resources
  - `styles/application.css` — Tailwind source
  - `styles/application.tailwind.css` — Compiled (minified)
  - `javascript/application.js` — Entry point

### Naming Conventions
- Folders: `kebab-case` or lowercase
- Files: `camelCase` or `kebab-case`
- Module exports: `export default async function moduleName(content, shell) { ... }`
- Window globals: `window.moduleName_functionName` (for event handlers)

### Styling
- **Framework**: Tailwind CSS v4
- **Source**: `assets/styles/application.css`
- **Compiled Output**: `assets/styles/application.tailwind.css` (minified)
- **Build Commands**:
  - Build once: `npm run build:css`
  - Watch mode: `npm run watch:css`
- **Admin Panel**: Inline CSS in `index.htm` (CSS variables for theming)

## Docker Compose Services

| Service | Port | Purpose |
|---------|------|---------|
| `backwp` | 8888 | Rails API backend |
| `frontwp` | 8080 | nginx serving frontend |
| `db` | 3307 | MariaDB (MySQL-compatible) |
| `redis` | 6380 | Redis cache/session store |
| `phpmyadmin` | 8181 | Database UI (optional) |

Database: `wpress691` (WordPress schema), user: `root`, password: `password`

## CMS Features & Capabilities

### Content Management
- ✅ **Posts** — Full CRUD, status control (draft/published), categories, tags, author assignment
- ✅ **Pages** — Static pages with hierarchy (parent/child), slug-based URLs
- ✅ **Comments** — Post comments with approval workflow, auto-approve for logged-in users, email notifications pending
- ✅ **Media** — File upload, media library, attachment management (ActiveStorage ready)
- ✅ **Menus** — Navigation menu builder, drag-to-reorder items, menu assignments

### User & Role Management
- ✅ **5 Roles** — Administrator, Editor, Author, Contributor, Subscriber
- ✅ **Permissions** — WordPress-compatible capability system via `wp_capabilities` usermeta
- ✅ **User Profiles** — Display name, email, URL, registration date
- ✅ **JWT Auth** — Stateless authentication via bearer tokens
- ✅ **Registration** — Self-signup with default role assignment

### Admin Panel Features
- ✅ **Dashboard** — System health, content stats, DB/Redis status
- ✅ **Settings** — Site name, tagline, URL, email, timezone, per-page defaults
- ✅ **Roles Panel** — Live role counts, capability descriptions
- ✅ **Session Management** — Decoded JWT display, token expiry, logout

### Public Frontend Features
- ✅ **Posts Listing** — Paginated, truncated excerpts, author/date metadata
- ✅ **Post Detail** — Full content, comments display, comment form
- ✅ **Pages** — Static content pages accessible by slug (e.g., `/about`)
- ✅ **Comments** — Threaded display, approval workflow, guest & logged-in submission

### API Capabilities
- ✅ **REST API** — 21+ endpoints with full CRUD for all content types
- ✅ **GraphQL** — Queries and mutations for posts, users, categories, tags
- ✅ **JSONAPI Format** — Standardized response envelope
- ✅ **Pagination** — Page/per_page params on list endpoints
- ✅ **Filtering** — post_status, author, category, tag, post_id filters
- ✅ **Caching** — 12-hour cache on post listings (configurable)
- ✅ **Swagger Docs** — Auto-generated from RSpec specs via rswag

## Known Limitations & Future Work

### Current Limitations
- **Password Hashing**: Legacy WordPress PHPass hashes not supported; new users use Bcrypt (Devise)
- **Database Indexes**: Adding indexes to `post_date` may fail on some MySQL configs due to legacy `0000-00-00` dates
- **Token Revocation**: Uses `RevocationStrategies::Null` (no server-side token blacklist). Tokens are valid until expiry.
- **Security Scanning**: Brakeman may encounter dependency issues in Docker environment

### Potential Enhancements
- [ ] Implement token revocation for logout
- [ ] Add image resizing/thumbnail generation (ActiveStorage)
- [ ] Implement search across posts/pages/comments
- [ ] Add bulk operations in admin (bulk delete, bulk role change)
- [ ] Implement post scheduling/auto-publish
- [ ] Add custom post types & taxonomies registration API
- [ ] Implement post revisions system
- [ ] Add email notifications (comments, password reset)
- [ ] Implement backup/export functionality
- [ ] Add plugin/theme system (similar to WordPress)
- [ ] Implement multisite support

## Development Workflow

### Backend (Rails API)
1. Changes in `backWP/app/**` reload automatically (Puma watches file changes)
2. Test immediately: `docker compose exec backwp bundle exec rspec spec/path/to/spec.rb`
3. Add new API endpoint:
   - Create controller: `backWP/app/controllers/api/v2/<resource>_controller.rb`
   - Create serializer: `backWP/app/serializers/<model>_serializer.rb` (if needed)
   - Create service: `backWP/app/services/<action>_service.rb` (for complex logic)
   - Add routes: `backWP/config/routes.rb`
   - Write specs, generate Swagger docs

### Frontend - Admin Panel
1. Modules are dynamically loaded, no build step needed
2. Edit `frontWP/adminWP/shared/js/modules/<module>.js`
3. Refresh browser—changes apply immediately
4. Must follow module signature: `export default async function(content, shell) { ... }`
5. Use `shell.apiRequest()` for authenticated API calls (auto-attaches JWT)
6. Use `shell.showToast()` for notifications, `renderModal()` for forms

### Frontend - Public Site
1. Edit ERB templates in `backWP/app/views/`
2. Changes reload automatically (Rails file watchers)
3. For CSS changes: run `npm run watch:css` in `frontWP/` directory

### Full Development Setup
```bash
# Terminal 1: Start the stack
docker compose up --build

# Terminal 2: Watch Tailwind CSS (if modifying styles)
cd frontWP && npm run watch:css

# Terminal 3: Run tests as needed
docker compose exec backwp bundle exec rspec --watch
```

### Testing & Quality Checks
```bash
# Run all tests
docker compose exec backwp bundle exec rspec

# Run specific test file
docker compose exec backwp bundle exec rspec spec/controllers/api/v2/posts_controller_spec.rb

# Run with coverage
docker compose exec backwp bundle exec rspec --require spec_helper

# Lint code (Omakase style)
docker compose exec backwp bundle exec rubocop

# Security audit
docker compose exec backwp bundle exec brakeman -q

# Audit gems for vulnerabilities
docker compose exec backwp bundle exec bundler-audit check
```

### Deployment Considerations
- `config/application.rb` has `api_only = false` (supports both API and public pages)
- Environment variables needed: `DEVISE_JWT_SECRET_KEY`, `SECRET_KEY_BASE`, `RAILS_ENV`
- Database: MariaDB 10.11+ (WordPress schema required)
- Redis: For session caching (optional but recommended)
- Frontend admin panel can be deployed as static HTML (no build required)
