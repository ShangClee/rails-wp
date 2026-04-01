export default async function systemSettings(content, shell) {
  let currentSection = 'general';
  let settings = {};
  
  content.innerHTML = `
    <div class="wrap wp-wrap">
      <h1 class="wp-heading-inline">Settings</h1>
      
      <div class="nav-tabs-wrapper">
        <h2 class="nav-tabs">
          <a class="nav-tab ${currentSection === 'general' ? 'nav-tab-active' : ''}" data-section="general">General</a>
          <a class="nav-tab ${currentSection === 'writing' ? 'nav-tab-active' : ''}" data-section="writing">Writing</a>
          <a class="nav-tab ${currentSection === 'reading' ? 'nav-tab-active' : ''}" data-section="reading">Reading</a>
          <a class="nav-tab ${currentSection === 'discussion' ? 'nav-tab-active' : ''}" data-section="discussion">Discussion</a>
          <a class="nav-tab ${currentSection === 'media' ? 'nav-tab-active' : ''}" data-section="media">Media</a>
          <a class="nav-tab ${currentSection === 'permalinks' ? 'nav-tab-active' : ''}" data-section="permalinks">Permalinks</a>
        </h2>
      </div>
      
      <form id="settings-form">
        <div id="settings-content"></div>
        <p class="submit">
          <button type="button" class="btn btn-primary" data-action="save-settings">Save Changes</button>
        </p>
      </form>
    </div>
    
    <style>
      .nav-tabs-wrapper { margin-bottom: 1.5rem; }
      .nav-tabs { border-bottom: 1px solid #dcdcde; margin: 0; padding-top: 9px; }
      .nav-tab { 
        display: inline-block; padding: 5px 10px; color: #50575e; text-decoration: none;
        border: 1px solid transparent; border-bottom: none; margin-bottom: -1px;
      }
      .nav-tab:hover { color: #2271b1; }
      .nav-tab-active { 
        background: #fff; border-color: #dcdcde; border-bottom-color: #fff; color: #2271b1;
      }
      .form-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
      .form-table th, .form-table td { padding: 12px; border-bottom: 1px solid #dcdcde; text-align: left; }
      .form-table th { font-weight: 600; width: 25%; }
      .form-table td { width: 75%; }
      .form-table input[type="text"], .form-table input[type="url"], 
      .form-table input[type="email"], .form-table input[type="number"],
      .form-table select, .form-table textarea { 
        width: 100%; max-width: 400px; padding: 6px 8px; border: 1px solid #8c8f94; border-radius: 4px;
      }
      .form-table input:focus, .form-table select:focus, .form-table textarea:focus {
        border-color: #2271b1; box-shadow: 0 0 0 1px #2271b1;
      }
      .description { display: block; color: #646970; font-size: 12px; margin-top: 4px; }
      .form-invalid td { box-shadow: inset 0 0 0 1px #b32d2e; }
      .submit { margin-top: 1.5rem; }
      .submit .btn { padding: 8px 16px; }
    </style>
  `;

  try {
    const response = await shell.apiRequest('/settings');
    settings = response.data || {};
    renderSection(currentSection, settings);
  } catch (e) {
    renderSection(currentSection, {});
  }

  content.addEventListener('click', e => {
    const tab = e.target.closest('.nav-tab');
    if (tab) {
      currentSection = tab.dataset.section;
      content.querySelectorAll('.nav-tab').forEach(t => {
        t.classList.toggle('nav-tab-active', t.dataset.section === currentSection);
      });
      renderSection(currentSection, settings);
    }
    
    const btn = e.target.closest('[data-action="save-settings"]');
    if (!btn) return;
    save();
  });

  async function save() {
    const form = content.querySelector('form');
    if (!form) return;
    const data = Object.fromEntries(new FormData(form));
    try {
      await shell.apiRequest('/settings', {
        method: 'PATCH',
        body: JSON.stringify({ settings: data })
      });
      shell.showToast('Settings saved', 'success');
      
      const response = await shell.apiRequest('/settings');
      settings = response.data || {};
    } catch (e) {
      shell.showToast('Error saving settings', 'error');
    }
  }

  function renderSection(section, s) {
    const container = content.querySelector('#settings-content');
    if (!container) return;
    
    let html = '';
    
    switch(section) {
      case 'general':
        html = `
          <table class="form-table">
            <tbody>
              <tr>
                <th scope="row"><label for="blogname">Site Title</label></th>
                <td><input type="text" id="blogname" name="blogname" value="${s.blogname || ''}" class="regular-text">
                  <p class="description">The title of your site.</p>
                </td>
              </tr>
              <tr>
                <th scope="row"><label for="blogdescription">Tagline</label></th>
                <td><input type="text" id="blogdescription" name="blogdescription" value="${s.blogdescription || ''}" class="regular-text">
                  <p class="description">In a few words, explain what this site is about.</p>
                </td>
              </tr>
              <tr>
                <th scope="row"><label for="siteurl">Site URL</label></th>
                <td><input type="url" id="siteurl" name="siteurl" value="${s.siteurl || ''}" class="regular-text">
                  <p class="description">The URL of your site&apos;s homepage.</p>
                </td>
              </tr>
              <tr>
                <th scope="row"><label for="admin_email">Admin Email</label></th>
                <td><input type="email" id="admin_email" name="admin_email" value="${s.admin_email || ''}" class="regular-text">
                  <p class="description">This address is used for admin purposes.</p>
                </td>
              </tr>
              <tr>
                <th scope="row"><label for="timezone_string">Timezone</label></th>
                <td>
                  <select id="timezone_string" name="timezone_string">
                    <option value="UTC" ${s.timezone_string === 'UTC' ? 'selected' : ''}>UTC</option>
                    <option value="America/New_York" ${s.timezone_string === 'America/New_York' ? 'selected' : ''}>Eastern Time (US)</option>
                    <option value="America/Chicago" ${s.timezone_string === 'America/Chicago' ? 'selected' : ''}>Central Time (US)</option>
                    <option value="America/Denver" ${s.timezone_string === 'America/Denver' ? 'selected' : ''}>Mountain Time (US)</option>
                    <option value="America/Los_Angeles" ${s.timezone_string === 'America/Los_Angeles' ? 'selected' : ''}>Pacific Time (US)</option>
                    <option value="Europe/London" ${s.timezone_string === 'Europe/London' ? 'selected' : ''}>London</option>
                    <option value="Europe/Paris" ${s.timezone_string === 'Europe/Paris' ? 'selected' : ''}>Paris</option>
                    <option value="Asia/Tokyo" ${s.timezone_string === 'Asia/Tokyo' ? 'selected' : ''}>Tokyo</option>
                  </select>
                  <p class="description">Choose a city in the same timezone as you.</p>
                </td>
              </tr>
              <tr>
                <th scope="row"><label for="date_format">Date Format</label></th>
                <td>
                  <select id="date_format" name="date_format">
                    <option value="F j, Y" ${s.date_format === 'F j, Y' ? 'selected' : ''}>F j, Y</option>
                    <option value="Y-m-d" ${s.date_format === 'Y-m-d' ? 'selected' : ''}>Y-m-d</option>
                    <option value="m/d/Y" ${s.date_format === 'm/d/Y' ? 'selected' : ''}>m/d/Y</option>
                    <option value="d/m/Y" ${s.date_format === 'd/m/Y' ? 'selected' : ''}>d/m/Y</option>
                  </select>
                  <p class="description">The format of the date, e.g., "F j, Y".</p>
                </td>
              </tr>
              <tr>
                <th scope="row"><label for="time_format">Time Format</label></th>
                <td>
                  <select id="time_format" name="time_format">
                    <option value="g:i a" ${s.time_format === 'g:i a' ? 'selected' : ''}>g:i a</option>
                    <option value="H:i" ${s.time_format === 'H:i' ? 'selected' : ''}>H:i</option>
                  </select>
                  <p class="description">The format of the time, e.g., "g:i a".</p>
                </td>
              </tr>
              <tr>
                <th scope="row">Start of week</th>
                <td>
                  <select name="start_of_week">
                    <option value="0" ${s.start_of_week === '0' ? 'selected' : ''}>Sunday</option>
                    <option value="1" ${s.start_of_week === '1' ? 'selected' : ''}>Monday</option>
                    <option value="2" ${s.start_of_week === '2' ? 'selected' : ''}>Tuesday</option>
                    <option value="3" ${s.start_of_week === '3' ? 'selected' : ''}>Wednesday</option>
                    <option value="4" ${s.start_of_week === '4' ? 'selected' : ''}>Thursday</option>
                    <option value="5" ${s.start_of_week === '5' ? 'selected' : ''}>Friday</option>
                    <option value="6" ${s.start_of_week === '6' ? 'selected' : ''}>Saturday</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
        
      case 'writing':
        html = `
          <table class="form-table">
            <tbody>
              <tr>
                <th scope="row"><label for="posts_per_page">Posts per page</label></th>
                <td><input type="number" id="posts_per_page" name="posts_per_page" value="${s.posts_per_page || '10'}" class="small-text">
                  <p class="description">Posts per page.</p>
                </td>
              </tr>
              <tr>
                <th scope="row">Default post format</th>
                <td>
                  <fieldset>
                    <label><input type="radio" name="default_post_format" value="standard" ${!s.default_post_format || s.default_post_format === 'standard' ? 'checked' : ''}> Standard</label><br>
                    <label><input type="radio" name="default_post_format" value="aside" ${s.default_post_format === 'aside' ? 'checked' : ''}> Aside</label><br>
                    <label><input type="radio" name="default_post_format" value="chat" ${s.default_post_format === 'chat' ? 'checked' : ''}> Chat</label><br>
                    <label><input type="radio" name="default_post_format" value="gallery" ${s.default_post_format === 'gallery' ? 'checked' : ''}> Gallery</label><br>
                    <label><input type="radio" name="default_post_format" value="image" ${s.default_post_format === 'image' ? 'checked' : ''}> Image</label><br>
                    <label><input type="radio" name="default_post_format" value="link" ${s.default_post_format === 'link' ? 'checked' : ''}> Link</label><br>
                    <label><input type="radio" name="default_post_format" value="quote" ${s.default_post_format === 'quote' ? 'checked' : ''}> Quote</label><br>
                    <label><input type="radio" name="default_post_format" value="status" ${s.default_post_format === 'status' ? 'checked' : ''}> Status</label><br>
                    <label><input type="radio" name="default_post_format" value="video" ${s.default_post_format === 'video' ? 'checked' : ''}> Video</label><br>
                    <label><input type="radio" name="default_post_format" value="audio" ${s.default_post_format === 'audio' ? 'checked' : ''}> Audio</label>
                  </fieldset>
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
        
      case 'reading':
        html = `
          <table class="form-table">
            <tbody>
              <tr>
                <th scope="row"><label for="posts_per_page_reading">Posts per page (Blog pages show at most)</label></th>
                <td><input type="number" id="posts_per_page_reading" name="posts_per_page" value="${s.posts_per_page || '10'}" class="small-text"></td>
              </tr>
              <tr>
                <th scope="row">Search engine visibility</th>
                <td>
                  <fieldset>
                    <label><input type="checkbox" name="blog_public" value="1" ${s.blog_public !== '0' ? 'checked' : ''}> Allow search engines to index this site</label>
                    <p class="description">Note: Search engines may ignore this if there are external links to your site.</p>
                  </fieldset>
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
        
      case 'discussion':
        html = `
          <table class="form-table">
            <tbody>
              <tr>
                <th scope="row">Default article settings</th>
                <td>
                  <fieldset>
                    <label><input type="checkbox" name="default_comment_status" value="open" ${s.default_comment_status !== 'closed' ? 'checked' : ''}> Allow people to submit comments on new articles</label><br>
                    <label><input type="checkbox" name="default_ping_status" value="open" ${s.default_ping_status !== 'closed' ? 'checked' : ''}> Allow link notifications from other blogs</label>
                  </fieldset>
                </td>
              </tr>
              <tr>
                <th scope="row">Other comment settings</th>
                <td>
                  <fieldset>
                    <label><input type="checkbox" name="comment_moderation" value="1" ${s.comment_moderation === '1' ? 'checked' : ''}> Comment must be manually approved</label><br>
                    <label><input type="checkbox" name="comment_whitelist" value="1" ${s.comment_whitelist === '1' ? 'checked' : ''}> Comment author must have a previously approved comment</label>
                  </fieldset>
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
        
      case 'media':
        html = `
          <table class="form-table">
            <tbody>
              <tr>
                <th scope="row">Image sizes</th>
                <td>
                  <fieldset>
                    <legend class="screen-reader-text">Image sizes</legend>
                    <label for="medium_size_w">Medium size</label><br>
                    Width: <input type="number" id="medium_size_w" name="medium_size_w" value="${s.medium_size_w || '300'}" class="small-text"> 
                    Height: <input type="number" id="medium_size_h" name="medium_size_h" value="${s.medium_size_h || '300'}" class="small-text"><br><br>
                    <label for="large_size_w">Large size</label><br>
                    Width: <input type="number" id="large_size_w" name="large_size_w" value="${s.large_size_w || '1024'}" class="small-text"> 
                    Height: <input type="number" id="large_size_h" name="large_size_h" value="${s.large_size_h || '1024'}" class="small-text">
                  </fieldset>
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
        
      case 'permalinks':
        html = `
          <table class="form-table">
            <tbody>
              <tr>
                <th scope="row">Permalink structure</th>
                <td>
                  <fieldset>
                    <label><input type="radio" name="permalink_structure" value="/%year%/%monthnum%/%day%/%postname%/" ${s.permalink_structure === '/%year%/%monthnum%/%day%/%postname%/' ? 'checked' : ''}> Day and name</label><br>
                    <label><input type="radio" name="permalink_structure" value="/%year%/%monthnum%/%postname%/" ${s.permalink_structure === '/%year%/%monthnum%/%postname%/' ? 'checked' : ''}> Month and name</label><br>
                    <label><input type="radio" name="permalink_structure" value="/%postname%/" ${s.permalink_structure === '/%postname%/' ? 'checked' : ''}> Post name</label><br>
                    <label><input type="radio" name="permalink_structure" value="plain" ${s.permalink_structure === 'plain' || !s.permalink_structure ? 'checked' : ''}> Plain</label>
                  </fieldset>
                  <p class="description">Customize the URL structure for your permalinks.</p>
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
    }
    
    container.innerHTML = html;
  }
}
