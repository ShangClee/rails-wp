export default async function cmsPosts(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Posts</h1>
      <button class="btn btn-primary" onclick="alert('Create post')">Add New</button>
    </div>
    ${shell.renderSkeleton()}
  `;

  try {
    const posts = await shell.apiRequest('/posts');
    renderPosts(content, posts, shell);
  } catch (e) {
    renderPosts(content, [], shell);
  }
}

function renderPosts(content, posts, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Posts</h1>
      <button class="btn btn-primary" onclick="alert('Create post')">Add New</button>
    </div>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${posts.length ? posts.map(post => `
            <tr>
              <td>${post.title || 'Untitled'}</td>
              <td>${post.author || 'Admin'}</td>
              <td><span class="badge badge-success">${post.status || 'Published'}</span></td>
              <td>${post.created_at ? new Date(post.created_at).toLocaleDateString() : '-'}</td>
            </tr>
          `).join('') : '<tr><td colspan="4">No posts found</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}
