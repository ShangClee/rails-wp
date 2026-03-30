// @ts-check
/// <reference path="../../../../jsdoc/types.js" />
import { renderModal, confirmDelete } from '../api-helpers.js';

const PAGES_QUERY = `
  query GetPages {
    pages {
      ID post_title post_status post_parent post_date
      author { display_name }
    }
  }
`;

const PAGE_QUERY = `
  query GetPage($id: ID!) {
    pages {
      ID post_title post_content post_excerpt post_status post_parent
    }
  }
`;

const CREATE_PAGE_MUTATION = `
  mutation CreatePage($title: String!, $content: String, $excerpt: String, $status: String, $parentId: Int) {
    createPage(title: $title, content: $content, excerpt: $excerpt, status: $status, parentId: $parentId) {
      page { ID post_title }
      errors
    }
  }
`;

const UPDATE_PAGE_MUTATION = `
  mutation UpdatePage($id: ID!, $title: String, $content: String, $excerpt: String, $status: String, $parentId: Int) {
    updatePage(id: $id, title: $title, content: $content, excerpt: $excerpt, status: $status, parentId: $parentId) {
      page { ID post_title }
      errors
    }
  }
`;

const DELETE_PAGE_MUTATION = `
  mutation DeletePage($id: ID!) {
    deletePage(id: $id) {
      success errors
    }
  }
`;

export default async function cmsPages(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Pages</h1>
      <button class="btn btn-primary" data-action="new-page">Add New</button>
    </div>
    ${shell.renderSkeleton()}
  `;

  const handlers = {
    'new-page': () => showPageModal(null, shell, {}, reload),
    'edit': id => showEditModal(id),
    'delete': id => deletePage(id)
  };

  content.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    handlers[btn.dataset.action]?.(btn.dataset.id);
  });

  async function reload() {
    shell.store.invalidate('pages');
    await loadPages();
  }

  async function loadPages() {
    let pages = shell.store.get('pages');
    if (!pages) {
      try {
        const data = await shell.gqlRequest(PAGES_QUERY);
        pages = data.pages;
        shell.store.set('pages', pages);
      } catch (e) {
        pages = [];
      }
    }
    renderPages(pages);
  }

  async function showEditModal(id) {
    let page = shell.store.find('pages', id);
    if (!page?.post_content && page?.post_content !== '') {
      // Re-use store data if it has full content, otherwise it's sufficient for the form
      // since pages query already returns full content fields
    }
    if (!page) {
      shell.showToast('Page not found', 'error');
      return;
    }
    showPageModal(id, shell, page, reload);
  }

  async function deletePage(id) {
    confirmDelete('Delete this page?', async () => {
      try {
        const data = await shell.gqlRequest(DELETE_PAGE_MUTATION, { id });
        if (data.deletePage.errors?.length) {
          shell.showToast(data.deletePage.errors[0], 'error');
          return;
        }
        shell.showToast('Page deleted', 'success');
        await reload();
      } catch (e) {
        // toast already shown
      }
    });
  }

  function renderPages(pages) {
    content.innerHTML = `
      <div class="toolbar">
        <h1>Pages</h1>
        <button class="btn btn-primary" data-action="new-page">Add New</button>
      </div>
      <div class="card">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Parent</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${pages.length ? pages.map(page => `
              <tr>
                <td>${page.post_title || 'Untitled'}</td>
                <td><span class="badge badge-${page.post_status === 'publish' ? 'success' : 'secondary'}">${page.post_status || 'draft'}</span></td>
                <td>${page.post_parent ? page.post_parent : '-'}</td>
                <td>${page.post_date ? new Date(page.post_date).toLocaleDateString() : '-'}</td>
                <td>
                  <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${page.ID}">Edit</button>
                  <button class="btn btn-sm btn-danger" data-action="delete" data-id="${page.ID}">Delete</button>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="5">No pages found</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  await loadPages();
}

function showPageModal(pageId, shell, defaultData, onSaved) {
  const isEdit = !!pageId;
  const pages = shell.store.get('pages') || [];
  const parentOptions = pages
    .filter(p => p.ID != pageId)
    .map(p => `<option value="${p.ID}" ${defaultData.post_parent == p.ID ? 'selected' : ''}>${p.post_title}</option>`)
    .join('');

  renderModal(isEdit ? 'Edit Page' : 'New Page', `
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
        <label>Parent Page</label>
        <select name="parentId" class="form-control">
          <option value="">None</option>
          ${parentOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select name="status" class="form-control">
          <option value="draft" ${defaultData.post_status === 'draft' ? 'selected' : ''}>Draft</option>
          <option value="publish" ${defaultData.post_status === 'publish' ? 'selected' : ''}>Published</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary">Save Page</button>
    </form>
  `, async ({ title, content, excerpt, status, parentId }) => {
    try {
      const vars = { title, content, excerpt, status, parentId: parentId ? parseInt(parentId) : 0 };
      if (isEdit) {
        const data = await shell.gqlRequest(UPDATE_PAGE_MUTATION, { id: pageId, ...vars });
        if (data.updatePage.errors?.length) { shell.showToast(data.updatePage.errors[0], 'error'); return; }
        shell.showToast('Page updated', 'success');
      } else {
        const data = await shell.gqlRequest(CREATE_PAGE_MUTATION, vars);
        if (data.createPage.errors?.length) { shell.showToast(data.createPage.errors[0], 'error'); return; }
        shell.showToast('Page created', 'success');
      }
      await onSaved();
    } catch (e) {
      // toast already shown
    }
  });
}
