// @ts-check
/// <reference path="../../../../jsdoc/types.js" />

const USERS_QUERY = `
  query GetUsers {
    users { ID role }
  }
`;

const ROLE_DESCRIPTIONS = {
  administrator: 'Full access to all features',
  editor: 'Can manage all content',
  author: 'Can create and publish posts',
  contributor: 'Can create unpublished content',
  subscriber: 'Can only view content'
};

export default async function systemRoles(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Roles</h1>
    </div>
    ${shell.renderSkeleton()}
  `;

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

  const roleCounts = { administrator: 0, editor: 0, author: 0, contributor: 0, subscriber: 0 };
  users.forEach(user => {
    const role = user.role || 'subscriber';
    if (Object.prototype.hasOwnProperty.call(roleCounts, role)) {
      roleCounts[role]++;
    }
  });

  content.innerHTML = `
    <div class="toolbar">
      <h1>Roles</h1>
    </div>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>Users</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(roleCounts).map(([role, count]) => `
            <tr>
              <td><strong>${role.charAt(0).toUpperCase() + role.slice(1)}</strong></td>
              <td>${count}</td>
              <td>${ROLE_DESCRIPTIONS[role] || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
