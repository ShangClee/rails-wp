import { parseJsonapi } from '../api-helpers.js';

let currentMenu = null;

export default async function cmsMenus(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Menus</h1>
      <button class="btn btn-primary" data-action="create-menu">Create Menu</button>
    </div>
    ${shell.renderSkeleton()}
  `;

  content.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'create-menu') await createMenu();
    if (action === 'select-menu') await selectMenu(id);
    if (action === 'delete-menu') await deleteMenu(id);
    if (action === 'add-item') await addItem();
    if (action === 'delete-item') await deleteItem(id);
    if (action === 'back') await loadMenus();
  });

  async function loadMenus() {
    currentMenu = null;
    try {
      const response = await shell.apiRequest('/menus');
      const menus = parseJsonapi(response);
      renderMenus(menus);
    } catch (e) {
      renderMenus([]);
    }
  }

  async function createMenu() {
    const name = prompt('Enter menu name:');
    if (!name) return;
    try {
      await shell.apiRequest('/menus', {
        method: 'POST',
        body: JSON.stringify({ menu: { name, slug: name.toLowerCase().replace(/\s+/g, '-') } })
      });
      shell.showToast('Menu created', 'success');
      await loadMenus();
    } catch (e) {
      // toast already shown
    }
  }

  async function selectMenu(menuId) {
    try {
      const response = await shell.apiRequest(`/menus/${menuId}`);
      currentMenu = parseJsonapi(response);
      if (Array.isArray(currentMenu)) currentMenu = currentMenu[0];
      renderMenuBuilder(currentMenu);
    } catch (e) {
      shell.showToast('Error loading menu', 'error');
    }
  }

  async function deleteMenu(menuId) {
    if (!confirm('Delete this menu?')) return;
    try {
      await shell.apiRequest(`/menus/${menuId}`, { method: 'DELETE' });
      shell.showToast('Menu deleted', 'success');
      currentMenu = null;
      await loadMenus();
    } catch (e) {
      // toast already shown
    }
  }

  async function addItem() {
    if (!currentMenu) return;
    const label = prompt('Item label:');
    if (!label) return;
    const url = prompt('Item URL:', 'http://');
    if (url === null) return;
    try {
      await shell.apiRequest(`/menus/${currentMenu.id}/items`, {
        method: 'POST',
        body: JSON.stringify({ item: { label, url, type: 'custom' } })
      });
      shell.showToast('Item added', 'success');
      await selectMenu(currentMenu.id);
    } catch (e) {
      // toast already shown
    }
  }

  async function deleteItem(itemId) {
    if (!currentMenu || !confirm('Delete this item?')) return;
    try {
      await shell.apiRequest(`/menus/${currentMenu.id}/items/${itemId}`, { method: 'DELETE' });
      shell.showToast('Item deleted', 'success');
      await selectMenu(currentMenu.id);
    } catch (e) {
      // toast already shown
    }
  }

  function renderMenus(menus) {
    content.innerHTML = `
      <div class="toolbar">
        <h1>Menus</h1>
        <button class="btn btn-primary" data-action="create-menu">Create Menu</button>
      </div>
      <div class="menus-container">
        <div class="menus-list">
          <h3>Menus</h3>
          ${menus.length ? menus.map(menu => `
            <div class="menu-item">
              <button class="menu-link" data-action="select-menu" data-id="${menu.id}">${menu.name}</button>
              <button class="btn btn-sm btn-danger" data-action="delete-menu" data-id="${menu.id}" title="Delete">×</button>
            </div>
          `).join('') : '<p style="color: #666;">No menus yet</p>'}
        </div>
      </div>
      <style>
        .menus-container { display: grid; grid-template-columns: 250px 1fr; gap: 1rem; margin-top: 1rem; }
        .menus-list { border-right: 1px solid #ddd; padding-right: 1rem; }
        .menus-list h3 { margin: 0 0 1rem 0; }
        .menu-item { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
        .menu-link { flex: 1; background: none; border: none; text-align: left; padding: 0.5rem; cursor: pointer; color: #0066cc; text-decoration: underline; }
        .menu-link:hover { color: #0052a3; }
        .menu-item .btn { padding: 0.25rem 0.5rem; }
      </style>
    `;
  }

  function renderMenuBuilder(menu) {
    const itemsHtml = menu.items?.length
      ? menu.items.map(item => `
          <div class="menu-item-row" draggable="true">
            <span class="drag-handle">⋮⋮</span>
            <div class="item-info">
              <div class="item-label">${item.label}</div>
              <div class="item-url">${item.url}</div>
            </div>
            <button class="btn btn-sm btn-danger" data-action="delete-item" data-id="${item.id}">Delete</button>
          </div>
        `).join('')
      : '<p style="color: #666;">No items yet</p>';

    content.innerHTML = `
      <div class="toolbar">
        <h1>Menus</h1>
        <button class="btn btn-primary" data-action="back">← Back</button>
        <button class="btn btn-secondary" data-action="add-item">Add Item</button>
      </div>
      <div class="menu-builder-container">
        <div class="menu-builder">
          <h2>${menu.name}</h2>
          <div class="menu-items">${itemsHtml}</div>
        </div>
      </div>
      <style>
        .menu-builder-container { padding: 1rem; }
        .menu-builder h2 { margin: 0 0 1.5rem 0; }
        .menu-items { border: 1px solid #ddd; border-radius: 4px; min-height: 200px; }
        .menu-item-row { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid #eee; background: #fafafa; cursor: move; }
        .menu-item-row:hover { background: #f5f5f5; }
        .drag-handle { color: #999; cursor: grab; }
        .item-info { flex: 1; }
        .item-label { font-weight: 500; }
        .item-url { font-size: 0.85em; color: #666; }
      </style>
    `;
  }

  await loadMenus();
}
