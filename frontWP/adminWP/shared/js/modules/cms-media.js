import { parseJsonapi, confirmDelete } from '../api-helpers.js';

export default async function cmsMedia(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Media Library</h1>
      <button class="btn btn-primary" data-action="trigger-upload">Upload</button>
      <input type="file" id="fileUpload" style="display:none">
    </div>
    ${shell.renderSkeleton()}
  `;

  // Wire file input directly (not via window global)
  const fileInput = content.querySelector('#fileUpload');
  fileInput.addEventListener('change', e => handleUpload(e));

  content.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'trigger-upload') fileInput.click();
    if (btn.dataset.action === 'delete') deleteMedia(btn.dataset.id);
  });

  async function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('media[filename]', file.name);
    formData.append('media[file]', file);

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch('http://localhost:8888/api/v2/media', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (response.ok) {
        shell.showToast('File uploaded', 'success');
        await loadMedia();
      } else {
        shell.showToast('Upload failed', 'error');
      }
    } catch (e) {
      shell.showToast('Upload error', 'error');
    }

    event.target.value = '';
  }

  async function deleteMedia(mediaId) {
    confirmDelete('Delete this file?', async () => {
      try {
        await shell.apiRequest(`/media/${mediaId}`, { method: 'DELETE' });
        shell.showToast('File deleted', 'success');
        await loadMedia();
      } catch (e) {
        // toast already shown
      }
    });
  }

  async function loadMedia() {
    try {
      const response = await shell.apiRequest('/media');
      const media = parseJsonapi(response);
      renderMedia(media);
    } catch (e) {
      renderMedia([]);
    }
  }

  function renderMedia(media) {
    const gridHtml = media.length
      ? media.map(item => `
          <div class="media-grid-item">
            <div class="media-thumbnail">
              <img src="${item.guid || 'https://via.placeholder.com/200?text=No+Image'}"
                   alt="${item.post_title}"
                   onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
            </div>
            <div class="media-info">
              <div class="media-title">${item.post_title || 'Untitled'}</div>
              <div class="media-date">${item.post_date ? new Date(item.post_date).toLocaleDateString() : ''}</div>
            </div>
            <div class="media-actions">
              <button class="btn btn-sm btn-danger" data-action="delete" data-id="${item.id}">Delete</button>
            </div>
          </div>
        `).join('')
      : `<div style="padding:2rem;text-align:center;color:var(--text-muted)">No media files yet. Upload your first file.</div>`;

    content.innerHTML = `
      <div class="toolbar">
        <h1>Media Library</h1>
        <button class="btn btn-primary" data-action="trigger-upload">Upload</button>
        <input type="file" id="fileUpload" style="display:none">
      </div>
      <div class="card">
        <div class="media-grid">
          ${gridHtml}
        </div>
      </div>
      <style>
        .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1.5rem; padding: 1rem; }
        .media-grid-item { border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
        .media-thumbnail { width: 100%; height: 150px; overflow: hidden; background: #f5f5f5; }
        .media-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
        .media-info { padding: 0.75rem; border-bottom: 1px solid #eee; }
        .media-title { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.9em; }
        .media-date { font-size: 0.8em; color: #666; margin-top: 0.25rem; }
        .media-actions { padding: 0.5rem; }
        .media-actions button { width: 100%; }
      </style>
    `;

    // Re-wire file input after innerHTML replacement
    const newFileInput = content.querySelector('#fileUpload');
    if (newFileInput) newFileInput.addEventListener('change', e => handleUpload(e));
  }

  await loadMedia();
}
