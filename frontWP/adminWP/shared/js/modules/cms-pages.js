export default async function cmsPages(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Pages</h1>
      <button class="btn btn-primary" onclick="alert('Create page')">Add New</button>
    </div>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Template</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Home</td>
            <td><span class="badge badge-success">Published</span></td>
            <td>Default</td>
          </tr>
          <tr>
            <td>About</td>
            <td><span class="badge badge-success">Published</span></td>
            <td>Default</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}
