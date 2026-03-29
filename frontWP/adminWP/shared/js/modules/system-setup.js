const API_BASE = 'http://localhost:8888/api/v2';

export default async function setupModule(container, shell) {
  const html = `
    <div style="max-width: 600px; margin: 2rem auto;">
      <div style="background: white; border-radius: 8px; padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="margin-top: 0; color: #1f2937;">WordPress Initial Setup</h2>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">Configure your site and create an admin account</p>

        <div id="statusMessage" style="padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem; display: none;"></div>

        <form id="setupForm">
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">
              Site Title *
            </label>
            <input type="text" name="blogname" placeholder="My Awesome Blog" required
              style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem;">
            <div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">The name of your website</div>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">
              Admin Email *
            </label>
            <input type="email" name="admin_email" placeholder="admin@example.com" required
              style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem;">
            <div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">Email for the admin account</div>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">
              Admin Username *
            </label>
            <input type="text" name="user_login" placeholder="admin" required
              style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem;">
            <div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">Username for logging in (minimum 3 characters)</div>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">
              Admin Password *
            </label>
            <input type="password" name="user_pass" placeholder="••••••••" required
              style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem;">
            <div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">Make it strong! At least 8 characters recommended</div>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">
              Site URL *
            </label>
            <input type="url" name="siteurl" placeholder="http://localhost:8888" required
              style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem;">
            <div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">Your website's main URL</div>
          </div>

          <button type="submit" id="submitBtn"
            style="width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;">
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  `;

  container.innerHTML = html;

  const form = document.getElementById('setupForm');
  const statusMessage = document.getElementById('statusMessage');
  const submitBtn = document.getElementById('submitBtn');
  const siteurlInput = form.querySelector('input[name="siteurl"]');

  // Pre-fill siteurl
  siteurlInput.value = 'http://localhost:8888';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = form.querySelector('input[name="user_login"]').value;
    if (username.length < 3) {
      showStatus('Username must be at least 3 characters', 'error');
      return;
    }

    const password = form.querySelector('input[name="user_pass"]').value;
    if (password.length < 8) {
      showStatus('Password must be at least 8 characters', 'error');
      return;
    }

    submitBtn.disabled = true;
    showStatus('⏳ Setting up WordPress...', 'loading');

    try {
      const response = await fetch(`${API_BASE}/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wp_user: {
            user_login: form.querySelector('input[name="user_login"]').value,
            user_email: form.querySelector('input[name="admin_email"]').value,
            password: form.querySelector('input[name="user_pass"]').value,
            display_name: 'Administrator'
          },
          options: {
            blogname: form.querySelector('input[name="blogname"]').value,
            admin_email: form.querySelector('input[name="admin_email"]').value,
            siteurl: form.querySelector('input[name="siteurl"]').value,
            home: form.querySelector('input[name="siteurl"]').value
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Setup failed');
      }

      showStatus('✓ WordPress setup complete! Redirecting...', 'success');
      setTimeout(() => {
        window.location.hash = 'cms/posts';
      }, 1500);

    } catch (error) {
      console.error('Setup error:', error);
      showStatus('❌ ' + error.message, 'error');
      submitBtn.disabled = false;
    }
  });

  function showStatus(message, type) {
    const bgColor = type === 'success' ? '#ecfdf5' : type === 'error' ? '#fef2f2' : '#eff6ff';
    const textColor = type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#1e40af';
    const borderColor = type === 'success' ? '#a7f3d0' : type === 'error' ? '#fecaca' : '#bfdbfe';

    statusMessage.style.background = bgColor;
    statusMessage.style.color = textColor;
    statusMessage.style.border = `1px solid ${borderColor}`;
    statusMessage.style.display = 'block';
    statusMessage.innerHTML = message;
    statusMessage.scrollIntoView({ behavior: 'smooth' });
  }

  // Check if already set up
  try {
    const response = await fetch(`${API_BASE}/setup`);
    const data = await response.json();
    if (data.installed) {
      showStatus('✓ WordPress is already installed. Navigating to main admin...', 'success');
      setTimeout(() => {
        window.location.hash = 'cms/posts';
      }, 1500);
      form.style.display = 'none';
      submitBtn.disabled = true;
    }
  } catch (error) {
    console.log('Setup check error:', error);
  }
}
