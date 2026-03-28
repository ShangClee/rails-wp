export default async function systemSettings(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Settings</h1>
    </div>
    ${shell.renderSkeleton()}
  `;

  try {
    const response = await shell.apiRequest('/settings');
    renderSettings(content, response.data, shell);
  } catch (e) {
    renderSettings(content, {}, shell);
  }
}

function renderSettings(content, settings, shell) {
  window.systemSettings_save = async () => {
    const form = document.querySelector('form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      await shell.apiRequest('/settings', {
        method: 'PATCH',
        body: JSON.stringify({ settings: data })
      });
      shell.showToast('Settings saved', 'success');
    } catch (e) {
      shell.showToast('Error saving settings', 'error');
    }
  };

  content.innerHTML = `
    <div class="toolbar">
      <h1>Settings</h1>
      <button class="btn btn-primary" onclick="window.systemSettings_save()">Save</button>
    </div>
    <div class="card" style="padding:1.5rem">
      <form>
        <div style="margin-bottom:1.5rem">
          <label style="display:block;margin-bottom:0.5rem;font-weight:500">Site Name *</label>
          <input type="text" name="blogname" class="form-control" value="${settings.blogname || ''}" required>
        </div>

        <div style="margin-bottom:1.5rem">
          <label style="display:block;margin-bottom:0.5rem;font-weight:500">Tagline</label>
          <input type="text" name="blogdescription" class="form-control" value="${settings.blogdescription || ''}">
        </div>

        <div style="margin-bottom:1.5rem">
          <label style="display:block;margin-bottom:0.5rem;font-weight:500">Site URL *</label>
          <input type="url" name="siteurl" class="form-control" value="${settings.siteurl || ''}" required>
        </div>

        <div style="margin-bottom:1.5rem">
          <label style="display:block;margin-bottom:0.5rem;font-weight:500">Admin Email *</label>
          <input type="email" name="admin_email" class="form-control" value="${settings.admin_email || ''}" required>
        </div>

        <div style="margin-bottom:1.5rem">
          <label style="display:block;margin-bottom:0.5rem;font-weight:500">Timezone</label>
          <select name="timezone_string" class="form-control">
            <option value="UTC" ${settings.timezone_string === 'UTC' ? 'selected' : ''}>UTC</option>
            <option value="America/New_York" ${settings.timezone_string === 'America/New_York' ? 'selected' : ''}>Eastern Time (US)</option>
            <option value="America/Chicago" ${settings.timezone_string === 'America/Chicago' ? 'selected' : ''}>Central Time (US)</option>
            <option value="America/Denver" ${settings.timezone_string === 'America/Denver' ? 'selected' : ''}>Mountain Time (US)</option>
            <option value="America/Los_Angeles" ${settings.timezone_string === 'America/Los_Angeles' ? 'selected' : ''}>Pacific Time (US)</option>
            <option value="Europe/London" ${settings.timezone_string === 'Europe/London' ? 'selected' : ''}>London</option>
            <option value="Europe/Paris" ${settings.timezone_string === 'Europe/Paris' ? 'selected' : ''}>Paris</option>
            <option value="Asia/Tokyo" ${settings.timezone_string === 'Asia/Tokyo' ? 'selected' : ''}>Tokyo</option>
          </select>
        </div>

        <div style="margin-bottom:1.5rem">
          <label style="display:block;margin-bottom:0.5rem;font-weight:500">Posts Per Page</label>
          <input type="number" name="posts_per_page" class="form-control" value="${settings.posts_per_page || '10'}" min="1">
        </div>

        <div style="margin-bottom:1.5rem">
          <label style="display:block;margin-bottom:0.5rem;font-weight:500">Default Comment Status</label>
          <select name="default_comment_status" class="form-control">
            <option value="open" ${settings.default_comment_status === 'open' ? 'selected' : ''}>Open</option>
            <option value="closed" ${settings.default_comment_status === 'closed' ? 'selected' : ''}>Closed</option>
          </select>
        </div>

        <button type="button" class="btn btn-primary" onclick="window.systemSettings_save()">Save Settings</button>
      </form>
    </div>
  `;
}
