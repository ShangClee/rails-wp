// @ts-check
/// <reference path="../../../jsdoc/types.js" />

/**
 * Flatten JSONAPI data envelope into plain attribute objects.
 * Converts { data: [{ id, type, attributes: {...} }] } to [{ id, ...attributes }]
 *
 * @param {Object} response - Raw JSONAPI response
 * @param {Object|Array} response.data - JSONAPI data payload
 * @returns {Array<Object>} Flattened attribute objects
 */
export function parseJsonapi(response) {
  if (!response?.data) return [];
  const items = Array.isArray(response.data) ? response.data : [response.data];
  return items.map(item => ({ id: item.id, ...item.attributes }));
}

/**
 * Render a modal overlay with a form.
 *
 * @param {string} title - Modal title
 * @param {string} formHtml - HTML of the form contents
 * @param {function(Object): void} onSubmit - Callback when form is submitted, receives form field values
 * @returns {HTMLElement} The modal overlay element
 */
export function renderModal(title, formHtml, onSubmit) {
  // Remove any existing modal
  const existing = document.querySelector('.modal-overlay');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-content">
        ${formHtml}
      </div>
    </div>
  `;

  // Add styles if not already present
  if (!document.querySelector('style[data-modal-styles]')) {
    const style = document.createElement('style');
    style.setAttribute('data-modal-styles', '');
    style.textContent = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #eee;
      }
      .modal-header h2 {
        margin: 0;
        font-size: 1.5em;
      }
      .modal-close {
        background: none;
        border: none;
        font-size: 2em;
        cursor: pointer;
        color: #666;
      }
      .modal-close:hover {
        color: #000;
      }
      .modal-content {
        padding: 20px;
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(modal);

  // Find form in modal and attach submit handler
  const form = modal.querySelector('form');
  if (form && onSubmit) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      onSubmit(data);
      modal.remove();
    });
  }

  return modal;
}

// ---------------------------------------------------------------------------
// Typed GraphQL helper wrappers
// ---------------------------------------------------------------------------
// These wrappers provide IDE type hints for common admin operations.
// They delegate to shell.gqlRequest() and are optional — modules can call
// gqlRequest directly if they need custom query shapes.

const _QUERIES = {
  adminPosts: `
    query AdminPosts($limit: Int, $offset: Int, $status: String) {
      adminPosts(limit: $limit, offset: $offset, status: $status) {
        ID post_title post_content post_excerpt post_status post_date
        author { ID display_name }
      }
    }
  `,
  pages: `
    query GetPages {
      pages {
        ID post_title post_content post_excerpt post_status post_name
        post_parent menu_order post_date author { ID display_name }
      }
    }
  `,
  users: `
    query GetUsers {
      users { ID user_login user_email display_name role }
    }
  `
};

const _MUTATIONS = {
  createPost: `
    mutation CreatePost($title: String!, $content: String, $excerpt: String, $status: String) {
      createPost(title: $title, content: $content, excerpt: $excerpt, status: $status) {
        post { ID post_title post_status }
        errors
      }
    }
  `,
  updatePost: `
    mutation UpdatePost($id: ID!, $title: String, $content: String, $excerpt: String, $status: String) {
      updatePost(id: $id, title: $title, content: $content, excerpt: $excerpt, status: $status) {
        post { ID post_title post_status }
        errors
      }
    }
  `,
  deletePost: `
    mutation DeletePost($id: ID!) {
      deletePost(id: $id) { success errors }
    }
  `,
  createPage: `
    mutation CreatePage($title: String!, $content: String, $excerpt: String, $status: String, $parentId: Int) {
      createPage(title: $title, content: $content, excerpt: $excerpt, status: $status, parentId: $parentId) {
        page { ID post_title post_status }
        errors
      }
    }
  `,
  updatePage: `
    mutation UpdatePage($id: ID!, $title: String, $content: String, $excerpt: String, $status: String, $parentId: Int) {
      updatePage(id: $id, title: $title, content: $content, excerpt: $excerpt, status: $status, parentId: $parentId) {
        page { ID post_title post_status }
        errors
      }
    }
  `,
  deletePage: `
    mutation DeletePage($id: ID!) {
      deletePage(id: $id) { success errors }
    }
  `,
  updateUserRole: `
    mutation UpdateUserRole($id: ID!, $role: String!) {
      updateUserRole(id: $id, role: $role) {
        user { ID user_login role }
        errors
      }
    }
  `
};

/**
 * Fetch all posts (admin — all statuses).
 * @param {Object} shell - AdminShell instance
 * @param {{ limit?: number, offset?: number, status?: string }} [vars]
 * @returns {Promise<Array<WpPost>>}
 */
export async function fetchAdminPosts(shell, vars = {}) {
  const data = await shell.gqlRequest(_QUERIES.adminPosts, { limit: 50, offset: 0, ...vars });
  return data.adminPosts;
}

/**
 * Fetch all pages.
 * @param {Object} shell - AdminShell instance
 * @returns {Promise<Array<WpPage>>}
 */
export async function fetchPages(shell) {
  const data = await shell.gqlRequest(_QUERIES.pages);
  return data.pages;
}

/**
 * Fetch all users.
 * @param {Object} shell - AdminShell instance
 * @returns {Promise<Array<WpUser>>}
 */
export async function fetchUsers(shell) {
  const data = await shell.gqlRequest(_QUERIES.users);
  return data.users;
}

/**
 * Create a new post.
 * @param {Object} shell - AdminShell instance
 * @param {{ title: string, content?: string, excerpt?: string, status?: string }} vars
 * @returns {Promise<PostMutationResult>}
 */
export async function createPost(shell, vars) {
  const data = await shell.gqlRequest(_MUTATIONS.createPost, vars);
  return data.createPost;
}

/**
 * Update an existing post.
 * @param {Object} shell - AdminShell instance
 * @param {{ id: string|number, title?: string, content?: string, excerpt?: string, status?: string }} vars
 * @returns {Promise<PostMutationResult>}
 */
export async function updatePost(shell, vars) {
  const data = await shell.gqlRequest(_MUTATIONS.updatePost, vars);
  return data.updatePost;
}

/**
 * Delete a post.
 * @param {Object} shell - AdminShell instance
 * @param {string|number} id
 * @returns {Promise<DeleteMutationResult>}
 */
export async function deletePost(shell, id) {
  const data = await shell.gqlRequest(_MUTATIONS.deletePost, { id });
  return data.deletePost;
}

/**
 * Create a new page.
 * @param {Object} shell - AdminShell instance
 * @param {{ title: string, content?: string, excerpt?: string, status?: string, parentId?: number }} vars
 * @returns {Promise<PageMutationResult>}
 */
export async function createPage(shell, vars) {
  const data = await shell.gqlRequest(_MUTATIONS.createPage, vars);
  return data.createPage;
}

/**
 * Update an existing page.
 * @param {Object} shell - AdminShell instance
 * @param {{ id: string|number, title?: string, content?: string, excerpt?: string, status?: string, parentId?: number }} vars
 * @returns {Promise<PageMutationResult>}
 */
export async function updatePage(shell, vars) {
  const data = await shell.gqlRequest(_MUTATIONS.updatePage, vars);
  return data.updatePage;
}

/**
 * Delete a page.
 * @param {Object} shell - AdminShell instance
 * @param {string|number} id
 * @returns {Promise<DeleteMutationResult>}
 */
export async function deletePage(shell, id) {
  const data = await shell.gqlRequest(_MUTATIONS.deletePage, { id });
  return data.deletePage;
}

/**
 * Change a user's role.
 * @param {Object} shell - AdminShell instance
 * @param {string|number} id - User ID
 * @param {string} role - New role: "administrator" | "editor" | "author" | "contributor" | "subscriber"
 * @returns {Promise<UpdateUserRoleResult>}
 */
export async function updateUserRole(shell, id, role) {
  const data = await shell.gqlRequest(_MUTATIONS.updateUserRole, { id, role });
  return data.updateUserRole;
}

/**
 * Render a confirmation dialog.
 *
 * @param {string} message - Confirmation message
 * @param {function(): void} onConfirm - Callback if user confirms
 */
export function confirmDelete(message, onConfirm) {
  const confirmed = confirm(message || 'Are you sure?');
  if (confirmed && onConfirm) {
    onConfirm();
  }
}
