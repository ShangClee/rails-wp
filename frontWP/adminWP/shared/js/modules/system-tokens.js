export default async function systemTokens(content, shell) {
  content.innerHTML = `
    <div class="toolbar">
      <h1>API Tokens</h1>
      <button class="btn btn-primary" onclick="alert('Generate token')">Generate Token</button>
    </div>
    <div class="card">
      <div style="padding:2rem;text-align:center;color:var(--text-muted)">
        No API tokens yet. Generate your first token.
      </div>
    </div>
  `;
}
