export default async function systemHealth(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>System Health</h1>
      <button class="btn btn-secondary" data-action="refresh">Refresh</button>
    </div>
    ${shell.renderSkeleton()}
  `;

  content.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'refresh') load();
  });

  async function load() {
    try {
      const health = await shell.apiRequest('/health');
      render(health);
    } catch (e) {
      render(null);
    }
  }

  function render(health) {
    if (!health) {
      content.innerHTML = `
        <div class="toolbar">
          <h1>System Health</h1>
          <button class="btn btn-secondary" data-action="refresh">Refresh</button>
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
        <button class="btn btn-secondary" data-action="refresh">Refresh</button>
      </div>
      <div class="card">
        <table>
          <thead>
            <tr><th>Component</th><th>Status</th><th>Details</th></tr>
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
          ${[['Posts', stats.posts], ['Pages', stats.pages], ['Media', stats.media], ['Users', stats.users], ['Comments', stats.comments]].map(([label, val]) => `
            <tr>
              <td style="padding:0.5rem;border-bottom:1px solid #eee;"><strong>${label}</strong></td>
              <td style="padding:0.5rem;border-bottom:1px solid #eee;">${val || 0}</td>
            </tr>
          `).join('')}
        </table>

        <div style="margin-top:2rem;color:#666;font-size:0.85em;">
          Last updated: ${health.timestamp || new Date().toISOString()}
        </div>
      </div>
    `;
  }

  await load();
}
