## ADDED Requirements

### Requirement: adminPosts query returns all posts for authorized users
The system SHALL expose an `adminPosts` GraphQL query that returns posts of all statuses (publish, draft, pending, private, trash). The query SHALL only be accessible to users with admin or editor role. The query SHALL accept optional `limit`, `offset`, and `status` arguments.

#### Scenario: Admin fetches all posts including drafts
- **WHEN** an authenticated admin calls `adminPosts(limit: 20, offset: 0)`
- **THEN** the response includes posts with all statuses (not just published)

#### Scenario: Unauthorized user is rejected
- **WHEN** a user without admin or editor role calls `adminPosts`
- **THEN** the response returns `errors: ["Unauthorized"]` and no post data

#### Scenario: Unauthenticated request is rejected
- **WHEN** `adminPosts` is called without a JWT token
- **THEN** the response returns `errors: ["Unauthorized"]`

#### Scenario: Status filter narrows results
- **WHEN** an admin calls `adminPosts(status: "draft")`
- **THEN** only posts with `post_status = "draft"` are returned

### Requirement: pages query returns all pages
The system SHALL expose a `pages` GraphQL query returning records with `post_type = 'page'`. The query SHALL return `WpPageType` objects including `ID`, `post_title`, `post_content`, `post_excerpt`, `post_status`, `post_name`, `post_parent`, `menu_order`, and `author`.

#### Scenario: Pages query returns page records
- **WHEN** an authenticated user calls `pages`
- **THEN** only records with `post_type = 'page'` are returned

#### Scenario: WpPageType includes parent reference
- **WHEN** a page has a parent page
- **THEN** `post_parent` contains the parent page ID

### Requirement: createPage mutation creates a new page
The system SHALL expose a `createPage` mutation accepting `title`, `content`, `excerpt`, `status`, and `parentId` arguments. Only admin and editor users SHALL be able to create pages.

#### Scenario: Admin creates a page
- **WHEN** an admin calls `createPage(title: "About", status: "publish")`
- **THEN** a new record with `post_type = 'page'` is created and returned

#### Scenario: Unauthorized user cannot create pages
- **WHEN** a subscriber calls `createPage`
- **THEN** the response returns `errors: ["Unauthorized"]`

### Requirement: updatePage mutation updates an existing page
The system SHALL expose an `updatePage` mutation accepting `id` plus optional `title`, `content`, `excerpt`, `status`, `parentId` arguments.

#### Scenario: Owner updates their page
- **WHEN** an admin or editor calls `updatePage(id: "5", title: "New Title")`
- **THEN** the page record is updated and returned with the new title

#### Scenario: Non-owner cannot update page
- **WHEN** a non-admin/editor calls `updatePage`
- **THEN** the response returns `errors: ["Unauthorized"]`

### Requirement: deletePage mutation deletes a page
The system SHALL expose a `deletePage` mutation accepting an `id` argument. Only admin and editor users SHALL be able to delete pages.

#### Scenario: Admin deletes a page
- **WHEN** an admin calls `deletePage(id: "5")`
- **THEN** the page is deleted and `success: true` is returned

### Requirement: updateUserRole mutation changes a user's role
The system SHALL expose an `updateUserRole` mutation accepting `id` and `role` arguments. Only admin users SHALL be able to call this mutation.

#### Scenario: Admin changes user role
- **WHEN** an admin calls `updateUserRole(id: "3", role: "editor")`
- **THEN** the user's role is updated and the updated user is returned

#### Scenario: Non-admin cannot change roles
- **WHEN** a non-admin calls `updateUserRole`
- **THEN** the response returns `errors: ["Unauthorized"]`

#### Scenario: Invalid role is rejected
- **WHEN** an admin calls `updateUserRole(id: "3", role: "superadmin")`
- **THEN** the response returns `errors: ["Invalid role"]`
