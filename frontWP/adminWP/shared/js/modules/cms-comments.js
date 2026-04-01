import { confirmDelete } from '../api-helpers.js';

let currentPage = 1;
let currentStatus = 'all';
let currentSearch = '';
let selectedComments = [];

export default async function cmsComments(content, shell) {
  currentPage = 1;
  currentStatus = 'all';
  currentSearch = '';
  selectedComments = [];

  content.innerHTML = `
    <div class="wrap wp-wrap">
      <h1 class="wp-heading-inline">Comments</h1>

      <div class="subsubsub">
        <a href="#" class="comment-status-link ${currentStatus === 'all' ? 'current' : ''}" data-status="all">All</a> |
        <a href="#" class="comment-status-link ${currentStatus === 'approve' ? 'current' : ''}" data-status="approve">Approved</a> |
        <a href="#" class="comment-status-link ${currentStatus === 'hold' ? 'current' : ''}" data-status="hold">Pending</a> |
        <a href="#" class="comment-status-link ${currentStatus === 'spam' ? 'current' : ''}" data-status="spam">Spam</a> |
        <a href="#" class="comment-status-link ${currentStatus === 'trash' ? 'current' : ''}" data-status="trash">Trash</a>
      </div>

      <div class="tablenav top">
        <div class="alignleft actions bulkactions">
          <select name="bulk-action" id="bulk-action-selector-top">
            <option value="">Bulk actions</option>
            <option value="approve">Approve</option>
            <option value="unapprove">Unapprove</option>
            <option value="spam">Mark as Spam</option>
            <option value="trash">Move to Trash</option>
          </select>
          <button class="btn btn-secondary" id="bulk-apply-top">Apply</button>
        </div>

        <div class="search-box">
          <input type="search" id="comment-search-input" placeholder="Search comments..." value="">
          <button class="btn btn-secondary" id="search-submit">Search Comments</button>
        </div>

        <div class="tablenav-pages">
          <span class="displaying-num">Loading...</span>
          <span class="pagination-links">
            <button class="btn btn-sm" id="prev-page" disabled>&laquo; Previous</button>
            <span class="paging-input">Page <span class="current-page">1</span> of <span class="total-pages">1</span></span>
            <button class="btn btn-sm" id="next-page" disabled>Next &raquo;</button>
          </span>
        </div>
      </div>

      ${shell.renderSkeleton()}
    </div>
  `;

  content.addEventListener('click', e => {
    const link = e.target.closest('.comment-status-link');
    if (link) {
      e.preventDefault();
      currentStatus = link.dataset.status;
      currentPage = 1;
      loadComments();
      return;
    }

    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    switch (btn.dataset.action) {
      case 'approve':   moderateComment(id, 'approve'); break;
      case 'unapprove': moderateComment(id, 'unapprove'); break;
      case 'spam':      moderateComment(id, 'spam'); break;
      case 'trash':     moderateComment(id, 'trash'); break;
      case 'delete':    deleteComment(id); break;
      case 'edit':      showEditModal(id); break;
    }
  });

  document.getElementById('bulk-apply-top')?.addEventListener('click', handleBulkAction);
  document.getElementById('search-submit')?.addEventListener('click', () => {
    currentPage = 1;
    currentSearch = document.getElementById('comment-search-input')?.value || '';
    loadComments();
  });
  document.getElementById('prev-page')?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadComments(); } });
  document.getElementById('next-page')?.addEventListener('click', () => { currentPage++; loadComments(); });

  await loadComments();

  async function loadComments() {
    try {
      const statusParam = currentStatus !== 'all' ? `&status=${currentStatus}` : '';
      const searchParam = currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : '';
      const response = await shell.apiRequest(`/comments?page=${currentPage}&per_page=20${statusParam}${searchParam}`);

      const comments = response.data || [];
      const total = parseInt(response.headers?.get('X-WP-Total') || '0');
      const totalPages = parseInt(response.headers?.get('X-WP-TotalPages') || '1');
      renderComments(comments, total, totalPages);
    } catch (e) {
      renderComments([], 0, 1);
    }
  }

  function renderComments(comments, total, totalPages) {
    const wrap = content.querySelector('.wrap');
    if (!wrap) return;

    wrap.innerHTML = `
      <h1 class="wp-heading-inline">Comments</h1>

      <div class="subsubsub">
        <a href="#" class="comment-status-link ${currentStatus === 'all' ? 'current' : ''}" data-status="all">All</a> |
        <a href="#" class="comment-status-link ${currentStatus === 'approve' ? 'current' : ''}" data-status="approve">Approved</a> |
        <a href="#" class="comment-status-link ${currentStatus === 'hold' ? 'current' : ''}" data-status="hold">Pending</a> |
        <a href="#" class="comment-status-link ${currentStatus === 'spam' ? 'current' : ''}" data-status="spam">Spam</a> |
        <a href="#" class="comment-status-link ${currentStatus === 'trash' ? 'current' : ''}" data-status="trash">Trash</a>
      </div>

      <div class="tablenav top">
        <div class="alignleft actions bulkactions">
          <select name="bulk-action" id="bulk-action-selector-top">
            <option value="">Bulk actions</option>
            <option value="approve">Approve</option>
            <option value="unapprove">Unapprove</option>
            <option value="spam">Mark as Spam</option>
            <option value="trash">Move to Trash</option>
          </select>
          <button class="btn btn-secondary" id="bulk-apply-top">Apply</button>
        </div>

        <div class="search-box">
          <input type="search" id="comment-search-input" placeholder="Search comments..." value="${currentSearch}">
          <button class="btn btn-secondary" id="search-submit">Search Comments</button>
        </div>

        <div class="tablenav-pages">
          <span class="displaying-num">${total} item${total !== 1 ? 's' : ''}</span>
          <span class="pagination-links">
            <button class="btn btn-sm" id="prev-page" ${currentPage <= 1 ? 'disabled' : ''}>&laquo; Previous</button>
            <span class="paging-input">Page <span class="current-page">${currentPage}</span> of <span class="total-pages">${totalPages}</span></span>
            <button class="btn btn-sm" id="next-page" ${currentPage >= totalPages ? 'disabled' : ''}>Next &raquo;</button>
          </span>
        </div>
      </div>

      <table class="wp-list-table widefat fixed striped comments">
        <thead>
          <tr>
            <td class="manage-column column-cb check-column"><input type="checkbox" id="cb-select-all"></td>
            <th class="manage-column column-author">Author</th>
            <th class="manage-column column-comment">Comment</th>
            <th class="manage-column column-response">In Response To</th>
            <th class="manage-column column-date">Submitted On</th>
          </tr>
        </thead>
        <tbody>
          ${comments.length ? comments.map(c => renderCommentRow(c)).join('') : `
            <tr class="no-items">
              <td class="colspanchange" colspan="5">No comments found.</td>
            </tr>
          `}
        </tbody>
      </table>

      <div class="tablenav bottom">
        <div class="tablenav-pages">
          <span class="displaying-num">${total} item${total !== 1 ? 's' : ''}</span>
          <span class="pagination-links">
            <button class="btn btn-sm" id="prev-page-bottom" ${currentPage <= 1 ? 'disabled' : ''}>&laquo; Previous</button>
            <span class="paging-input">Page ${currentPage} of ${totalPages}</span>
            <button class="btn btn-sm" id="next-page-bottom" ${currentPage >= totalPages ? 'disabled' : ''}>Next &raquo;</button>
          </span>
        </div>
      </div>
    `;

    document.getElementById('bulk-apply-top')?.addEventListener('click', handleBulkAction);
    document.getElementById('search-submit')?.addEventListener('click', () => {
      currentPage = 1;
      currentSearch = document.getElementById('comment-search-input')?.value || '';
      loadComments();
    });
    document.getElementById('prev-page')?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadComments(); } });
    document.getElementById('next-page')?.addEventListener('click', () => { currentPage++; loadComments(); });
    document.getElementById('prev-page-bottom')?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadComments(); } });
    document.getElementById('next-page-bottom')?.addEventListener('click', () => { currentPage++; loadComments(); });

    document.getElementById('cb-select-all')?.addEventListener('change', e => {
      document.querySelectorAll('.row-checkbox').forEach(cb => { cb.checked = e.target.checked; });
    });
  }

  function renderCommentRow(c) {
    const author = c.author_name || 'Anonymous';
    const email = c.author_email || '';
    const comment = c.content?.rendered || c.comment_content || '';
    const postTitle = c.post_title || `Post #${c.post}`;
    const date = c.date ? new Date(c.date).toLocaleString() : '-';
    const status = c.status || c.comment_approved;

    const statusLabel = { '1': 'approved', 'approve': 'approved', '0': 'pending', 'hold': 'pending', 'spam': 'spam', 'trash': 'trash' }[status] || status;
    const statusBadge = statusLabel === 'approved' ? '' : `<span class="badge badge-warning">${statusLabel}</span> `;

    return `
      <tr class="iedit comment-item" data-id="${c.id || c.comment_ID}">
        <td class="check-column"><input type="checkbox" class="row-checkbox" value="${c.id || c.comment_ID}"></td>
        <td class="column-author">
          <strong>${author}</strong><br>
          <span class="text-muted" style="font-size:12px">${email}</span>
          <div class="row-actions">
            ${statusLabel !== 'approved' ? `<span><a data-action="approve" data-id="${c.id || c.comment_ID}">Approve</a> | </span>` : ''}
            ${statusLabel === 'approved' ? `<span><a data-action="unapprove" data-id="${c.id || c.comment_ID}">Unapprove</a> | </span>` : ''}
            <span><a data-action="edit" data-id="${c.id || c.comment_ID}">Edit</a> | </span>
            ${statusLabel !== 'spam' ? `<span><a data-action="spam" data-id="${c.id || c.comment_ID}" class="submitdelete">Spam</a> | </span>` : ''}
            <span><a data-action="trash" data-id="${c.id || c.comment_ID}" class="submitdelete">Trash</a> | </span>
            <span><a data-action="delete" data-id="${c.id || c.comment_ID}" class="submitdelete">Delete Permanently</a></span>
          </div>
        </td>
        <td class="column-comment">
          ${statusBadge}${comment.substring(0, 200)}${comment.length > 200 ? '…' : ''}
        </td>
        <td class="column-response">${postTitle}</td>
        <td class="column-date">${date}</td>
      </tr>
    `;
  }

  async function moderateComment(id, action) {
    try {
      await shell.apiRequest(`/comments/${id}/${action}`, { method: 'PATCH' });
      shell.showToast(`Comment ${action}d`, 'success');
      await loadComments();
    } catch (e) {
      shell.showToast(`Failed to ${action} comment`, 'error');
    }
  }

  async function deleteComment(id) {
    confirmDelete('Permanently delete this comment?', async () => {
      try {
        await shell.apiRequest(`/comments/${id}`, { method: 'DELETE' });
        shell.showToast('Comment deleted', 'success');
        await loadComments();
      } catch (e) {
        shell.showToast('Failed to delete comment', 'error');
      }
    });
  }

  async function showEditModal(id) {
    try {
      const response = await shell.apiRequest(`/comments/${id}`);
      const c = response.data || response;

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-content" style="max-width:500px">
          <div class="modal-header">
            <h2>Edit Comment</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Comment</label>
              <textarea class="form-control" name="comment_content" rows="6">${c.content?.rendered || c.comment_content || ''}</textarea>
            </div>
            <div class="form-group">
              <label>Status</label>
              <select class="form-control" name="comment_approved">
                <option value="1" ${(c.status || c.comment_approved) === '1' || (c.status || c.comment_approved) === 'approve' ? 'selected' : ''}>Approved</option>
                <option value="0" ${(c.status || c.comment_approved) === '0' || (c.status || c.comment_approved) === 'hold' ? 'selected' : ''}>Pending</option>
                <option value="spam" ${(c.status || c.comment_approved) === 'spam' ? 'selected' : ''}>Spam</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" id="modal-cancel">Cancel</button>
            <button class="btn btn-primary" id="modal-save">Update Comment</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.querySelector('.modal-close')?.addEventListener('click', () => overlay.remove());
      overlay.querySelector('#modal-cancel')?.addEventListener('click', () => overlay.remove());
      overlay.querySelector('#modal-save')?.addEventListener('click', async () => {
        const content_val = overlay.querySelector('[name="comment_content"]').value;
        const approved_val = overlay.querySelector('[name="comment_approved"]').value;
        try {
          await shell.apiRequest(`/comments/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ comment: { comment_content: content_val, comment_approved: approved_val } })
          });
          shell.showToast('Comment updated', 'success');
          overlay.remove();
          await loadComments();
        } catch (e) {
          shell.showToast('Failed to update comment', 'error');
        }
      });
    } catch (e) {
      shell.showToast('Error loading comment', 'error');
    }
  }

  async function handleBulkAction() {
    const action = document.getElementById('bulk-action-selector-top')?.value;
    const checked = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.value);

    if (!action || !checked.length) return;

    if (action === 'approve' || action === 'unapprove' || action === 'spam' || action === 'trash') {
      for (const id of checked) {
        try { await shell.apiRequest(`/comments/${id}/${action}`, { method: 'PATCH' }); } catch (e) {}
      }
      shell.showToast(`${checked.length} comment(s) ${action}d`, 'success');
      await loadComments();
    }
  }
}
