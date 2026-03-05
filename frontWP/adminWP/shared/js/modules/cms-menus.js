export default async function cmsMenus(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Menus</h1>
      <button class="btn btn-primary" onclick="alert('Create menu')">Add New</button>
    </div>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Locations</th>
            <th>Items</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Main Menu</td>
            <td>Primary</td>
            <td>3</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}
