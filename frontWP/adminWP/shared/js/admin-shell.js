const API_BASE = 'http://localhost:8888/api/v2';
const GQL_URL = 'http://localhost:8888/graphql';

class AdminShell {
  constructor() {
    this.currentTab = 'cms';
    this.currentPage = 'cms/posts';
    this.modules = {};
    this.store = this._createStore();
    this.init();
  }

  _createStore() {
    const cache = new Map();
    return {
      set(key, data) { cache.set(key, data); },
      get(key) { return cache.get(key) ?? null; },
      find(key, id) {
        const data = cache.get(key);
        if (!Array.isArray(data)) return null;
        return data.find(item => item.ID == id || item.id == id) ?? null;
      },
      invalidate(key) { cache.delete(key); }
    };
  }

  init() {
    this.setupTabs();
    this.setupRouting();
    this.loadModules();
    this.handleRoute();
  }

  setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
  }

  setupRouting() {
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'cms/posts';
    const [tab, page] = hash.split('/');
    
    if (tab === 'cms' || tab === 'system') {
      this.currentTab = tab;
      this.currentPage = hash;
      this.switchTab(tab);
      this.navigateTo(hash);
    }
  }

  switchTab(tab) {
    this.currentTab = tab;
    
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });

    document.getElementById('cmsSubTabs').style.display = tab === 'cms' ? 'flex' : 'none';
    document.getElementById('systemSubTabs').style.display = tab === 'system' ? 'flex' : 'none';

    const defaultPage = tab === 'cms' ? 'cms/posts' : 'system/users';
    this.navigateTo(defaultPage);
  }

  navigateTo(page) {
    this.currentPage = page;
    window.location.hash = page;
    this.updateSubTabs(page);
    this.renderPage(page);
  }

  updateSubTabs(page) {
    const [tab, subPage] = page.split('/');
    const container = tab === 'cms' ? 'cmsSubTabs' : 'systemSubTabs';
    
    document.querySelectorAll(`#${container} .sub-tab`).forEach(tab => {
      tab.classList.toggle('active', tab.dataset.page === page);
    });
  }

  async loadModules() {
    const modules = [
      'cms-posts', 'cms-pages', 'cms-media', 'cms-comments', 'cms-menus',
      'system-users', 'system-roles', 'system-tokens', 'system-health', 'system-settings', 'system-setup',
      'adminWP-tests'
    ];

    for (const name of modules) {
      try {
        const module = await import(`./modules/${name}.js`);
        this.modules[name] = module.default;
      } catch (e) {
        console.warn(`Module ${name} not found`);
      }
    }
  }

  async renderPage(page) {
    const content = document.getElementById('content');
    const [section, name] = page.split('/');
    const moduleName = `${section}-${name}`;

    if (moduleName === 'adminWP-tests') {
      if (this.modules['adminWP-tests']) {
        await this.modules['adminWP-tests'].runAll();
      }
    } else if (this.modules[moduleName]) {
      await this.modules[moduleName](content, this);
    } else {
      content.innerHTML = '<p>Page not found</p>';
    }
  }

  async apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('jwt_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `API Error: ${response.status}`);
      }

      if (response.status === 204) return null;

      const json = await response.json();
      // Attach WP pagination headers to the response object so modules can read them
      json.headers = response.headers;
      return json;
    } catch (error) {
      this.showToast(error.message, 'error');
      throw error;
    }
  }

  async gqlRequest(query, variables = {}) {
    const token = localStorage.getItem('jwt_token');
    try {
      const response = await fetch(GQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ query, variables })
      });
      const json = await response.json();
      if (json.errors?.length) {
        const msg = json.errors[0].message;
        this.showToast(msg, 'error');
        throw new Error(msg);
      }
      return json.data;
    } catch (error) {
      if (!error.message.includes('API Error')) {
        this.showToast(error.message, 'error');
      }
      throw error;
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  renderSkeleton(rows = 5) {
    return `
      <div class="card">
        <table>
          <thead>
            <tr>
              <th><div class="skeleton" style="width:100px;height:16px"></div></th>
              <th><div class="skeleton" style="width:150px;height:16px"></div></th>
              <th><div class="skeleton" style="width:80px;height:16px"></div></th>
            </tr>
          </thead>
          <tbody>
            ${Array(rows).fill().map(() => `
              <tr>
                <td><div class="skeleton" style="width:100px;height:20px"></div></td>
                <td><div class="skeleton" style="width:150px;height:20px"></div></td>
                <td><div class="skeleton" style="width:80px;height:20px"></div></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

function logout() {
  localStorage.removeItem('jwt_token');
  window.location.href = '/';
}

async function runTests() {
  try {
    const tests = await import('./modules/adminWP-tests.js');
    tests.default.runAll();
  } catch (e) {
    console.error('Tests failed to load:', e);
  }
}

window.AdminShell = AdminShell;
window.runTests = runTests;
window.adminShell = new AdminShell();
