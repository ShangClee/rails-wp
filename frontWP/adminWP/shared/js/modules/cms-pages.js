import { parseJsonapi, renderModal, confirmDelete } from '../api-helpers.js';

export default async function cmsPages(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Pages</h1>
      <button class="btn btn-primary" onclick="window.cmsPages_showCreateModal()">Add New</button>
    </div>
    ${shell.renderSkeleton()}
  `;

  window.shell = shell;
  window.cmsPages_loadPages = async () => {
    try {
      const response = await shell.apiRequest('/pages');
      const pages = parseJsonapi(response);
      renderPages(content, pages, shell);
    } catch (e) {
      renderPages(content, [], shell);
    }
  };

  window.cmsPages_showCreateModal = () => showPageModal(null, shell);
  window.cmsPages_showEditModal = (pageId) => showPageModal(pageId, shell);
  window.cmsPages_deletePage = (pageId) => {
    confirmDelete('Delete this page?', async () => {
      try {
        await shell.apiRequest(`/pages/${pageId}`, { method: 'DELETE' });
        shell.showToast('Page deleted', 'success');
        window.cmsPages_loadPages();
      } catch (e) {
        shell.showToast('Error deleting page', 'error');
      }
    });
  };

  await window.cmsPages_loadPages();
}

function renderPages(content, pages, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Pages</h1>
      <button class="btn btn-primary" onclick="window.cmsPages_showCreateModal()">Add New</button>
    </div>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Parent</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${pages.length ? pages.map(page => `
            <tr data-page-id="${page.id}">
              <td>${page.post_title || 'Untitled'}</td>
              <td><span class="badge badge-${page.post_status === 'publish' ? 'success' : 'secondary'}">${page.post_status || 'draft'}</span></td>
              <td>${page.post_parent || '-'}</td>
              <td>${page.post_date ? new Date(page.post_date).toLocaleDateString() : '-'}</td>
              <td>
                <button class="btn btn-sm btn-secondary" onclick="window.cmsPages_showEditModal(${page.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="window.cmsPages_deletePage(${page.id})">Delete</button>
              </td>
            </tr>
          `).join('') : '<tr><td colspan="5">No pages found</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

async function showPageModal(pageId, shell, defaultData = {}) {
  const isEdit = !!pageId;
  const title = isEdit ? 'Edit Page' : 'New Page';

  // Get list of pages for parent dropdown
  let parentPages = [];
  try {
    const response = await shell.apiRequest('/pages');
    parentPages = parseJsonapi(response);
  } catch (e) {
    // Continue without parent pages
  }

  // If editing, fetch the page data
  if (isEdit && !defaultData.post_title) {
    try {
      const response = await shell.apiRequest(`/pages/${pageId}`);
      const data = parseJsonapi(response);
      defaultData = Array.isArray(data) ? data[0] : data;
    } catch (e) {
      shell.showToast('Error loading page', 'error');
      return;
    }
  }

  const formHtml = `
    <form>
      <div class="form-group">
        <label>Title *</label>
        <input type="text" name="post_title" class="form-control" value="${defaultData.post_title || ''}" required>
      </div>
      <div class="form-group">
        <label>Content</label>
        <textarea name="post_content" class="form-control" rows="6">${defaultData.post_content || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Excerpt</label>
        <textarea name="post_excerpt" class="form-control" rows="2">${defaultData.post_excerpt || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Parent Page</label>
        <select name="post_parent" class="form-control">
          <option value="">None</option>
          ${parentPages.filter(p => p.id !== pageId).map(p => `
            <option value="${p.id}" ${defaultData.post_parent == p.id ? 'selected' : ''}>${p.post_title}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select name="post_status" class="form-control">
          <option value="draft" ${defaultData.post_status === 'draft' ? 'selected' : ''}>Draft</option>
          <option value="publish" ${defaultData.post_status === 'publish' ? 'selected' : ''}>Published</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary">Save Page</button>
    </form>
  `;

  renderModal(title, formHtml, async (formData) => {
    try {
      const method = isEdit ? 'PATCH' : 'POST';
      const url = isEdit ? `/pages/${pageId}` : '/pages';
      const body = JSON.stringify({ page: formData });

      await shell.apiRequest(url, { method, body });
      shell.showToast(isEdit ? 'Page updated' : 'Page created', 'success');
      window.cmsPages_loadPages();
    } catch (e) {
      shell.showToast('Error saving page', 'error');
    }
  });
}
