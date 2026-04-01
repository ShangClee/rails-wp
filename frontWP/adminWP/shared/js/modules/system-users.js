// @ts-check
/// <reference path="../../../../jsdoc/types.js" />

const USERS_QUERY = `
  query GetUsers {
    users {
      ID user_login user_email display_name user_registered role
      meta { key value }
    }
  }
`;

const UPDATE_ROLE_MUTATION = `
  mutation UpdateUserRole($id: ID!, $role: String!) {
    updateUserRole(id: $id, role: $role) {
      user { ID user_login role }
      errors
    }
  }
`;

const DELETE_USER_MUTATION = `
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      success errors
    }
  }
`;

let currentRole = '';
let currentSearch = '';

export default async function systemUsers(content, shell) {
  currentRole = '';
  currentSearch = '';
  
  content.innerHTML = `
    <div class="wrap wp-wrap">
      <h1 class="wp-heading-inline">Users</h1>
      <button class="btn btn-primary page-title-action" data-action="add-user">Add New</button>
      
      <div class="tablenav top">
        <div class="alignleft actions bulkactions">
          <select name="bulk-action" id="bulk-action-selector-top">
            <option value="">Bulk actions</option>
            <option value="delete">Delete</option>
          </select>
          <button class="btn btn-secondary" id="bulk-apply-top">Apply</button>
        </div>
        
        <div class="alignleft actions">
          <select name="filter-role" id="filter-role">
            <option value="">All roles</option>
            <option value="administrator">Administrator</option>
            <option value="editor">Editor</option>
            <option value="author">Author</option>
            <option value="contributor">Contributor</option>
            <option value="subscriber">Subscriber</option>
          </select>
          <button class="btn btn-secondary" id="filter-apply">Filter</button>
        </div>
        
        <div class="search-box">
          <input type="search" id="user-search-input" placeholder="Search users..." value="">
          <button class="btn btn-secondary" id="search-submit">Search Users</button>
        </div>
      </div>
      
      ${shell.renderSkeleton()}
    </div>
  `;

  const handlers = {
    'add-user': () => showAddUserModal(shell),
    'change-role': (id, role) => changeRole(id, role),
    'delete': id => deleteUser(id),
    'edit': id => showEditUserModal(id, shell)
  };

  content.addEventListener('change', e => {
    const select = e.target.closest('[data-action="change-role"]');
    if (select) {
      changeRole(select.dataset.id, select.value);
    }
  });

  document.getElementById('bulk-apply-top')?.addEventListener('click', handleBulkAction);
  document.getElementById('filter-apply')?.addEventListener('click', loadUsers);
  document.getElementById('search-submit')?.addEventListener('click', loadUsers);

  async function loadUsers() {
    shell.store.invalidate('users');
    try {
      const data = await shell.gqlRequest(USERS_QUERY);
      let users = data.users || [];
      
      if (currentRole) {
        users = users.filter(u => u.role === currentRole);
      }
      if (currentSearch) {
        const search = currentSearch.toLowerCase();
        users = users.filter(u => 
          u.user_login?.toLowerCase().includes(search) || 
          u.user_email?.toLowerCase().includes(search) ||
          u.display_name?.toLowerCase().includes(search)
        );
      }
      
      shell.store.set('users', data.users);
      renderUsers(users);
    } catch (e) {
      renderUsers([]);
    }
  }

  function renderUsers(users) {
    const roles = ['subscriber', 'contributor', 'author', 'editor', 'administrator'];
    const numUsers = users.length;
    
    const wrap = content.querySelector('.wrap');
    if (!wrap) return;

    wrap.innerHTML = `
      <h1 class="wp-heading-inline">Users</h1>
      <button class="btn btn-primary page-title-action" data-action="add-user">Add New</button>
      
      <div class="tablenav top">
        <div class="alignleft actions bulkactions">
          <select name="bulk-action" id="bulk-action-selector-top">
            <option value="">Bulk actions</option>
            <option value="delete">Delete</option>
          </select>
          <button class="btn btn-secondary" id="bulk-apply-top">Apply</button>
        </div>
        
        <div class="alignleft actions">
          <select name="filter-role" id="filter-role">
            <option value="">All roles</option>
            <option value="administrator" ${currentRole === 'administrator' ? 'selected' : ''}>Administrator</option>
            <option value="editor" ${currentRole === 'editor' ? 'selected' : ''}>Editor</option>
            <option value="author" ${currentRole === 'author' ? 'selected' : ''}>Author</option>
            <option value="contributor" ${currentRole === 'contributor' ? 'selected' : ''}>Contributor</option>
            <option value="subscriber" ${currentRole === 'subscriber' ? 'selected' : ''}>Subscriber</option>
          </select>
          <button class="btn btn-secondary" id="filter-apply">Filter</button>
        </div>
        
        <div class="search-box">
          <input type="search" id="user-search-input" placeholder="Search users..." value="${currentSearch}">
          <button class="btn btn-secondary" id="search-submit">Search Users</button>
        </div>
        
        <div class="tablenav-pages" style="float:right;margin-left:16px;">
          <span class="displaying-num">${numUsers} ${numUsers === 1 ? 'user' : 'users'}</span>
        </div>
      </div>
      
      <table class="wp-list-table widefat fixed striped users">
        <thead>
          <tr>
            <td class="manage-column column-cb check-column">
              <input type="checkbox" class="cb-select-all">
            </td>
            <th class="manage-column column-username column-primary">Username</th>
            <th class="manage-column column-name">Name</th>
            <th class="manage-column column-email">Email</th>
            <th class="manage-column column-role">Role</th>
            <th class="manage-column column-posts">Posts</th>
            <th class="manage-column column-date">Registered</th>
          </tr>
        </thead>
        <tbody>
          ${users.length ? users.map(user => {
            const displayName = user.display_name || user.user_login || 'User';
            const regDate = user.user_registered 
              ? new Date(user.user_registered).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
              : '-';
            
            return `
              <tr class="iedit" data-id="${user.ID}">
                <th class="check-column">
                  <input type="checkbox" class="row-checkbox" value="${user.ID}">
                </th>
                <td class="username column-username has-row-actions column-primary">
                  <strong><a data-action="edit" data-id="${user.ID}">${user.user_login || 'User'}</a></strong>
                  <div class="row-actions">
                    <span class="edit"><a data-action="edit" data-id="${user.ID}">Edit</a> | </span>
                    <span class="delete"><a class="submitdelete" data-action="delete" data-id="${user.ID}">Delete</a></span>
                  </div>
                </td>
                <td class="name column-name">${displayName}</td>
                <td class="email column-email">
                  <a href="mailto:${user.user_email || ''}">${user.user_email || '-'}</a>
                </td>
                <td class="role column-role">
                  <select data-action="change-role" data-id="${user.ID}">
                    ${roles.map(r => `<option value="${r}" ${user.role === r ? 'selected' : ''}>${r.charAt(0).toUpperCase() + r.slice(1)}</option>`).join('')}
                  </select>
                </td>
                <td class="posts column-posts">
                  <span class="post-count">0</span>
                </td>
                <td class="date column-date">
                  <abbr title="${regDate}">${regDate}</abbr>
                </td>
              </tr>
            `;
          }).join('') : `
            <tr class="no-items">
              <td class="colspanchange" colspan="7">
                No users found.
              </td>
            </tr>
          `}
        </tbody>
        <tfoot>
          <tr>
            <td class="manage-column column-cb check-column">
              <input type="checkbox" class="cb-select-all">
            </td>
            <th class="manage-column column-username column-primary">Username</th>
            <th class="manage-column column-name">Name</th>
            <th class="manage-column column-email">Email</th>
            <th class="manage-column column-role">Role</th>
            <th class="manage-column column-posts">Posts</th>
            <th class="manage-column column-date">Registered</th>
          </tr>
        </tfoot>
      </table>
    `;

    document.getElementById('bulk-apply-top')?.addEventListener('click', handleBulkAction);
    document.getElementById('filter-apply')?.addEventListener('click', () => { 
      currentRole = document.getElementById('filter-role')?.value || ''; 
      loadUsers(); 
    });
    document.getElementById('search-submit')?.addEventListener('click', () => { 
      currentSearch = document.getElementById('user-search-input')?.value || ''; 
      loadUsers(); 
    });
    
    document.getElementById('cb-select-all')?.addEventListener('change', (e) => {
      const checked = e.target.checked;
      document.querySelectorAll('.row-checkbox').forEach(cb => { cb.checked = checked; });
    });
  }

  async function handleBulkAction() {
    const action = document.getElementById('bulk-action-selector-top')?.value;
    const checked = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.value);
    
    if (!action || checked.length === 0) return;
    
    if (action === 'delete') {
      if (confirm(`Are you sure you want to delete ${checked.length} user(s)? This cannot be undone.`)) {
        for (const id of checked) {
          try {
            await shell.gqlRequest(DELETE_USER_MUTATION, { id });
          } catch (e) {}
        }
        shell.showToast(`${checked.length} user(s) deleted`, 'success');
        await loadUsers();
      }
    }
  }

  async function changeRole(userId, newRole) {
    try {
      const data = await shell.gqlRequest(UPDATE_ROLE_MUTATION, { id: userId, role: newRole });
      if (data.updateUserRole.errors?.length) {
        shell.showToast(data.updateUserRole.errors[0], 'error');
        return;
      }
      shell.showToast('Role updated', 'success');
      await loadUsers();
    } catch (e) {}
  }

  async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This cannot be undone.')) {
      try {
        await shell.gqlRequest(DELETE_USER_MUTATION, { id: userId });
        shell.showToast('User deleted', 'success');
        await loadUsers();
      } catch (e) {}
    }
  }

  async function showEditUserModal(userId, shell) {
    const users = shell.store.get('users') || [];
    const user = users.find(u => u.ID == userId);
    if (!user) return;
    
    alert('Edit user functionality - redirect to user profile or show modal');
  }

  await loadUsers();
}

async function showAddUserModal(shell) {
  alert('Add new user functionality - show registration form');
}
