export default async function systemSettings(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Settings</h1>
      <button class="btn btn-primary" onclick="alert('Save settings')">Save</button>
    </div>
    <div class="card" style="padding:1.5rem">
      <div style="margin-bottom:1rem">
        <label style="display:block;margin-bottom:0.5rem;font-weight:500">Site Name</label>
        <input type="text" value="My Site" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:4px">
      </div>
      <div style="margin-bottom:1rem">
        <label style="display:block;margin-bottom:0.5rem;font-weight:500">Site URL</label>
        <input type="text" value="http://localhost:8080" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:4px">
      </div>
      <div>
        <label style="display:block;margin-bottom:0.5rem;font-weight:500">Timezone</label>
        <select style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:4px">
          <option>UTC</option>
          <option>America/New_York</option>
          <option>Europe/London</option>
        </select>
      </div>
    </div>
  `;
}
