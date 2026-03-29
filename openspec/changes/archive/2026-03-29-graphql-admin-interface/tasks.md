## 1. Backend — GraphQL Schema Extensions

- [x] 1.1 Create `WpPageType` in `backWP/app/graphql/types/wp_page_type.rb` with fields: `ID`, `post_title`, `post_content`, `post_excerpt`, `post_status`, `post_name`, `post_parent`, `menu_order`, `author`
- [x] 1.2 Add `adminPosts` query to `QueryType` — returns all post statuses, gated by `current_user.admin? || current_user.editor?`, accepts `limit`, `offset`, `status` arguments
- [x] 1.3 Add `pages` query to `QueryType` — returns `WpPost.pages` (post_type='page'), returns `[WpPageType]`
- [x] 1.4 Create `CreatePage` mutation in `backWP/app/graphql/mutations/create_page.rb` — accepts `title`, `content`, `excerpt`, `status`, `parent_id`; admin/editor only
- [x] 1.5 Create `UpdatePage` mutation in `backWP/app/graphql/mutations/update_page.rb` — accepts `id` + optional fields; admin/editor only
- [x] 1.6 Create `DeletePage` mutation in `backWP/app/graphql/mutations/delete_page.rb` — accepts `id`; admin/editor only
- [x] 1.7 Create `UpdateUserRole` mutation in `backWP/app/graphql/mutations/update_user_role.rb` — accepts `id`, `role`; admin only; validates role against allowed list
- [x] 1.8 Register all new mutations in `MutationType`

## 2. Frontend — AdminShell Core

- [x] 2.1 Add `gqlRequest(query, variables = {})` method to `AdminShell` — POSTs to `http://localhost:8888/graphql`, attaches JWT Bearer token, extracts `data`, throws on `errors`
- [x] 2.2 Add `store` object to `AdminShell` with `set(key, data)`, `get(key)`, `find(key, id)`, `invalidate(key)` — plain Map, no TTL, `find` uses loose equality (`==`) for ID matching

## 3. Frontend — GraphQL Modules (cms-posts)

- [x] 3.1 Rewrite `cms-posts.js` — replace `shell.apiRequest` with `shell.gqlRequest` using `adminPosts` query, store result under `'posts'`, use event delegation (`data-action`, `data-id`), remove all `window.cmsPosts_*` globals
- [x] 3.2 Fix edit modal in `cms-posts.js` — populate from `shell.store.find('posts', id)`, falling back to single `post(id)` query; pre-fill all fields (title, content, excerpt, status)
- [x] 3.3 Wire create/update/delete in `cms-posts.js` to call `shell.store.invalidate('posts')` before reloading

## 4. Frontend — GraphQL Modules (cms-pages)

- [x] 4.1 Rewrite `cms-pages.js` — use `pages` query via `shell.gqlRequest`, store under `'pages'`, event delegation, remove `window.cmsPages_*` globals
- [x] 4.2 Wire `createPage`, `updatePage`, `deletePage` mutations in `cms-pages.js` with store invalidation

## 5. Frontend — GraphQL Modules (system-users)

- [x] 5.1 Rewrite `system-users.js` — use `users` query via `shell.gqlRequest`, store under `'users'`, event delegation, remove `window.systemUsers_*` globals
- [x] 5.2 Wire `updateUserRole` mutation in `system-users.js` with store invalidation on success

## 6. Frontend — GraphQL Modules (system-roles)

- [x] 6.1 Rewrite `system-roles.js` — derive role counts from `shell.store.get('users')` if available, fall back to `users` query; use event delegation; no own store key

## 7. Frontend — REST Modules (event delegation only)

- [x] 7.1 Refactor `cms-media.js` — replace `window.cmsMedia_*` globals with event delegation; keep `shell.apiRequest()` for data
- [x] 7.2 Refactor `cms-menus.js` — replace `window.cmsMenus_*` globals with event delegation; keep `shell.apiRequest()` for data
- [x] 7.3 Refactor `system-health.js` — replace any `window.*` globals with event delegation; keep `shell.apiRequest()`
- [x] 7.4 Refactor `system-settings.js` — replace any `window.*` globals with event delegation; keep `shell.apiRequest()`
- [x] 7.5 Refactor `system-tokens.js` — replace any `window.*` globals with event delegation; JWT decode remains client-side

## 8. Cleanup

- [x] 8.1 Remove `window.shell = shell` assignment from all modules
- [x] 8.2 Verify `parseJsonapi()` in `api-helpers.js` is still used by REST modules (media, menus) — remove if unused, keep if needed
