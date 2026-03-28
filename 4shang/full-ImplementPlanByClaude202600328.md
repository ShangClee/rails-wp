# WordPress CMS Implementation Plan

## Context

This repo has a Rails 8.1.2 API backend (backWP) and a vanilla-JS admin console (frontWP/adminWP). The database schema is already a direct copy of the WordPress MySQL schema. The goal is to build out the missing functionality so the stack operates as a full WordPress-compatible CMS — same data model, same REST API surface, same admin panel sections.

---

## Current State (What's Broken / Stubbed)

1. **`author?` method missing** from `WpAuthenticatable` — `posts_controller.rb` and `media_controller.rb` call it today → `NoMethodError`
2. **TaxonomiesController + MediaController** exist but are not in `routes.rb` → 404
3. **Admin JS data mismatch**: modules read flat field names (`post.title`) but the JSONAPI serializer returns `data[].attributes.post_title` → blank tables
4. **7 admin modules are stubs** (alert() buttons or hardcoded static data): cms-pages, cms-media, cms-menus, system-roles, system-tokens, system-health, system-settings
5. **No API endpoints** for: pages, comments, settings, menus, categories, tags (as separate resources), role management, health check
6. **Public root** points to `rails/health#show` not posts listing

---

## Phase 1 — Critical Fixes (unblock existing features)

### 1.1 Fix `WpAuthenticatable`
**Modify**: `backWP/app/models/concerns/wp_authenticatable.rb`
Add `author?`, `contributor?`, `subscriber?` predicates following the same pattern as `admin?` and `editor?`.

### 1.2 Wire orphaned controllers into routes
**Modify**: `backWP/config/routes.rb`
```ruby
resources :taxonomies
resources :media
```

### 1.3 Create shared JSONAPI helper + fix JS data shape
**Create**: `frontWP/adminWP/shared/js/api-helpers.js`
```js
export function parseJsonapi(response) {
  if (!response?.data) return [];
  const items = Array.isArray(response.data) ? response.data : [response.data];
  return items.map(item => ({ id: item.id, ...item.attributes }));
}
export function renderModal(title, formHtml, onSubmit) { /* overlay + form */ }
export function confirmDelete(message, onConfirm) { /* confirm dialog */ }
```

**Modify**: `frontWP/adminWP/shared/js/modules/cms-posts.js`
- Import `parseJsonapi`
- Fix field refs: `post.post_title`, `post.author.name`, `post.post_status`, `post.post_date`

**Modify**: `frontWP/adminWP/shared/js/modules/system-users.js`
- Fix field refs: `user.user_login`, `user.user_email`, `user.roles`

---

## Phase 2 — New Backend APIs (complete WordPress REST API surface)

All controllers are thin; non-trivial logic goes into service objects.

### 2.1 Pages API
**Create**: `backWP/app/controllers/api/v2/pages_controller.rb`
Same as PostsController but scoped to `WpPost.pages`, forces `post_type: 'page'`, permits `post_parent`.
Reuses `WpPostSerializer`.
**Route**: `resources :pages`

### 2.2 Comments API
**Create**: `backWP/app/controllers/api/v2/comments_controller.rb`
Actions: index (with `?post_id=`), show, create, update, destroy.
- Anyone can create; approve/delete requires admin or editor
- Default `comment_approved: '0'` for guests, `'1'` for logged-in

**Create**: `backWP/app/serializers/wp_comment_serializer.rb`

**Create**: `backWP/app/services/create_comment_service.rb`
- Validate post accepts comments
- Set timestamps, IP, agent
- Increment `comment_count` on the parent post (in a transaction)

**Route**: `resources :comments`

### 2.3 Settings API
**Create**: `backWP/app/utilities/settings_utility.rb`
Whitelist: `blogname`, `blogdescription`, `siteurl`, `home`, `admin_email`, `timezone_string`, `date_format`, `time_format`, `posts_per_page`, `default_comment_status`
Methods: `fetch_all`, `update_all(params)`

**Create**: `backWP/app/controllers/api/v2/settings_controller.rb`
- `GET /api/v2/settings` → admin only
- `PATCH /api/v2/settings` → admin only

**Route**: `resource :settings, only: [:show, :update]`

### 2.4 Menus API
WordPress menus: `wp_terms` + `wp_term_taxonomy` (taxonomy='nav_menu') for the menu itself; `wp_posts` (post_type='nav_menu_item') for items; `wp_postmeta` keys `_menu_item_type`, `_menu_item_url`, `_menu_item_menu_item_parent`, `_menu_item_object_id` for item metadata.

