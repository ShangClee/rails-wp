## ADDED Requirements

### Requirement: cms-posts module uses GraphQL and shell store
The `cms-posts` module SHALL use `shell.gqlRequest()` to fetch posts via `adminPosts` query. Fetched posts SHALL be stored in `shell.store` under the key `'posts'`. The edit modal SHALL be populated from `shell.store.find('posts', id)`, falling back to a single `post(id)` query if not found. After create/update/delete mutations, the module SHALL call `shell.store.invalidate('posts')` before reloading.

#### Scenario: Posts list loaded from GraphQL
- **WHEN** cms-posts module mounts
- **THEN** it calls `adminPosts` query and stores result in `shell.store.set('posts', data)`

#### Scenario: Edit modal pre-populated with full data
- **WHEN** user clicks Edit on a post
- **THEN** all fields (title, content, excerpt, status) are pre-populated from store data

#### Scenario: Store used on repeat navigation
- **WHEN** user navigates away and back to cms-posts without any mutation
- **THEN** store data is used and no API call is made

#### Scenario: Mutation invalidates store
- **WHEN** user creates, updates, or deletes a post
- **THEN** `shell.store.invalidate('posts')` is called before the list reloads

### Requirement: cms-pages module uses GraphQL and shell store
The `cms-pages` module SHALL use `shell.gqlRequest()` to fetch pages via the `pages` query. It SHALL use `createPage`, `updatePage`, `deletePage` mutations. Data SHALL be stored under key `'pages'`.

#### Scenario: Pages list loaded from GraphQL
- **WHEN** cms-pages module mounts
- **THEN** it calls `pages` query and stores result in `shell.store.set('pages', data)`

#### Scenario: Create page mutation used
- **WHEN** user submits the new page form
- **THEN** `createPage` mutation is called with form data

### Requirement: system-users module uses GraphQL and shell store
The `system-users` module SHALL use `shell.gqlRequest()` to fetch users via the `users` query. Role changes SHALL use the `updateUserRole` mutation. Data SHALL be stored under key `'users'`.

#### Scenario: Users list loaded from GraphQL
- **WHEN** system-users module mounts
- **THEN** it calls `users` query and stores result in `shell.store.set('users', data)`

#### Scenario: Role change uses mutation
- **WHEN** user selects a new role from the dropdown
- **THEN** `updateUserRole` mutation is called
- **AND** `shell.store.invalidate('users')` is called on success

### Requirement: system-roles module derives data from users store
The `system-roles` module SHALL derive role counts from `shell.store.get('users')` if available, falling back to a fresh `users` query. It SHALL NOT maintain its own store key.

#### Scenario: Role counts derived from cached users
- **WHEN** system-roles mounts and users store is populated
- **THEN** role counts are derived from store data without an API call

### Requirement: REST modules use event delegation only
The modules `cms-media`, `cms-menus`, `system-health`, `system-settings` SHALL retain `shell.apiRequest()` for data fetching but SHALL replace all `window.*` globals with event delegation. The `system-tokens` module SHALL retain its client-side JWT decode logic with event delegation.

#### Scenario: cms-media buttons work via event delegation
- **WHEN** user clicks delete on a media item
- **THEN** the handler is dispatched via `data-action` attribute, not `window.cmsMedia_*`
