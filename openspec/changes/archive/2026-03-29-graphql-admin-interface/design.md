## Context

The adminWP panel is a vanilla JS SPA with 9 modules loaded dynamically by `AdminShell`. Currently all modules call `shell.apiRequest()` (REST), parse JSONAPI envelopes via `parseJsonapi()`, render data to innerHTML, then lose the data. Edit actions reconstruct records by scraping DOM cells. Event handlers are exposed as `window.cmsPosts_xxx` globals and wired through inline `onclick` strings in template literals.

The Rails backend already has a `/graphql` endpoint with `graphql-ruby`, JWT auth via `context[:current_user]`, and working post queries/mutations. The gap is that the admin never uses it.

## Goals / Non-Goals

**Goals:**
- Fix the broken edit flow: full record data available when opening edit modal
- Eliminate `window.*` globals across all 9 modules
- Add `gqlRequest()` + mutation-driven `store` to `AdminShell`
- Extend backend GraphQL with `adminPosts`, `pages`, and `updateUserRole`
- Migrate 4 content modules to GraphQL; 5 operational modules stay REST but get event delegation

**Non-Goals:**
- No REST endpoint removal (backward compatible)
- No TypeScript migration
- No Tailwind migration for adminWP (separate concern)
- No pagination UI changes
- No GraphQL subscriptions / real-time updates

## Decisions

### D1: Separate `adminPosts` query, not a `status` filter on `posts`

The public `posts` query is consumed by the public frontend (ERB views). Adding an admin filter risks leaking drafts if called without auth. A separate `adminPosts` query has its own resolver that enforces `current_user.admin? || current_user.editor?` before returning all statuses.

_Alternatives considered_: `posts(status: "all", adminOnly: true)` — rejects because one query doing two jobs conflates public/admin concerns.

### D2: `WpPageType` reuses `WpPostType` fields but is a separate type

Pages and posts share the same `wp_posts` table and field names. However, page-specific fields (`post_parent`, `menu_order`) don't belong on `WpPostType`. Separate type keeps each clean.

_Alternatives considered_: Interface type — overkill for two types with ~80% overlap; adds indirection.

### D3: Shell store — plain `Map`, mutation-driven invalidation only

No TTL. Data stays until a mutation invalidates it. Rationale: admin users expect their writes to be immediately reflected; stale reads are more surprising than an extra network call. Navigating away and back should show the latest data the user created/edited.

Store API:
```javascript
store.set(key, data)        // store array or object
store.get(key)              // returns data or null
store.find(key, id)         // find by .ID (WP uses uppercase ID)
store.invalidate(key)       // delete entry
```

_Alternatives considered_: TTL cache — rejected per user decision. `sessionStorage` — rejected, no need to persist across page reload.

### D4: Event delegation on `content` div, `data-action` / `data-id` attributes

Instead of `onclick="window.xxx(id)"`, buttons carry `data-action="edit" data-id="42"`. A single `click` listener on the `content` div dispatches to a local `handlers` map. Listener is attached once per module mount; no cleanup needed because `content.innerHTML` replacement removes old listeners automatically (they're on the container, not replaced elements).

```html
<button data-action="edit" data-id="42">Edit</button>
```
```javascript
content.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  handlers[btn.dataset.action]?.(btn.dataset.id);
});
```

### D5: GraphQL client on shell, REST client retained

`shell.gqlRequest(query, vars)` POSTs to `http://localhost:8888/graphql` with the JWT Bearer token. Error handling extracts `errors[0].message` from the GraphQL response envelope and calls `showToast`. The existing `shell.apiRequest()` is unchanged — REST modules keep using it.

### D6: Module data key convention

Each module owns a named store key:
- `posts` → cms-posts
- `pages` → cms-pages
- `users` → system-users
- `roles` derived from `users` (system-roles reads the same store key)

After any mutation in a module, call `shell.store.invalidate(key)` before reloading.

## Risks / Trade-offs

**`adminPosts` auth in GraphQL context** → The resolver must check `context[:current_user]`. If the JWT middleware fails silently, the query returns an auth error rather than data. Mitigation: return `{ errors: ['Unauthorized'] }` explicitly; frontend redirects to login on 401.

**`data-id` is always a string** → `dataset.id` returns a string. WP IDs are integers. The store's `find(key, id)` must compare with `==` (loose equality) not `===`. Mitigation: document this in store implementation.

**No module cleanup / unmount lifecycle** → If a module is mounted twice rapidly (fast navigation), two click listeners could attach. Mitigation: at module entry, remove existing listener via a module-scoped `AbortController` or replace `content.innerHTML` first (which drops existing delegated listeners). The current shell already replaces `content.innerHTML` on each navigation, so re-attaching on the container is safe.

**GraphQL N+1 on `adminPosts` with author** → `posts { author { display_name } }` will N+1 without dataloader. `graphql-ruby` has batch loading support; not implemented yet. Mitigation: acceptable for admin use (low traffic), add `graphql-batch` in a follow-up.

## Migration Plan

1. Backend changes first (additive, no breaking changes)
2. Shell changes (additive — `gqlRequest`, `store` added alongside existing methods)
3. Modules migrated one at a time — each is independent
4. No deployment coordination needed; frontend modules load dynamically

Rollback: revert frontend module files. Backend GraphQL additions are additive and don't affect existing REST routes.

## Open Questions

- Should `adminPosts` return comments count per post? (useful for admin list view — defer to follow-up)
- Should `system-roles` call a dedicated `roles` query or derive from `users`? (current plan: derive from users store)
