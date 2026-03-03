# Phase 3 Documentation: Core API & Authentication

## Overview
Phase 3 focused on securing the application with JWT authentication, implementing Role-Based Access Control (RBAC) mirroring WordPress capabilities, and establishing the foundational RESTful API endpoints.

## 1. Authentication System
We integrated `devise` and `devise-jwt` to handle authentication while maintaining compatibility with the legacy WordPress user table (`wp_users`).

- **User Model (`WpUser`)**:
  - Mapped Devise fields:
    - `email` -> `user_email`
    - `encrypted_password` -> `user_pass` (Note: Phpass hashing requires custom strategy, currently using standard Devise for new users).
  - **JWT Configuration**: Tokens are issued on login and revoked on logout.
  - **Endpoints**:
    - `POST /api/v2/login` (Sessions)
    - `DELETE /api/v2/logout` (Sessions)
    - `POST /api/v2/register` (Registrations)

## 2. Role-Based Access Control (RBAC)
Implemented via `WpAuthenticatable` concern.
- **Mechanism**: Parses the serialized PHP array in `wp_usermeta` (key: `wp_capabilities`) to determine roles.
- **Roles Supported**: Administrator, Editor, Author, Contributor, Subscriber.
- **Helper Methods**: `admin?`, `editor?`, `author?`.

## 3. RESTful API Endpoints (v2)
All endpoints are namespaced under `/api/v2` and return JSON:API compliant responses using `jsonapi-serializer`.

### Posts (`/api/v2/posts`)
- **GET /posts**: List published posts (Pagination enabled).
- **GET /posts/:id**: Retrieve single post details.
- **POST /posts**: Create new post (Auth required).
- **PATCH /posts/:id**: Update post (Auth required, owner/admin only).
- **DELETE /posts/:id**: Delete post (Auth required, owner/admin only).

### Users (`/api/v2/users`)
- **GET /users/me**: Get current user profile.
- **GET /users**: List all users (Admin only).
- **PATCH /users/:id**: Update profile (Admin or Self).

## 4. Serialization
Standardized JSON responses include:
- **Attributes**: Title, Content, Status, Dates.
- **Relationships**: Author, Categories, Tags.
- **Meta**: Custom fields (excluding internal `_` keys).

## 5. Next Steps
- Implement Taxonomy API (Categories/Tags).
- Build Media Library handling.
- Setup GraphQL API.