**Modify**: `backWP/app/models/wp_term_taxonomy.rb` — add `scope :nav_menus, -> { where(taxonomy: 'nav_menu') }`
**Modify**: `backWP/app/models/wp_post.rb` — add `scope :nav_menu_items, -> { where(post_type: 'nav_menu_item') }`

**Create**: `backWP/app/controllers/api/v2/menus_controller.rb`
Actions: index, show (with items), create, update, destroy

**Create**: `backWP/app/controllers/api/v2/menu_items_controller.rb`
Delegates to MenuItemService

**Create**: `backWP/app/services/menu_item_service.rb`
Creates nav_menu_item WpPost + postmeta keys + WpTermRelationship in one transaction

**Create**: `backWP/app/serializers/wp_menu_serializer.rb`
Serializes WpTermTaxonomy (nav_menu) with embedded ordered items

**Routes**:
```ruby
resources :menus do
  resources :items, controller: 'menu_items', only: [:create, :update, :destroy]
end
```

### 2.5 Categories + Tags as separate routes
**Create**: `backWP/app/controllers/api/v2/categories_controller.rb` — forces `taxonomy: 'category'`
**Create**: `backWP/app/controllers/api/v2/tags_controller.rb` — forces `taxonomy: 'post_tag'`
Both reuse `WpTermTaxonomySerializer`.
**Routes**: `resources :categories` and `resources :tags`

### 2.6 Role Management
**Create**: `backWP/app/services/user_role_service.rb`
Validates role is one of 5 valid roles. Writes PHP-serialized `wp_capabilities` to usermeta (format: `a:1:{s:N:"role_name";b:1;}`).

**Modify**: `backWP/app/controllers/api/v2/users_controller.rb`
Add member route `patch 'role'` calling `UserRoleService`.

### 2.7 Health Check Endpoint
**Create**: `backWP/app/controllers/api/v2/health_controller.rb`
Returns live: DB ping, Redis ping, post/user/media counts.
**Route**: `get 'health', to: 'health#show'`

### Final routes.rb (api/v2 namespace)
```ruby
resources :posts
resources :pages
resources :media
resources :taxonomies
resources :categories
resources :tags
resources :comments
resources :menus do
  resources :items, controller: 'menu_items', only: [:create, :update, :destroy]
end
resource  :settings, only: [:show, :update]
resources :setup, only: [:index, :create]
resources :users, only: [:index, :show, :update] do
  member { patch 'role' }
  collection { get 'me' }
end
get 'health', to: 'health#show'
```

---

## Phase 3 — Admin Panel (replace all stubs)

All modules import `parseJsonapi`, `renderModal`, `confirmDelete` from `../api-helpers.js`.

| Module | What to build |
|--------|---------------|
| `cms-posts.js` | Fix data shape; Add/Edit/Delete modals calling POST/PATCH/DELETE /posts |
| `cms-pages.js` | Full replacement — same as posts + parent page dropdown (GET /pages) |
| `cms-media.js` | Full replacement — grid view, file upload via raw `fetch` (multipart, bypasses `shell.apiRequest`), delete |
| `cms-menus.js` | Two-panel: menu list on left, item builder on right (HTML5 drag to reorder, GET/POST /menus, POST/PATCH/DELETE /menus/:id/items) |
| `system-users.js` | Fix data shape; Role change dropdown calling PATCH /users/:id/role |
| `system-roles.js` | Compute live role counts from GET /users; show 5 fixed WP roles with descriptions |
| `system-tokens.js` | No API — show decoded current JWT claims from localStorage, expiry countdown |
| `system-health.js` | GET /api/v2/health; show live DB/Redis/content counts |
| `system-settings.js` | Load from GET /api/v2/settings; save via PATCH /api/v2/settings |

---

## Phase 4 — Public Frontend

### 4.1 Enable HTML rendering
**Modify**: `backWP/config/application.rb` — change `config.api_only = true` to `config.api_only = false`
**Create**: `backWP/app/views/layouts/application.html.erb` — Tailwind CDN + nav bar

### 4.2 Public posts routes
**Create**: `backWP/app/controllers/posts_controller.rb` (non-namespaced)
Move ERB views from `frontWP/pages/posts/` to `backWP/app/views/posts/`
**Routes**: `resources :posts, only: [:index, :show]` + `root to: "posts#index"`

### 4.3 Public pages
**Create**: `backWP/app/controllers/pages_controller.rb`
**Create**: `backWP/app/views/pages/show.html.erb`
**Route**: `get '/:slug', to: 'pages#show', as: :page` (must come last)

### 4.4 Comments on post show page
**Modify**: `backWP/app/views/posts/show.html.erb`
Add: server-rendered approved comments list + a `<form>` that POSTs to `/api/v2/comments` via vanilla JS `fetch`

