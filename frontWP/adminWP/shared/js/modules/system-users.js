export default async function systemUsers(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Users</h1>
      <button class="btn btn-primary" onclick="alert('Add user')">Add New</button>
    </div>
    ${shell.renderSkeleton()}
  `;

  try {
    const users = await shell.apiRequest('/users');
    renderUsers(content, users, shell);
  } catch (e) {
    renderUsers(content, [], shell);
  }
}

function renderUsers(content, users, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Users</h1>
      <button class="btn btn-primary" onclick="alert('Add user')">Add New</button>
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
              <td>${user.username || user.name || 'User'}</td>
              <td>${user.email || '-'}</td>
              <td>${user.role || 'user'}</td>
              <td><span class="badge badge-success">Active</span></td>
            </tr>
          `).join('') : '<tr><td colspan="4">No users found</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}
