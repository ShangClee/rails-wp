# AdminWP Workflow Improvements

**Created:** Thu Mar 05 2026

## Current Issues

1. **Dual navigation systems** - Sidebar tabs load content in panels, but toolbar links navigate to separate `.html` pages (posts.html, users.html), breaking the SPA experience
2. **State not persisted across pages** - Each `.html` page reloads independently, losing sidebar state
3. **Inconsistent UX** - CMS and System tabs just show landing cards instead of actual content
4. **No unified routing** - Hash-based routing in shell vs separate HTML files
5. **Modules loaded lazily but content not integrated** - CMS module just links to separate pages

## Suggestions

### 1. **Consolidate into true SPA**
Remove separate `.html` pages (posts.html, users.html, setup.html) and render all content within the panel system.

### 2. **Unified Content Rendering**
```js
// In cms.js - render actual posts list instead of link
export async function init(container, ctx) {
  const posts = await fetch(`${ctx.API_URL}/posts`).then(r => r.json());
  container.innerHTML = `<table>...</table>`; // actual posts table
}
```

### 3. **Add Proper Routing**
Replace hash-based tab switching with proper URL routing that preserves state:
```js
// Instead of location.hash = '#cms'
history.pushState({ tab: 'cms' }, '', '/admin/#cms');
```

### 4. **Add Breadcrumb Navigation**
Current breadcrumb shows only current tab. Add drill-down navigation for nested views (e.g., Posts > Edit Post).

### 5. **Consistent Toolbar Actions**
Move all actions into the toolbar instead of creating separate pages:
- "New Post" button in toolbar → opens inline editor
- "Add User" button in toolbar → opens modal/inline form

### 6. **Loading States & Error Handling**
Add skeleton loaders and toast notifications for async operations.

### 7. **Role-Based Tab Filtering**
Currently works, but consider hiding protected tabs visually instead of just disabling.

---

**Priority recommendation**: Start with #1-3 to create a unified experience, then add #4-7 for polish.
