## Why

The adminWP frontend has a broken data layer: API responses are rendered to HTML then discarded, so edit modals can only scrape visible table columns instead of accessing full record data. Event handlers use `window.*` globals wired through inline `onclick` strings — fragile, untestable, and a mild XSS surface. The GraphQL endpoint already exists on the backend but is unused by the admin panel, leaving a typed, structured interface sitting idle.

## What Changes

- **Backend**: Extend GraphQL schema with `adminPosts` query (all statuses, auth-gated), `pages` query + page mutations, and `updateUserRole` mutation
- **Frontend**: Add `gqlRequest()` and a mutation-driven `store` to `AdminShell`
- **Frontend**: Replace all `window.*` global event handlers with event delegation across all 9 admin modules
- **Frontend**: Migrate 4 content modules (cms-posts, cms-pages, system-users, system-roles) from REST+JSONAPI to GraphQL
- **Frontend**: Migrate 5 operational modules (cms-media, cms-menus, system-health, system-settings, system-tokens) to event delegation while keeping REST transport

## Capabilities

### New Capabilities

- `graphql-admin-queries`: Admin-only GraphQL queries — `adminPosts` (all statuses, role-gated), `pages` (first-class type), `updateUserRole` mutation
- `shell-store`: Client-side data store on AdminShell — `set/get/find/invalidate`, mutation-driven invalidation, no TTL
- `event-delegation`: Replace `window.*` globals with content-div event delegation across all modules
- `graphql-modules`: cms-posts, cms-pages, system-users, system-roles rewritten to use `gqlRequest()` and shell store

### Modified Capabilities

## Impact

- `backWP/app/graphql/types/` — new `WpPageType`, updated `QueryType`, `MutationType`
- `backWP/app/graphql/mutations/` — new `CreatePage`, `UpdatePage`, `DeletePage`, `UpdateUserRole`
- `frontWP/adminWP/shared/js/admin-shell.js` — add `gqlRequest()`, add `store`
- `frontWP/adminWP/shared/js/modules/` — all 9 modules refactored
- No REST endpoints removed (backward compatible)
- No database changes
