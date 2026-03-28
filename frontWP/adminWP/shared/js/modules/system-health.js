export default async function systemHealth(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>System Health</h1>
    </div>
    ${shell.renderSkeleton()}
  `;

  try {
    const health = await shell.apiRequest('/health');
    renderHealth(content, health, shell);
  } catch (e) {
    renderHealth(content, null, shell);
  }
}

function renderHealth(content, health, shell) {
  if (!health) {
    content.innerHTML = `
      <div class="toolbar">
        <h1>System Health</h1>
      </div>
      <div class="card">
        <div style="padding:2rem;color:#dc3545;">
          Unable to fetch health data. API may be down.
        </div>
      </div>
    `;
    return;
  }

  const dbBadge = health.database?.status === 'connected' ? 'success' : 'danger';
  const redisBadge = health.redis?.status === 'connected' ? 'success' : 'danger';
  const stats = health.content_stats || {};

  content.innerHTML = `
    <div class="toolbar">
      <h1>System Health</h1>
    </div>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th>Status</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Database</td>
            <td><span class="badge badge-${dbBadge}">${health.database?.status || 'unknown'}</span></td>
            <td>${health.database?.error || 'Connected'}</td>
          </tr>
          <tr>
            <td>Redis</td>
            <td><span class="badge badge-${redisBadge}">${health.redis?.status || 'unknown'}</span></td>
            <td>${health.redis?.error || 'Connected'}</td>
          </tr>
        </tbody>
      </table>

      <h3 style="margin-top:2rem;">Content Statistics</h3>
      <table>
        <tr>
          <td style="padding:0.5rem; border-bottom:1px solid #eee;"><strong>Posts</strong></td>
          <td style="padding:0.5rem; border-bottom:1px solid #eee;">${stats.posts || 0}</td>
        </tr>
        <tr>
          <td style="padding:0.5rem; border-bottom:1px solid #eee;"><strong>Pages</strong></td>
          <td style="padding:0.5rem; border-bottom:1px solid #eee;">${stats.pages || 0}</td>
        </tr>
        <tr>
          <td style="padding:0.5rem; border-bottom:1px solid #eee;"><strong>Media</strong></td>
          <td style="padding:0.5rem; border-bottom:1px solid #eee;">${stats.media || 0}</td>
        </tr>
        <tr>
          <td style="padding:0.5rem; border-bottom:1px solid #eee;"><strong>Users</strong></td>
          <td style="padding:0.5rem; border-bottom:1px solid #eee;">${stats.users || 0}</td>
        </tr>
        <tr>
          <td style="padding:0.5rem;"><strong>Comments</strong></td>
          <td style="padding:0.5rem;">${stats.comments || 0}</td>
        </tr>
      </table>

      <div style="margin-top:2rem; color:#666; font-size:0.85em;">
        Last updated: ${health.timestamp || new Date().toISOString()}
      </div>
    </div>
  `;
}
