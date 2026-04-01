import { parseJsonapi, confirmDelete } from '../api-helpers.js';

let currentView = 'grid';
let currentType = '';
let currentSearch = '';
let currentPage = 1;

export default async function cmsMedia(content, shell) {
  currentView = 'grid';
  currentType = '';
  currentSearch = '';
  currentPage = 1;
  
  content.innerHTML = `
    <div class="wrap wp-wrap">
      <h1 class="wp-heading-inline">Media Library</h1>
      <button class="btn btn-primary page-title-action" id="trigger-upload">Add New</button>
      <input type="file" id="fileUpload" style="display:none" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" multiple>
      
      <div class="tablenav top">
        <div class="alignleft actions bulkactions">
          <select name="bulk-action" id="bulk-action-selector-top">
            <option value="">Bulk actions</option>
            <option value="delete">Delete</option>
          </select>
          <button class="btn btn-secondary" id="bulk-apply-top">Apply</button>
        </div>
        
        <div class="alignleft actions">
          <select name="filter-type" id="filter-type">
            <option value="">All media types</option>
            <option value="image">Images</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="application">Documents</option>
          </select>
          <button class="btn btn-secondary" id="filter-apply">Filter</button>
        </div>
        
        <div class="view-switcher">
          <button class="btn btn-sm view-btn ${currentView === 'grid' ? 'active' : ''}" data-view="grid" title="Grid view">
            <span class="dashicons dashicons-grid-view"></span>
          </button>
          <button class="btn btn-sm view-btn ${currentView === 'list' ? 'active' : ''}" data-view="list" title="List view">
            <span class="dashicons dashicons-list-view"></span>
          </button>
        </div>
        
        <div class="search-box">
          <input type="search" id="media-search-input" placeholder="Search media..." value="">
          <button class="btn btn-secondary" id="search-submit">Search</button>
        </div>
        
        <div class="tablenav-pages">
          <span class="displaying-num">Loading...</span>
          <span class="pagination-links">
            <button class="btn btn-sm" id="prev-page" disabled>&laquo; Previous</button>
            <span class="paging-input">
              Page <span class="current-page">1</span> of <span class="total-pages">1</span>
            </span>
            <button class="btn btn-sm" id="next-page" disabled>Next &raquo;</button>
          </span>
        </div>
      </div>
      
      ${shell.renderSkeleton()}
    </div>
  `;

  const fileInput = content.querySelector('#fileUpload');
  fileInput.addEventListener('change', e => handleUpload(e));

  document.getElementById('trigger-upload')?.addEventListener('click', () => fileInput.click());
  document.getElementById('bulk-apply-top')?.addEventListener('click', handleBulkAction);
  document.getElementById('filter-apply')?.addEventListener('click', () => { currentPage = 1; loadMedia(); });
  document.getElementById('search-submit')?.addEventListener('click', () => { currentPage = 1; currentSearch = document.getElementById('media-search-input').value; loadMedia(); });
  
  content.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'delete') deleteMedia(btn.dataset.id);
    if (btn.dataset.action === 'view') viewMedia(btn.dataset.id);
    if (btn.dataset.action === 'details') {
      const media = shell.store.get('media') || [];
      const item = media.find(m => String(m.id || m.ID) === btn.dataset.id);
      if (item) showAttachmentDetails(item);
    }
  });

  content.addEventListener('click', e => {
    const gridItem = e.target.closest('.media-grid-item');
    if (gridItem && !e.target.closest('[data-action]')) {
      const id = gridItem.dataset.id;
      const media = shell.store.get('media') || [];
      const item = media.find(m => String(m.id || m.ID) === id);
      if (item) showAttachmentDetails(item);
    }
  });

  content.addEventListener('click', e => {
    const viewBtn = e.target.closest('.view-btn');
    if (viewBtn) {
      currentView = viewBtn.dataset.view;
      loadMedia();
    }
  });

  async function handleUpload(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const progressBar = document.createElement('div');
    progressBar.style.cssText = 'position:fixed;top:0;left:0;right:0;height:3px;background:#2271b1;z-index:9999;transition:width 0.3s;width:0';
    document.body.appendChild(progressBar);

    let uploaded = 0;
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const token = localStorage.getItem('jwt_token');
        await fetch('http://localhost:8888/api/v2/media', {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: formData
        });
        uploaded++;
        progressBar.style.width = `${(uploaded / files.length) * 100}%`;
      } catch (e) {}
    }

    setTimeout(() => progressBar.remove(), 500);
    shell.showToast(`${uploaded} file(s) uploaded`, 'success');
    await loadMedia();
    event.target.value = '';
  }

  function showAttachmentDetails(item) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const isImage = item.post_mime_type?.startsWith('image');
    overlay.innerHTML = `
      <div class="modal-content" style="max-width:700px;display:flex;overflow:hidden">
        <div style="flex:1;background:#1d2327;display:flex;align-items:center;justify-content:center;min-height:300px">
          ${isImage && item.guid ? `<img src="${item.guid}" alt="" style="max-width:100%;max-height:400px">` : `<span style="color:#fff;font-size:64px">📄</span>`}
        </div>
        <div style="width:280px;padding:1.5rem;overflow-y:auto;background:#fff">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
            <h3 style="font-size:1rem;font-weight:600">Attachment Details</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="form-group">
            <label style="font-size:11px;color:#646970;text-transform:uppercase">File name</label>
            <p style="font-size:13px">${item.post_title || 'Untitled'}</p>
          </div>
          <div class="form-group">
            <label style="font-size:11px;color:#646970;text-transform:uppercase">File type</label>
            <p style="font-size:13px">${item.post_mime_type || '—'}</p>
          </div>
          <div class="form-group">
            <label style="font-size:11px;color:#646970;text-transform:uppercase">Uploaded on</label>
            <p style="font-size:13px">${item.post_date ? new Date(item.post_date).toLocaleDateString() : '—'}</p>
          </div>
          <div class="form-group">
            <label style="font-size:11px;color:#646970;text-transform:uppercase">File URL</label>
            <input type="text" class="form-control" value="${item.guid || ''}" readonly onclick="this.select()">
          </div>
          <div style="margin-top:1rem">
            <a href="${item.guid}" target="_blank" class="btn btn-secondary" style="width:100%;text-align:center;display:block">View full size</a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  async function handleBulkAction() {
    const action = document.getElementById('bulk-action-selector-top')?.value;
    const checked = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.value);
    
    if (!action || checked.length === 0) return;
    
    if (action === 'delete') {
      confirmDelete(`Delete ${checked.length} file(s)?`, async () => {
        for (const id of checked) {
          try {
            await shell.apiRequest(`/media/${id}`, { method: 'DELETE' });
          } catch (e) {}
        }
        shell.showToast(`${checked.length} file(s) deleted`, 'success');
        await loadMedia();
      });
    }
  }

  async function deleteMedia(mediaId) {
    confirmDelete('Delete this file?', async () => {
      try {
        await shell.apiRequest(`/media/${mediaId}`, { method: 'DELETE' });
        shell.showToast('File deleted', 'success');
        await loadMedia();
      } catch (e) {}
    });
  }

  async function viewMedia(mediaId) {
    const media = shell.store.get('media') || [];
    const item = media.find(m => m.id === mediaId || m.ID == mediaId);
    if (item?.guid) {
      window.open(item.guid, '_blank');
    }
  }

  async function loadMedia() {
    shell.store.invalidate('media');
    content.querySelector('.tablenav-pages')?.classList.add('loading');
    
    try {
      const typeFilter = currentType ? `&media_type=${currentType}` : '';
      const searchFilter = currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : '';
      const response = await shell.apiRequest(`/media?page=${currentPage}&per_page=30${typeFilter}${searchFilter}`);
      const media = parseJsonapi(response);
      
      shell.store.set('media', media);
      renderMedia(media);
    } catch (e) {
      renderMedia([]);
    }
  }

  function renderMedia(media) {
    content.querySelector('.tablenav-pages')?.classList.remove('loading');
    
    const numItems = media.length;
    const displayNum = content.querySelector('.displaying-num');
    if (displayNum) displayNum.textContent = `${numItems} ${numItems === 1 ? 'item' : 'items'}`;
    
    const wrap = content.querySelector('.wrap');
    if (!wrap) return;

    const viewBtns = content.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === currentView);
    });

    const mediaHtml = currentView === 'grid' 
      ? renderGridView(media)
      : renderListView(media);

    wrap.innerHTML = `
      <h1 class="wp-heading-inline">Media Library</h1>
      <button class="btn btn-primary page-title-action" id="trigger-upload">Add New</button>
      <input type="file" id="fileUpload" style="display:none" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" multiple>
      
      <div class="tablenav top">
        <div class="alignleft actions bulkactions">
          <select name="bulk-action" id="bulk-action-selector-top">
            <option value="">Bulk actions</option>
            <option value="delete">Delete</option>
          </select>
          <button class="btn btn-secondary" id="bulk-apply-top">Apply</button>
        </div>
        
        <div class="alignleft actions">
          <select name="filter-type" id="filter-type">
            <option value="">All media types</option>
            <option value="image" ${currentType === 'image' ? 'selected' : ''}>Images</option>
            <option value="video" ${currentType === 'video' ? 'selected' : ''}>Video</option>
            <option value="audio" ${currentType === 'audio' ? 'selected' : ''}>Audio</option>
            <option value="application" ${currentType === 'application' ? 'selected' : ''}>Documents</option>
          </select>
          <button class="btn btn-secondary" id="filter-apply">Filter</button>
        </div>
        
        <div class="view-switcher">
          <button class="btn btn-sm view-btn ${currentView === 'grid' ? 'active' : ''}" data-view="grid" title="Grid view">
            <span class="dashicons dashicons-grid-view"></span>
          </button>
          <button class="btn btn-sm view-btn ${currentView === 'list' ? 'active' : ''}" data-view="list" title="List view">
            <span class="dashicons dashicons-list-view"></span>
          </button>
        </div>
        
        <div class="search-box">
          <input type="search" id="media-search-input" placeholder="Search media..." value="${currentSearch}">
          <button class="btn btn-secondary" id="search-submit">Search</button>
        </div>
        
        <div class="tablenav-pages">
          <span class="displaying-num">${numItems} ${numItems === 1 ? 'item' : 'items'}</span>
        </div>
      </div>
      
      <div class="media-library-view ${currentView}-view">
        ${mediaHtml}
      </div>
      
      <style>
        .media-library-view { min-height: 400px; }
        .media-library-view.grid-view { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
          gap: 16px; 
          padding: 16px; 
        }
        .media-library-view.list-view {
          display: table;
          width: 100%;
          border-collapse: collapse;
        }
        
        .media-grid-item { 
          border: 1px solid #dcdcde; border-radius: 4px; overflow: hidden; 
          background: #fff;
        }
        .media-grid-item:hover { box-shadow: 0 0 0 1px #2271b1; }
        .media-thumbnail { 
          width: 100%; height: 150px; overflow: hidden; background: #f0f0f0; 
          display: flex; align-items: center; justify-content: center;
        }
        .media-thumbnail img { max-width: 100%; max-height: 100%; }
        .media-thumbnail .dashicons { font-size: 64px; width: 64px; height: 64px; color: #888; }
        
        .media-info { padding: 12px; border-top: 1px solid #dcdcde; }
        .media-title { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px; }
        .media-meta { font-size: 12px; color: #646970; margin-top: 4px; }
        
        .media-list-item { display: table-row; }
        .media-list-item:hover { background: #f6f7f7; }
        .media-list-item td { padding: 12px; border-bottom: 1px solid #dcdcde; vertical-align: middle; }
        .media-list-item .check-column { width: 40px; }
        .media-list-item .media-thumb { width: 60px; height: 60px; overflow: hidden; border-radius: 4px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; }
        .media-list-item .media-thumb img { max-width: 100%; max-height: 100%; }
        
        .view-switcher { float: left; margin-right: 16px; display: flex; gap: 4px; }
        .view-btn { padding: 4px 8px; background: #fff; border: 1px solid #dcdcde; }
        .view-btn.active { background: #2271b1; color: #fff; border-color: #2271b1; }
        .dashicons { font-family: dashicons; font-size: 20px; }
        
        .upload-drag-drop {
          border: 2px dashed #dcdcde; border-radius: 8px; padding: 40px; text-align: center;
          margin-bottom: 16px; background: #f6f7f7;
        }
        .upload-drag-drop:hover { border-color: #2271b1; background: #f0f7ff; }
      </style>
    `;

    const newFileInput = content.querySelector('#fileUpload');
    if (newFileInput) newFileInput.addEventListener('change', e => handleUpload(e));
    document.getElementById('trigger-upload')?.addEventListener('click', () => newFileInput?.click());
    document.getElementById('bulk-apply-top')?.addEventListener('click', handleBulkAction);
    document.getElementById('filter-apply')?.addEventListener('click', () => { currentPage = 1; currentType = document.getElementById('filter-type')?.value || ''; loadMedia(); });
    document.getElementById('search-submit')?.addEventListener('click', () => { currentPage = 1; currentSearch = document.getElementById('media-search-input')?.value || ''; loadMedia(); });
    
    content.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => { currentView = btn.dataset.view; loadMedia(); });
    });
  }

  function renderGridView(media) {
    if (!media.length) {
      return `<div class="upload-drag-drop"><p>No media files found. Upload your first file.</p></div>`;
    }
    
    return media.map(item => {
      const isImage = item.post_mime_type?.startsWith('image');
      const thumb = isImage && item.guid 
        ? `<img src="${item.guid}" alt="${item.post_title || ''}" onerror="this.parentElement.innerHTML='<span class=dashicons dashicons-admin-generic"></span>'">`
        : `<span class="dashicons dashicons-admin-generic"></span>`;
      
      const fileSize = item.meta?.filesize ? `${(item.meta.filesize / 1024).toFixed(1)} KB` : '';
      
      return `
        <div class="media-grid-item" data-id="${item.id || item.ID}">
          <div class="media-thumbnail">
            ${thumb}
          </div>
          <div class="media-info">
            <div class="media-title" title="${item.post_title || 'Untitled'}">${item.post_title || 'Untitled'}</div>
            <div class="media-meta">${fileSize}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderListView(media) {
    if (!media.length) {
      return `<div style="padding:40px;text-align:center;color:#646970">No media files found.</div>`;
    }
    
    return `
      <table class="wp-list-table widefat fixed striped">
        <thead>
          <tr>
            <td class="manage-column column-cb check-column">
              <input type="checkbox" class="cb-select-all">
            </td>
            <th class="manage-column column-title column-primary">File</th>
            <th class="manage-column column-author">Author</th>
            <th class="manage-column column-parent">Uploaded to</th>
            <th class="manage-column column-date">Date</th>
          </tr>
        </thead>
        <tbody>
          ${media.map(item => {
            const isImage = item.post_mime_type?.startsWith('image');
            const thumb = isImage && item.guid 
              ? `<img src="${item.guid}" alt="">`
              : `<span class="dashicons dashicons-admin-generic" style="font-size:32px;color:#888"></span>`;
            
            return `
              <tr class="media-list-item" data-id="${item.id || item.ID}">
                <th class="check-column">
                  <input type="checkbox" class="row-checkbox" value="${item.id || item.ID}">
                </th>
                <td class="title column-title">
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div class="media-thumb" style="flex-shrink:0">${thumb}</div>
                    <div>
                      <strong><a data-action="view" data-id="${item.id || item.ID}">${item.post_title || 'Untitled'}</a></strong>
                      <div style="font-size:12px;color:#646970">${item.post_mime_type || ''}</div>
                    </div>
                  </div>
                </td>
                <td class="author column-author">${item.author?.display_name || 'Admin'}</td>
                <td class="parent column-parent">—</td>
                <td class="date column-date">
                  ${item.post_date ? new Date(item.post_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  await loadMedia();
}
