// @ts-check
/// <reference path="../../../../jsdoc/types.js" />
import { confirmDelete } from '../api-helpers.js';

const POST_QUERY = `
  query GetPost($id: ID!) {
    post(id: $id) {
      ID post_title post_content post_excerpt post_status post_date
      author { ID display_name }
    }
  }
`;

const CREATE_POST_MUTATION = `
  mutation CreatePost($title: String!, $content: String, $excerpt: String, $status: String) {
    createPost(title: $title, content: $content, excerpt: $excerpt, status: $status) {
      post { ID post_title }
      errors
    }
  }
`;

const UPDATE_POST_MUTATION = `
  mutation UpdatePost($id: ID!, $title: String, $content: String, $excerpt: String, $status: String) {
    updatePost(id: $id, title: $title, content: $content, excerpt: $excerpt, status: $status) {
      post { ID post_title }
      errors
    }
  }
`;

const DELETE_POST_MUTATION = `
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      success errors
    }
  }
`;

let currentPage = 1;
let currentStatus = '';
let currentSearch = '';
let selectedPosts = [];

export default async function cmsPosts(content, shell) {
  currentPage = 1;
  currentStatus = '';
  currentSearch = '';
  selectedPosts = [];
  
  content.innerHTML = `
    <div class="wrap wp-wrap">
      <h1 class="wp-heading-inline">Posts</h1>
      <button class="btn btn-primary page-title-action" data-action="new-post">Add New</button>
      
      <div class="tablenav top">
        <div class="alignleft actions bulkactions">
          <select name="bulk-action" id="bulk-action-selector-top">
            <option value="">Bulk actions</option>
            <option value="delete">Delete</option>
          </select>
          <button class="btn btn-secondary" id="bulk-apply-top">Apply</button>
        </div>
        
        <div class="alignleft actions">
          <select name="filter-status" id="filter-status">
            <option value="">All statuses</option>
            <option value="publish">Published</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="trash">Trash</option>
          </select>
          <button class="btn btn-secondary" id="filter-apply">Filter</button>
        </div>
        
        <div class="search-box">
          <input type="search" id="post-search-input" placeholder="Search posts..." value="">
          <button class="btn btn-secondary" id="search-submit">Search Posts</button>
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

  const handlers = {
    'new-post': () => showPostModal(null, shell, {}, reload),
    'edit': id => showEditModal(id),
    'delete': id => deletePost(id),
    'view': id => viewPost(id)
  };

  content.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    handlers[btn.dataset.action]?.(btn.dataset.id);
  });

  document.getElementById('bulk-apply-top')?.addEventListener('click', handleBulkAction);
  document.getElementById('filter-apply')?.addEventListener('click', () => { currentPage = 1; loadPosts(); });
  document.getElementById('search-submit')?.addEventListener('click', () => { currentPage = 1; currentSearch = document.getElementById('post-search-input').value; loadPosts(); });
  document.getElementById('prev-page')?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadPosts(); } });
  document.getElementById('next-page')?.addEventListener('click', () => { currentPage++; loadPosts(); });

  async function reload() {
    shell.store.invalidate('posts');
    await loadPosts();
  }

  async function loadPosts() {
    shell.store.invalidate('posts');
    const pageNumEl = content.querySelector('.tablenav-pages');
    if (pageNumEl) pageNumEl.classList.add('loading');
    
    try {
      const statusFilter = currentStatus === 'publish' ? 'publish' : currentStatus;
      const response = await shell.apiRequest(`/posts?page=${currentPage}&per_page=20${statusFilter ? '&status=' + statusFilter : ''}${currentSearch ? '&search=' + encodeURIComponent(currentSearch) : ''}`);
      
      const posts = response.data || [];
      const total = parseInt(response.headers?.get('X-WP-Total') || '0');
      const totalPages = parseInt(response.headers?.get('X-WP-TotalPages') || '1');
      
      shell.store.set('posts', posts);
      renderPosts(posts, total, totalPages);
    } catch (e) {
      renderPosts([], 0, 1);
    }
  }

  function renderPosts(posts, total, totalPages) {
    const pageNumEl = content.querySelector('.tablenav-pages');
    if (pageNumEl) pageNumEl.classList.remove('loading');
    
    const numPosts = posts.length;
    const displayNum = content.querySelector('.displaying-num');
    if (displayNum) displayNum.textContent = `${numPosts} ${numPosts === 1 ? 'item' : 'items'}`;
    const curPage = content.querySelector('.current-page');
    if (curPage) curPage.textContent = currentPage.toString();
    const totPages = content.querySelector('.total-pages');
    if (totPages) totPages.textContent = totalPages.toString();
    const prevBtn = document.getElementById('prev-page');
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    const nextBtn = document.getElementById('next-page');
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

    selectedPosts = [];
    
    const wrap = content.querySelector('.wrap');
    if (!wrap) return;
    
    wrap.innerHTML = `
      <h1 class="wp-heading-inline">Posts</h1>
      <button class="btn btn-primary page-title-action" data-action="new-post">Add New</button>
      
      <div class="tablenav top">
        <div class="alignleft actions bulkactions">
          <select name="bulk-action" id="bulk-action-selector-top">
            <option value="">Bulk actions</option>
            <option value="delete">Delete</option>
          </select>
          <button class="btn btn-secondary" id="bulk-apply-top">Apply</button>
        </div>
        
        <div class="alignleft actions">
          <select name="filter-status" id="filter-status">
            <option value="">All statuses</option>
            <option value="publish" ${currentStatus === 'publish' ? 'selected' : ''}>Published</option>
            <option value="draft" ${currentStatus === 'draft' ? 'selected' : ''}>Draft</option>
            <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="trash" ${currentStatus === 'trash' ? 'selected' : ''}>Trash</option>
          </select>
          <button class="btn btn-secondary" id="filter-apply">Filter</button>
        </div>
        
        <div class="search-box">
          <input type="search" id="post-search-input" placeholder="Search posts..." value="${currentSearch}">
          <button class="btn btn-secondary" id="search-submit">Search Posts</button>
        </div>
        
        <div class="tablenav-pages">
          <span class="displaying-num">${numPosts} ${numPosts === 1 ? 'item' : 'items'}</span>
          <span class="pagination-links">
            <button class="btn btn-sm" id="prev-page" ${currentPage <= 1 ? 'disabled' : ''}>&laquo; Previous</button>
            <span class="paging-input">
              Page <span class="current-page">${currentPage}</span> of <span class="total-pages">${totalPages}</span>
            </span>
            <button class="btn btn-sm" id="next-page" ${currentPage >= totalPages ? 'disabled' : ''}>Next &raquo;</button>
          </span>
        </div>
      </div>
      
      <table class="wp-list-table widefat fixed striped posts">
        <thead>
          <tr>
            <td class="manage-column column-cb check-column">
              <input type="checkbox" id="cb-select-all" class="cb-select-all">
            </td>
            <th class="manage-column column-title column-primary">Title</th>
            <th class="manage-column column-author">Author</th>
            <th class="manage-column column-categories">Categories</th>
            <th class="manage-column column-tags">Tags</th>
            <th class="manage-column column-comments">Comments</th>
            <th class="manage-column column-date">Date</th>
          </tr>
        </thead>
        <tbody>
          ${posts.length ? posts.map(post => {
            const title = post.title?.rendered || post.title?.raw || 'Untitled';
            const date = post.date ? new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
            const author = post.author?.name || 'Admin';
            const categories = post.categories?.map(c => c.name).join(', ') || '—';
            const tags = post.tags?.map(t => t.name).join(', ') || '—';
            
            return `
              <tr class="iedit" data-id="${post.id}">
                <th class="check-column">
                  <input type="checkbox" class="row-checkbox" value="${post.id}">
                </th>
                <td class="title column-title has-row-actions column-primary">
                  <strong>
                    <a class="row-title" data-action="edit" data-id="${post.id}">${title}</a>
                  </strong>
                  <div class="row-actions">
                    <span class="edit"><a data-action="edit" data-id="${post.id}">Edit</a> | </span>
                    <span class="view"><a data-action="view" data-id="${post.id}">View</a> | </span>
                    <span class="trash"><a class="submitdelete" data-action="delete" data-id="${post.id}">Trash</a></span>
                  </div>
                </td>
                <td class="author column-author">${author}</td>
                <td class="categories column-categories">${categories}</td>
                <td class="tags column-tags">${tags}</td>
                <td class="comments column-comments">
                  <span class="comment-count" title="0 comments">0</span>
                </td>
                <td class="date column-date">
                  <abbr title="${date}">${date}</abbr>
                </td>
              </tr>
            `;
          }).join('') : `
            <tr class="no-items">
              <td class="colspanchange" colspan="7">
                No posts found.
              </td>
            </tr>
          `}
        </tbody>
        <tfoot>
          <tr>
            <td class="manage-column column-cb check-column">
              <input type="checkbox" id="cb-select-all-bottom" class="cb-select-all">
            </td>
            <th class="manage-column column-title column-primary">Title</th>
            <th class="manage-column column-author">Author</th>
            <th class="manage-column column-categories">Categories</th>
            <th class="manage-column column-tags">Tags</th>
            <th class="manage-column column-comments">Comments</th>
            <th class="manage-column column-date">Date</th>
          </tr>
        </tfoot>
      </table>
      
      <div class="tablenav bottom">
        <div class="tablenav-pages">
          <span class="displaying-num">${numPosts} ${numPosts === 1 ? 'item' : 'items'}</span>
          <span class="pagination-links">
            <button class="btn btn-sm" id="prev-page-bottom" ${currentPage <= 1 ? 'disabled' : ''}>&laquo; Previous</button>
            <span class="paging-input">
              Page <span class="current-page">${currentPage}</span> of <span class="total-pages">${totalPages}</span>
            </span>
            <button class="btn btn-sm" id="next-page-bottom" ${currentPage >= totalPages ? 'disabled' : ''}>Next &raquo;</button>
          </span>
        </div>
      </div>
    `;

    const bulkApplyTop = document.getElementById('bulk-apply-top');
    if (bulkApplyTop) bulkApplyTop.addEventListener('click', handleBulkAction);
    
    const filterApply = document.getElementById('filter-apply');
    if (filterApply) filterApply.addEventListener('click', () => { currentPage = 1; currentStatus = document.getElementById('filter-status')?.value || ''; loadPosts(); });
    
    const searchSubmit = document.getElementById('search-submit');
    if (searchSubmit) searchSubmit.addEventListener('click', () => { currentPage = 1; currentSearch = document.getElementById('post-search-input')?.value || ''; loadPosts(); });
    
    ['prev-page', 'next-page', 'prev-page-bottom', 'next-page-bottom'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          if (id.includes('prev') && currentPage > 1) { currentPage--; loadPosts(); }
          else if (id.includes('next')) { currentPage++; loadPosts(); }
        });
      }
    });
    
    const cbSelectAll = document.getElementById('cb-select-all');
    if (cbSelectAll) {
      cbSelectAll.addEventListener('change', (e) => {
        const checked = e.target.checked;
        document.querySelectorAll('.row-checkbox').forEach(cb => { cb.checked = checked; });
      });
    }
  }

  async function handleBulkAction() {
    const selectEl = document.getElementById('bulk-action-selector-top');
    const action = selectEl?.value;
    const checked = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.value);
    
    if (!action || checked.length === 0) return;
    
    if (action === 'delete') {
      confirmDelete(`Delete ${checked.length} post(s)?`, async () => {
        for (const id of checked) {
          try {
            await shell.gqlRequest(DELETE_POST_MUTATION, { id });
          } catch (e) {}
        }
        shell.showToast(`${checked.length} post(s) deleted`, 'success');
        await reload();
      });
    }
  }

  async function showEditModal(id) {
    let post = shell.store.find('posts', id);
    if (!post?.post_content && post?.post_content !== '') {
      try {
        const data = await shell.gqlRequest(POST_QUERY, { id });
        post = data.post;
      } catch (e) {
        shell.showToast('Error loading post', 'error');
        return;
      }
    }
    showPostModal(id, shell, post, reload);
  }

  async function viewPost(id) {
    const post = shell.store.find('posts', id);
    const link = post?.link || `http://localhost:8888/posts/${id}`;
    window.open(link, '_blank');
  }

  async function deletePost(id) {
    confirmDelete('Delete this post?', async () => {
      try {
        const data = await shell.gqlRequest(DELETE_POST_MUTATION, { id });
        if (data.deletePost.errors?.length) {
          shell.showToast(data.deletePost.errors[0], 'error');
          return;
        }
        shell.showToast('Post deleted', 'success');
        await reload();
      } catch (e) {}
    });
  }

  await loadPosts();
}

