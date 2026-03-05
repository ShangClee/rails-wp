export async function init(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div class="rounded border border-slate-200 bg-white p-4">
        <h3 class="text-lg font-semibold text-slate-800">Content Management</h3>
        <p class="text-sm text-slate-600">Manage posts, pages, and media.</p>
        <div class="mt-3">
          <a href="/adminWP/cms/posts.html" class="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Open Posts</a>
        </div>
      </div>
    </div>
  `;
}
