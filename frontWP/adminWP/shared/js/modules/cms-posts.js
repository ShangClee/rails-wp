import { parseJsonapi, renderModal, confirmDelete } from '../api-helpers.js';

export default async function cmsPosts(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Posts</h1>
      <button class="btn btn-primary" onclick="window.cmsPosts_showCreateModal()">Add New</button>
    </div>
    ${shell.renderSkeleton()}
  `;

  // Expose shell and loadPosts to window for button callbacks
  window.shell = shell;
  window.cmsPosts_loadPosts = async () => {
    try {
      const response = await shell.apiRequest('/posts');
      const posts = parseJsonapi(response);
      renderPosts(content, posts, shell);
    } catch (e) {
      renderPosts(content, [], shell);
    }
  };

  window.cmsPosts_showCreateModal = () => showPostModal(null, shell);
  window.cmsPosts_showEditModal = (postId) => {
    // Find the post and show edit modal
    const posts = document.querySelectorAll('table tbody tr');
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    if (postElement) {
      const title = postElement.cells[0].textContent;
      showPostModal(postId, shell, { post_title: title });
    }
  };

  window.cmsPosts_deletePost = (postId) => {
    confirmDelete('Delete this post?', async () => {
      try {
        await shell.apiRequest(`/posts/${postId}`, { method: 'DELETE' });
        shell.showToast('Post deleted', 'success');
        window.cmsPosts_loadPosts();
      } catch (e) {
        shell.showToast('Error deleting post', 'error');
      }
    });
  };

  // Load initial posts
  await window.cmsPosts_loadPosts();
}

function renderPosts(content, posts, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Posts</h1>
      <button class="btn btn-primary" onclick="window.cmsPosts_showCreateModal()">Add New</button>
    </div>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${posts.length ? posts.map(post => `
            <tr data-post-id="${post.id}">
              <td>${post.post_title || 'Untitled'}</td>
              <td>${post.author?.display_name || 'Admin'}</td>
              <td><span class="badge badge-${post.post_status === 'publish' ? 'success' : 'secondary'}">${post.post_status || 'draft'}</span></td>
              <td>${post.post_date ? new Date(post.post_date).toLocaleDateString() : '-'}</td>
              <td>
                <button class="btn btn-sm btn-secondary" onclick="window.cmsPosts_showEditModal(${post.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="window.cmsPosts_deletePost(${post.id})">Delete</button>
              </td>
            </tr>
          `).join('') : '<tr><td colspan="5">No posts found</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

function showPostModal(postId, shell, defaultData = {}) {
  const isEdit = !!postId;
  const title = isEdit ? 'Edit Post' : 'New Post';

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
        <label>Status</label>
        <select name="post_status" class="form-control">
          <option value="draft" ${defaultData.post_status === 'draft' ? 'selected' : ''}>Draft</option>
          <option value="publish" ${defaultData.post_status === 'publish' ? 'selected' : ''}>Published</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary">Save Post</button>
    </form>
  `;

  renderModal(title, formHtml, async (formData) => {
    try {
      const method = isEdit ? 'PATCH' : 'POST';
      const url = isEdit ? `/posts/${postId}` : '/posts';
      const body = JSON.stringify({ post: formData });

      await shell.apiRequest(url, { method, body });
      shell.showToast(isEdit ? 'Post updated' : 'Post created', 'success');
      window.cmsPosts_loadPosts();
    } catch (e) {
      shell.showToast('Error saving post', 'error');
    }
  });
}
