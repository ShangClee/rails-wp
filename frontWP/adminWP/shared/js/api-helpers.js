/**
 * Flatten JSONAPI data envelope into plain attribute objects
 * Converts { data: [{ id, type, attributes: {...} }] } to [{ id, ...attributes }]
 */
export function parseJsonapi(response) {
  if (!response?.data) return [];
  const items = Array.isArray(response.data) ? response.data : [response.data];
  return items.map(item => ({ id: item.id, ...item.attributes }));
}

/**
 * Render a modal overlay with a form
 * @param {string} title - Modal title
 * @param {string} formHtml - HTML of the form contents
 * @param {function} onSubmit - Callback when form is submitted
 */
export function renderModal(title, formHtml, onSubmit) {
  // Remove any existing modal
  const existing = document.querySelector('.modal-overlay');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-content">
        ${formHtml}
      </div>
    </div>
  `;

  // Add styles if not already present
  if (!document.querySelector('style[data-modal-styles]')) {
    const style = document.createElement('style');
    style.setAttribute('data-modal-styles', '');
    style.textContent = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #eee;
      }
      .modal-header h2 {
        margin: 0;
        font-size: 1.5em;
      }
      .modal-close {
        background: none;
        border: none;
        font-size: 2em;
        cursor: pointer;
        color: #666;
      }
      .modal-close:hover {
        color: #000;
      }
      .modal-content {
        padding: 20px;
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(modal);

  // Find form in modal and attach submit handler
  const form = modal.querySelector('form');
  if (form && onSubmit) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      onSubmit(data);
      modal.remove();
    });
  }

  return modal;
}

/**
 * Render a confirmation dialog
 * @param {string} message - Confirmation message
 * @param {function} onConfirm - Callback if user confirms
 */
export function confirmDelete(message, onConfirm) {
  const confirmed = confirm(message || 'Are you sure?');
  if (confirmed && onConfirm) {
    onConfirm();
  }
}
