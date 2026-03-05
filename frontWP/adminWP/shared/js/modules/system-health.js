export default async function systemHealth(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>System Health</h1>
    </div>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th>Status</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>API Server</td>
            <td><span class="badge badge-success">Running</span></td>
            <td>localhost:8888</td>
          </tr>
          <tr>
            <td>Database</td>
            <td><span class="badge badge-success">Connected</span></td>
            <td>SQLite</td>
          </tr>
          <tr>
            <td>Frontend</td>
            <td><span class="badge badge-success">Running</span></td>
            <td>localhost:8080</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}