---

## Phase 5 — GraphQL Mutations (complete the API)

### 5.1 Extract PostService
**Create**: `backWP/app/services/post_service.rb`
Extract create/update/destroy logic from `Api::V2::PostsController` into `PostService.create`, `.update`, `.destroy`. Controller becomes a thin adapter.

### 5.2 Post mutations
**Create**:
- `backWP/app/graphql/mutations/create_post.rb`
- `backWP/app/graphql/mutations/update_post.rb`
- `backWP/app/graphql/mutations/delete_post.rb`

All delegate to `PostService`.

**Modify**: `backWP/app/graphql/types/mutation_type.rb` — replace stub with real fields

### 5.3 Tags query
**Modify**: `backWP/app/graphql/types/query_type.rb` — add `field :tags` returning `WpTermTaxonomy.tags`

---

## Dependency Order

```
Phase 1  (fixes — start here, unblocks everything)
  ↓
Phase 2  (backend — 2.1 → 2.2 → 2.3, 2.4–2.7 can be parallel)
  ↓
Phase 3  (admin JS — 3.1 prerequisite, then all modules in parallel)
  ↓
Phase 4  (public frontend — depends on 2.2 for comments)
  ↓
Phase 5  (GraphQL — independent, lowest priority)
```

---

## Complete File Manifest

### Modify
- `backWP/app/models/concerns/wp_authenticatable.rb`
- `backWP/app/models/wp_term_taxonomy.rb`
- `backWP/app/models/wp_post.rb`
- `backWP/app/controllers/api/v2/users_controller.rb`
- `backWP/app/graphql/types/mutation_type.rb`
- `backWP/app/graphql/types/query_type.rb`
- `backWP/config/routes.rb`
- `backWP/config/application.rb`
- `frontWP/adminWP/shared/js/modules/cms-posts.js`
- `frontWP/adminWP/shared/js/modules/cms-pages.js`
- `frontWP/adminWP/shared/js/modules/cms-media.js`
- `frontWP/adminWP/shared/js/modules/cms-menus.js`
- `frontWP/adminWP/shared/js/modules/system-users.js`
- `frontWP/adminWP/shared/js/modules/system-roles.js`
- `frontWP/adminWP/shared/js/modules/system-tokens.js`
- `frontWP/adminWP/shared/js/modules/system-health.js`
- `frontWP/adminWP/shared/js/modules/system-settings.js`
- `frontWP/pages/index.js`
- `backWP/app/views/posts/show.html.erb` (after move)

### Create
- `frontWP/adminWP/shared/js/api-helpers.js`
- `backWP/app/controllers/api/v2/pages_controller.rb`
- `backWP/app/controllers/api/v2/comments_controller.rb`
- `backWP/app/serializers/wp_comment_serializer.rb`
- `backWP/app/services/create_comment_service.rb`
- `backWP/app/controllers/api/v2/settings_controller.rb`
- `backWP/app/utilities/settings_utility.rb`
- `backWP/app/controllers/api/v2/menus_controller.rb`
- `backWP/app/controllers/api/v2/menu_items_controller.rb`
- `backWP/app/serializers/wp_menu_serializer.rb`
- `backWP/app/services/menu_item_service.rb`
- `backWP/app/controllers/api/v2/categories_controller.rb`
- `backWP/app/controllers/api/v2/tags_controller.rb`
- `backWP/app/services/user_role_service.rb`
- `backWP/app/controllers/api/v2/health_controller.rb`
- `backWP/app/controllers/posts_controller.rb`
- `backWP/app/controllers/pages_controller.rb`
- `backWP/app/views/layouts/application.html.erb`
- `backWP/app/views/posts/index.html.erb`
- `backWP/app/views/posts/show.html.erb`
- `backWP/app/views/pages/show.html.erb`
- `backWP/app/services/post_service.rb`
- `backWP/app/graphql/mutations/create_post.rb`
- `backWP/app/graphql/mutations/update_post.rb`
- `backWP/app/graphql/mutations/delete_post.rb`

---

## Verification

After each phase:

**Phase 1**: `docker compose exec backwp bundle exec rspec` passes; admin post list shows real data.

**Phase 2**: `curl -H "Authorization: Bearer <token>" http://localhost:8888/api/v2/settings` returns site options. `curl http://localhost:8888/api/v2/categories` returns categories list.

**Phase 3**: All 9 admin modules show real data fetched from the API. Settings save persists to MariaDB.

**Phase 4**: `http://localhost:8888/` renders posts listing. `http://localhost:8888/posts/1` shows post with comments.

**Phase 5**: GraphQL playground `createPost` mutation returns a new post.
