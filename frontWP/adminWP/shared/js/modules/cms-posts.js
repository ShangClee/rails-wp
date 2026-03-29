import { renderModal, confirmDelete } from '../api-helpers.js';

const ADMIN_POSTS_QUERY = `
  query AdminPosts($limit: Int, $offset: Int, $status: String) {
    adminPosts(limit: $limit, offset: $offset, status: $status) {
      ID post_title post_status post_date
      author { display_name }
    }
  }
`;

const POST_QUERY = `
  query GetPost($id: ID!) {
    post(id: $id) {
      ID post_title post_content post_excerpt post_status
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

export default async function cmsPosts(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Posts</h1>
      <button class="btn btn-primary" data-action="new-post">Add New</button>
    </div>
    ${shell.renderSkeleton()}
  `;

  const handlers = {
    'new-post': () => showPostModal(null, shell, {}, reload),
    'edit': id => showEditModal(id),
    'delete': id => deletePost(id)
  };

  content.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    handlers[btn.dataset.action]?.(btn.dataset.id);
  });

  async function reload() {
    shell.store.invalidate('posts');
    await loadPosts();
  }

  async function loadPosts() {
    let posts = shell.store.get('posts');
    if (!posts) {
      try {
        const data = await shell.gqlRequest(ADMIN_POSTS_QUERY, { limit: 50, offset: 0 });
        posts = data.adminPosts;
        shell.store.set('posts', posts);
      } catch (e) {
        posts = [];
      }
    }
    renderPosts(posts);
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
      } catch (e) {
        // toast already shown by gqlRequest
      }
    });
  }

  function renderPosts(posts) {
    content.innerHTML = `
      <div class="toolbar">
        <h1>Posts</h1>
        <button class="btn btn-primary" data-action="new-post">Add New</button>
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
              <tr>
                <td>${post.post_title || 'Untitled'}</td>
                <td>${post.author?.display_name || 'Admin'}</td>
                <td><span class="badge badge-${post.post_status === 'publish' ? 'success' : 'secondary'}">${post.post_status || 'draft'}</span></td>
                <td>${post.post_date ? new Date(post.post_date).toLocaleDateString() : '-'}</td>
                <td>
                  <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${post.ID}">Edit</button>
                  <button class="btn btn-sm btn-danger" data-action="delete" data-id="${post.ID}">Delete</button>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="5">No posts found</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  await loadPosts();
}

function showPostModal(postId, shell, defaultData, onSaved) {
  const isEdit = !!postId;
  renderModal(isEdit ? 'Edit Post' : 'New Post', `
    <form>
      <div class="form-group">
        <label>Title *</label>
        <input type="text" name="title" class="form-control" value="${defaultData.post_title || ''}" required>
      </div>
      <div class="form-group">
        <label>Content</label>
        <textarea name="content" class="form-control" rows="6">${defaultData.post_content || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Excerpt</label>
        <textarea name="excerpt" class="form-control" rows="2">${defaultData.post_excerpt || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select name="status" class="form-control">
          <option value="draft" ${defaultData.post_status === 'draft' ? 'selected' : ''}>Draft</option>
          <option value="publish" ${defaultData.post_status === 'publish' ? 'selected' : ''}>Published</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary">Save Post</button>
    </form>
  `, async ({ title, content, excerpt, status }) => {
    try {
      if (isEdit) {
        const data = await shell.gqlRequest(UPDATE_POST_MUTATION, { id: postId, title, content, excerpt, status });
        if (data.updatePost.errors?.length) { shell.showToast(data.updatePost.errors[0], 'error'); return; }
        shell.showToast('Post updated', 'success');
      } else {
        const data = await shell.gqlRequest(CREATE_POST_MUTATION, { title, content, excerpt, status });
        if (data.createPost.errors?.length) { shell.showToast(data.createPost.errors[0], 'error'); return; }
        shell.showToast('Post created', 'success');
      }
      await onSaved();
    } catch (e) {
      // toast already shown
    }
  });
}
