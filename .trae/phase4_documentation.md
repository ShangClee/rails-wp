# Phase 4 Documentation: Advanced Features & GraphQL

## Overview
Phase 4 expanded the system's capabilities beyond basic CRUD, introducing complex Taxonomy management, Media handling, and a flexible GraphQL API.

## 1. Taxonomy Management (`Api::V2::TaxonomiesController`)
WordPress taxonomies involve two tables: `wp_terms` (the term itself) and `wp_term_taxonomy` (its classification). We implemented a controller that manages both atomically.

- **Endpoints**:
  - `GET /api/v2/taxonomies`: List all terms (filter by `type=category` or `post_tag`).
  - `POST /api/v2/taxonomies`: Creates both `WpTerm` and `WpTermTaxonomy` in a transaction.
  - `PATCH /api/v2/taxonomies/:id`: Updates term name/slug and taxonomy description.
  - **Logic**: Creating a category requires inserting into `wp_terms` first, obtaining the ID, then inserting into `wp_term_taxonomy`.

## 2. Media Library (`Api::V2::MediaController`)
Implemented file upload handling that mimics WordPress attachment logic.

- **Storage Strategy**: Files are (simulated) stored in `wp-content/uploads/YYYY/MM`.
- **Database Mapping**:
  - `wp_posts`: A new record with `post_type: 'attachment'` and `post_mime_type`.
  - `wp_postmeta`: Stores `_wp_attached_file` path.
- **Endpoints**:
  - `POST /api/v2/media`: Accepts a file, creates the attachment post, and returns metadata.
  - `GET /api/v2/media`: Lists all attachments.

## 3. GraphQL API
Built using `graphql-ruby`, providing a flexible query interface for the frontend.

- **Schema Definition**:
  - **`WpPostType`**: Exposes title, content, author, categories, and tags.
  - **`WpUserType`**: Exposes profile data and authored posts.
  - **`WpTermTaxonomyType`**: Exposes term name, slug, and count.

- **Root Query (`QueryType`)**:
  - `posts(limit: Int, offset: Int)`: Fetch paginated posts.
  - `post(id: ID!)`: Fetch single post by ID.
  - `users`: List all users.
  - `viewer`: Returns the currently authenticated user (from JWT context).
  - `categories`: List all categories.

- **Authentication**:
  - The `GraphqlController` extracts the `current_user` from the Devise-JWT token and passes it into the GraphQL context, allowing resolvers (like `viewer`) to access user data.

## 4. Next Steps
- Implement Caching (Redis).
- Security Hardening.
- Database Optimization.
