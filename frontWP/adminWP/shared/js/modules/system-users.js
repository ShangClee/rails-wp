import { parseJsonapi } from '../api-helpers.js';

export default async function systemUsers(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Users</h1>
      <button class="btn btn-primary" onclick="alert('Add user')">Add New</button>
    </div>
    ${shell.renderSkeleton()}
  `;

  try {
    const response = await shell.apiRequest('/users');
    const users = parseJsonapi(response);
    renderUsers(content, users, shell);
  } catch (e) {
    renderUsers(content, [], shell);
  }
}

function renderUsers(content, users, shell) {
  window.systemUsers_changeRole = async (userId, newRole) => {
    try {
      await shell.apiRequest(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ user: { role: newRole } })
      });
      shell.showToast('Role updated', 'success');
      // Reload users
      const response = await shell.apiRequest('/users');
      const updated = parseJsonapi(response);
      renderUsers(content, updated, shell);
    } catch (e) {
      shell.showToast('Error updating role', 'error');
    }
  };

  content.innerHTML = `
    <div class="toolbar">
      <h1>Users</h1>
      <button class="btn btn-primary" onclick="alert('Add user - not yet implemented')">Add New</button>
    </div>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.length ? users.map(user => `
            <tr>
              <td>${user.user_login || 'User'}</td>
              <td>${user.user_email || '-'}</td>
              <td>
                <select class="form-control" style="width: auto;" onchange="window.systemUsers_changeRole(${user.id}, this.value)">
                  <option value="subscriber" ${user.roles === 'subscriber' ? 'selected' : ''}>Subscriber</option>
                  <option value="contributor" ${user.roles === 'contributor' ? 'selected' : ''}>Contributor</option>
                  <option value="author" ${user.roles === 'author' ? 'selected' : ''}>Author</option>
                  <option value="editor" ${user.roles === 'editor' ? 'selected' : ''}>Editor</option>
                  <option value="administrator" ${user.roles === 'administrator' ? 'selected' : ''}>Administrator</option>
                </select>
              </td>
              <td><span class="badge badge-success">Active</span></td>
              <td><!-- Edit button would go here --></td>
            </tr>
          `).join('') : '<tr><td colspan="5">No users found</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}
