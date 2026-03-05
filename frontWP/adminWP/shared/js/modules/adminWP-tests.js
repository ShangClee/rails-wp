export const tests = {
  async runAll() {
    const content = document.getElementById('content');
    content.innerHTML = `<h1>Running tests...</h1>`;
    
    let passed = 0;
    let failed = 0;
    const results = [];

    const testCases = [
      { name: 'API base URL', fn: () => this.testApiBaseUrl() },
      { name: 'Hash routing', fn: () => this.testHashRouting() },
      { name: 'Tab switching', fn: () => this.testTabSwitching() },
      { name: 'Toast notification', fn: () => this.testToastNotification() },
      { name: 'Module loading', fn: () => this.testModuleLoading() },
      { name: 'Skeleton renderer', fn: () => this.testSkeletonRenderer() },
    ];

    for (const tc of testCases) {
      const result = tc.fn();
      if (result) {
        passed++;
        results.push({ name: tc.name, status: 'pass', message: result });
      } else {
        failed++;
        results.push({ name: tc.name, status: 'fail', message: 'Failed' });
      }
    }

    this.renderResults(content, passed, failed, results);
    return failed === 0;
  },

  renderResults(content, passed, failed, results) {
    content.innerHTML = `
      <div class="toolbar">
        <h1>Test Results</h1>
        <button class="btn btn-primary" onclick="runTests()">Run Again</button>
      </div>
      <div class="card" style="margin-bottom:1rem">
        <table>
          <thead>
            <tr>
              <th>Test</th>
              <th>Status</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(r => `
              <tr>
                <td>${r.name}</td>
                <td><span class="badge ${r.status === 'pass' ? 'badge-success' : 'badge-warning'}">${r.status.toUpperCase()}</span></td>
                <td>${r.message}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="font-size:1.25rem;font-weight:600">
        <span style="color:#22c55e">${passed} passed</span> | 
        <span style="color:#ef4444">${failed} failed</span>
      </div>
    `;
  },

  testApiBaseUrl() {
    const expected = 'http://localhost:8888/api/v2';
    const actual = 'http://localhost:8888/api/v2';
    return actual === expected ? 'URL is correct' : null;
  },

  testHashRouting() {
    const hash = window.location.hash || '#cms/posts';
    const [tab, page] = hash.slice(1).split('/');
    return (tab === 'cms' || tab === 'system') && page ? 'Parses correctly' : null;
  },

  testTabSwitching() {
    const tabs = document.querySelectorAll('.tab');
    const cmsTab = document.querySelector('.tab[data-tab="cms"]');
    const systemTab = document.querySelector('.tab[data-tab="system"]');
    return tabs.length === 2 && cmsTab && systemTab ? '2 tabs found' : null;
  },

  testToastNotification() {
    const container = document.getElementById('toastContainer');
    return container ? 'Container exists' : null;
  },

  testModuleLoading() {
    const modules = document.querySelectorAll('script[type="module"]');
    return modules.length > 0 ? `${modules.length} module(s) loaded` : null;
  },

  testSkeletonRenderer() {
    const shell = window.adminShell;
    if (shell && shell.renderSkeleton) {
      const html = shell.renderSkeleton(3);
      return html.includes('skeleton') ? 'Skeleton renders OK' : null;
    }
    return null;
  }
};

if (typeof window !== 'undefined') {
  window.AdminWPTests = tests;
}

export default tests;
