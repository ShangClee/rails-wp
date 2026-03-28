import { parseJsonapi } from '../api-helpers.js';

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

  try {
    const response = await shell.apiRequest('/users');
    const users = parseJsonapi(response);
    renderRoles(content, users, shell);
  } catch (e) {
    renderRoles(content, [], shell);
  }
}

function renderRoles(content, users, shell) {
  // Compute role counts
  const roleCounts = {
    administrator: 0,
    editor: 0,
    author: 0,
    contributor: 0,
    subscriber: 0
  };

  users.forEach(user => {
    const role = user.roles || 'subscriber';
    if (roleCounts.hasOwnProperty(role)) {
      roleCounts[role]++;
    }
  });

  const rolesList = Object.entries(roleCounts).map(([role, count]) => `
    <tr>
      <td><strong>${role.charAt(0).toUpperCase() + role.slice(1)}</strong></td>
      <td>${count}</td>
      <td>${ROLE_DESCRIPTIONS[role] || ''}</td>
    </tr>
  `).join('');

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
          ${rolesList}
        </tbody>
      </table>
    </div>
  `;
}
