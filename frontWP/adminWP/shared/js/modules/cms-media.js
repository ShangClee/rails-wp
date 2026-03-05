export default async function cmsMedia(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>Media Library</h1>
      <button class="btn btn-primary" onclick="alert('Upload media')">Upload</button>
    </div>
    <div class="card">
      <div style="padding:2rem;text-align:center;color:var(--text-muted)">
        No media files yet. Upload your first file.
      </div>
    </div>
  `;
}
