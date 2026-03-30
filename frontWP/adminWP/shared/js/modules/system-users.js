// @ts-check
/// <reference path="../../../../jsdoc/types.js" />

const USERS_QUERY = `
  query GetUsers {
    users {
      ID user_login user_email display_name role
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

export default async function systemUsers(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Users</h1>
    </div>
    ${shell.renderSkeleton()}
  `;

  content.addEventListener('change', e => {
    const select = e.target.closest('[data-action="change-role"]');
    if (!select) return;
    changeRole(select.dataset.id, select.value);
  });

  async function changeRole(userId, newRole) {
    try {
      const data = await shell.gqlRequest(UPDATE_ROLE_MUTATION, { id: userId, role: newRole });
      if (data.updateUserRole.errors?.length) {
        shell.showToast(data.updateUserRole.errors[0], 'error');
        return;
      }
      shell.showToast('Role updated', 'success');
      shell.store.invalidate('users');
      await loadUsers();
    } catch (e) {
      // toast already shown
    }
  }

  async function loadUsers() {
    let users = shell.store.get('users');
    if (!users) {
      try {
        const data = await shell.gqlRequest(USERS_QUERY);
        users = data.users;
        shell.store.set('users', users);
      } catch (e) {
        users = [];
      }
    }
    renderUsers(users);
  }

  function renderUsers(users) {
    const roles = ['subscriber', 'contributor', 'author', 'editor', 'administrator'];
    content.innerHTML = `
      <div class="toolbar">
        <h1>Users</h1>
      </div>
      <div class="card">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${users.length ? users.map(user => `
              <tr>
                <td>${user.user_login || 'User'}</td>
                <td>${user.user_email || '-'}</td>
                <td>
                  <select class="form-control" style="width: auto;" data-action="change-role" data-id="${user.ID}">
                    ${roles.map(r => `<option value="${r}" ${user.role === r ? 'selected' : ''}>${r.charAt(0).toUpperCase() + r.slice(1)}</option>`).join('')}
                  </select>
                </td>
                <td><span class="badge badge-success">Active</span></td>
              </tr>
            `).join('') : '<tr><td colspan="4">No users found</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  await loadUsers();
}
