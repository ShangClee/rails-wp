export default async function systemRoles(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Roles</h1>
    </div>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>Users</th>
            <th>Capabilities</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Administrator</td>
            <td>1</td>
            <td>Full access</td>
          </tr>
          <tr>
            <td>Editor</td>
            <td>0</td>
            <td>Content management</td>
          </tr>
          <tr>
            <td>Author</td>
            <td>0</td>
            <td>Create content</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}
