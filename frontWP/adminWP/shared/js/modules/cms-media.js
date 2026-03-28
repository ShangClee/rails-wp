import { parseJsonapi, confirmDelete } from '../api-helpers.js';

export default async function cmsMedia(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Media Library</h1>
      <button class="btn btn-primary" onclick="document.getElementById('fileUpload').click()">Upload</button>
      <input type="file" id="fileUpload" style="display:none" onchange="window.cmsMedia_handleUpload(event)">
    </div>
    ${shell.renderSkeleton()}
  `;

  window.shell = shell;
  window.cmsMedia_loadMedia = async () => {
    try {
      const response = await shell.apiRequest('/media');
      const media = parseJsonapi(response);
      renderMedia(content, media, shell);
    } catch (e) {
      renderMedia(content, [], shell);
    }
  };

  window.cmsMedia_handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('media[filename]', file.name);
    formData.append('media[file]', file);

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${window.shell.API_BASE || 'http://localhost:8888/api/v2'}/media`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (response.ok) {
        window.shell.showToast('File uploaded', 'success');
        window.cmsMedia_loadMedia();
      } else {
        window.shell.showToast('Upload failed', 'error');
      }
    } catch (e) {
      window.shell.showToast('Upload error', 'error');
    }

    // Reset input
    event.target.value = '';
  };

  window.cmsMedia_deleteMedia = (mediaId) => {
    confirmDelete('Delete this file?', async () => {
      try {
        await shell.apiRequest(`/media/${mediaId}`, { method: 'DELETE' });
        shell.showToast('File deleted', 'success');
        window.cmsMedia_loadMedia();
      } catch (e) {
        shell.showToast('Error deleting file', 'error');
      }
    });
  };

  await window.cmsMedia_loadMedia();
}

function renderMedia(content, media, shell) {
  const gridHtml = media.length
    ? media.map(item => `
        <div class="media-grid-item" data-media-id="${item.id}">
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
            <button class="btn btn-sm btn-danger" onclick="window.cmsMedia_deleteMedia(${item.id})">Delete</button>
          </div>
        </div>
      `).join('')
    : `<div style="padding:2rem;text-align:center;color:var(--text-muted)">No media files yet. Upload your first file.</div>`;

  content.innerHTML = `
    <div class="toolbar">
      <h1>Media Library</h1>
      <button class="btn btn-primary" onclick="document.getElementById('fileUpload').click()">Upload</button>
      <input type="file" id="fileUpload" style="display:none" onchange="window.cmsMedia_handleUpload(event)">
    </div>
    <div class="card">
      <div class="media-grid">
        ${gridHtml}
      </div>
    </div>
    <style>
      .media-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 1.5rem;
        padding: 1rem;
      }
      .media-grid-item {
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
      }
      .media-thumbnail {
        width: 100%;
        height: 150px;
        overflow: hidden;
        background: #f5f5f5;
      }
      .media-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .media-info {
        padding: 0.75rem;
        border-bottom: 1px solid #eee;
      }
      .media-title {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 0.9em;
      }
      .media-date {
        font-size: 0.8em;
        color: #666;
        margin-top: 0.25rem;
      }
      .media-actions {
        padding: 0.5rem;
      }
      .media-actions button {
        width: 100%;
      }
    </style>
  `;
}