function showPostModal(postId, shell, defaultData, onSaved) {
  const isEdit = !!postId;
  let autosaveTimer = null;
  let autosavedId = postId || null;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:800px">
      <div class="modal-header">
        <h2>${isEdit ? 'Edit Post' : 'Add New Post'}</h2>
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span id="autosave-indicator" style="font-size:12px;color:#646970"></span>
          <button class="modal-close">&times;</button>
        </div>
      </div>
      <div class="modal-body" style="padding:0">
        <div class="wp-editor-container">
          <div class="post-title-row">
            <input type="text" name="title" class="large-text widefat" placeholder="Enter title here" value="${(defaultData.post_title || '').replace(/"/g, '&quot;')}">
          </div>
          <div class="post-content-row">
            <textarea name="content" class="wp-editor-area" rows="15">${defaultData.post_content || ''}</textarea>
          </div>
          <div class="post-excerpt-row">
            <label><strong>Excerpt</strong></label>
            <textarea name="excerpt" class="widefat" rows="3">${defaultData.post_excerpt || ''}</textarea>
            <p class="description">Excerpts are optional hand-crafted summaries of your content.</p>
          </div>
          <div class="post-status-row">
            <fieldset style="display:flex;gap:2rem;flex-wrap:wrap">
              <legend class="screen-reader-text">Status and Format</legend>
              <label>Status:
                <select name="status" class="post-format-select">
                  <option value="draft" ${defaultData.post_status === 'draft' ? 'selected' : ''}>Draft</option>
                  <option value="publish" ${defaultData.post_status === 'publish' ? 'selected' : ''}>Published</option>
                  <option value="pending" ${defaultData.post_status === 'pending' ? 'selected' : ''}>Pending Review</option>
                </select>
              </label>
              <label>Format:
                <select name="post_format" class="post-format-select">
                  <option value="standard">Standard</option>
                  <option value="aside">Aside</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="quote">Quote</option>
                  <option value="link">Link</option>
                  <option value="gallery">Gallery</option>
                  <option value="status">Status</option>
                  <option value="audio">Audio</option>
                  <option value="chat">Chat</option>
                </select>
              </label>
            </fieldset>
          </div>
          ${isEdit ? `
          <div style="padding:12px 16px;border-top:1px solid #dcdcde;background:#f6f7f7;font-size:12px;color:#646970">
            <a href="#" id="view-revisions-link">View revisions</a>
            <span id="revisions-count"></span>
          </div>` : ''}
          <div class="submit-row">
            <button type="button" class="btn btn-secondary" id="preview-btn">Preview</button>
            <div style="display:flex;gap:0.5rem">
              <button type="button" class="btn btn-secondary" id="save-draft-btn">Save Draft</button>
              <button type="button" class="btn btn-primary" id="publish-btn">${isEdit ? 'Update' : 'Publish'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const getFormData = () => ({
    title: overlay.querySelector('[name="title"]').value,
    content: overlay.querySelector('[name="content"]').value,
    excerpt: overlay.querySelector('[name="excerpt"]').value,
    status: overlay.querySelector('[name="status"]').value
  });

  const setAutosaveIndicator = (msg) => {
    const el = overlay.querySelector('#autosave-indicator');
    if (el) el.textContent = msg;
  };

  const doAutosave = async () => {
    const { title, content, excerpt } = getFormData();
    if (!title && !content) return;
    setAutosaveIndicator('Autosaving...');
    try {
      if (autosavedId) {
        await shell.gqlRequest(UPDATE_POST_MUTATION, { id: autosavedId, title, content, excerpt, status: 'draft' });
      } else {
        const data = await shell.gqlRequest(CREATE_POST_MUTATION, { title, content, excerpt, status: 'draft' });
        autosavedId = data.createPost?.post?.ID;
      }
      setAutosaveIndicator(`Draft saved at ${new Date().toLocaleTimeString()}`);
    } catch (e) {
      setAutosaveIndicator('Autosave failed');
    }
  };

  // Autosave every 60 seconds when editing
  const startAutosave = () => {
    autosaveTimer = setInterval(doAutosave, 60000);
  };
  startAutosave();

  const close = () => {
    clearInterval(autosaveTimer);
    overlay.remove();
  };

  overlay.querySelector('.modal-close')?.addEventListener('click', close);

  overlay.querySelector('#preview-btn')?.addEventListener('click', () => {
    const id = autosavedId || postId;
    if (id) window.open(`http://localhost:8888/posts/${id}`, '_blank');
    else shell.showToast('Save a draft first to preview', 'info');
  });

  overlay.querySelector('#save-draft-btn')?.addEventListener('click', async () => {
    const { title, content, excerpt } = getFormData();
    setAutosaveIndicator('Saving...');
    try {
      if (autosavedId) {
        await shell.gqlRequest(UPDATE_POST_MUTATION, { id: autosavedId, title, content, excerpt, status: 'draft' });
        shell.showToast('Draft saved', 'success');
      } else {
        const data = await shell.gqlRequest(CREATE_POST_MUTATION, { title, content, excerpt, status: 'draft' });
        autosavedId = data.createPost?.post?.ID;
        shell.showToast('Draft saved', 'success');
      }
      setAutosaveIndicator(`Draft saved at ${new Date().toLocaleTimeString()}`);
      await onSaved();
    } catch (e) {}
  });

  overlay.querySelector('#publish-btn')?.addEventListener('click', async () => {
    const { title, content, excerpt, status } = getFormData();
    try {
      if (isEdit || autosavedId) {
        const id = autosavedId || postId;
        const data = await shell.gqlRequest(UPDATE_POST_MUTATION, { id, title, content, excerpt, status });
        if (data.updatePost.errors?.length) { shell.showToast(data.updatePost.errors[0], 'error'); return; }
        shell.showToast('Post updated', 'success');
      } else {
        const data = await shell.gqlRequest(CREATE_POST_MUTATION, { title, content, excerpt, status });
        if (data.createPost.errors?.length) { shell.showToast(data.createPost.errors[0], 'error'); return; }
        shell.showToast('Post created', 'success');
      }
      close();
      await onSaved();
    } catch (e) {}
  });

  // Load revision count if editing
  if (isEdit && postId) {
    shell.apiRequest(`/posts/${postId}/revisions`).then(data => {
      const count = (data?.data || data || []).length;
      const el = overlay.querySelector('#revisions-count');
      if (el && count > 0) el.textContent = ` (${count} revision${count !== 1 ? 's' : ''})`;
    }).catch(() => {});
  }
}
