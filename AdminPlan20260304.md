# Admin Panel Restructuring Plan (2026-03-04)

## Objective
Establish a unified Admin UI within `frontWP` that clearly separates Content Management (Frontend concerns) from System Administration (Backend concerns) while maintaining a single session and authentication context.

## Architecture

### 1. Location & Structure
*   **Root**: `frontWP/admin/`
*   **Entry Point**: `frontWP/admin/index.html` (The Admin Shell)
*   **Setup Page**: `frontWP/admin/setup.html` (Standalone, separate from the main shell)
*   **Login Page**: `frontWP/admin/login.html` (Entry point for authentication)

### 2. Navigation Concept
The Admin Shell will feature a top-level tabbed interface:
*   **CMS Tab** (FrontWP Focused):
    *   Content editing (Posts, Pages)
    *   Media Library
    *   Menus & Navigation
    *   Theme/Layout settings
*   **System Tab** (BackWP Focused):
    *   User Management (Users, Roles)
    *   API Tokens
    *   System Health & Status
    *   Server Logs (optional)
    *   Global Settings (Site URL, etc.)

### 3. Routing
*   **Web**: Nginx serves `frontWP/admin/` for all admin routes.
*   **API**:
    *   Existing: `/api/v2/...` for standard resource actions.
    *   Future: `/api/v2/admin/...` for privileged system actions.

## Implementation Steps

1.  **Directory Restructuring**:
    *   Ensure `frontWP/admin` exists.
    *   Create `frontWP/admin/cms/` and `frontWP/admin/system/` directories.

2.  **Admin Shell (`index.html`)**:
    *   Implement a layout with a Sidebar or Topbar for the "CMS" vs "System" toggle.
    *   Include authentication check (redirect to Login if valid token is missing).

3.  **Migration**:
    *   Ensure `setup.html` remains accessible for initial installation.

## Todo List
- [x] Create folder structure `frontWP/admin/{cms,system}`
- [x] Create `frontWP/admin/index.html` with tabbed layout
- [x] Implement basic auth check in `index.html`
- [x] Add "CMS" dashboard placeholder
- [x] Add "System" dashboard placeholder
- [x] Create `frontWP/admin/cms/posts.html` (List Posts)
- [x] Create `frontWP/admin/system/users.html` (List Users)

