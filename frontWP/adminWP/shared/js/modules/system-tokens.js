export default function systemTokens(content, shell) {
  const token = localStorage.getItem('jwt_token');

  if (!token) {
    content.innerHTML = `
      <div class="toolbar">
        <h1>API Tokens</h1>
      </div>
      <div class="card">
        <div style="padding:2rem;text-align:center;color:var(--text-muted)">
          No active session token. Please log in.
        </div>
      </div>
    `;
    return;
  }

  // Decode JWT (base64 decode the payload)
  let claims = {};
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      claims = payload;
    }
  } catch (e) {
    // Silently fail to decode
  }

  const expiry = claims.exp ? new Date(claims.exp * 1000) : null;
  const expiryStr = expiry ? expiry.toLocaleString() : 'Unknown';
  const isExpired = expiry && expiry < new Date();

  content.innerHTML = `
    <div class="toolbar">
      <h1>API Tokens</h1>
      <button class="btn btn-secondary" onclick="window.systemTokens_logout()">Re-Login</button>
    </div>
    <div class="card">
      <div style="padding:1.5rem;">
        <h3>Current Session Token</h3>
        <div class="form-group">
          <label>Token:</label>
          <textarea class="form-control" rows="4" readonly style="font-family: monospace; font-size: 0.85em;">${token}</textarea>
        </div>

        <h3 style="margin-top:2rem;">Token Claims</h3>
        <table style="width: 100%;">
          <tbody>
            <tr>
              <td style="padding:0.5rem; border-bottom:1px solid #eee;"><strong>Subject</strong></td>
              <td style="padding:0.5rem; border-bottom:1px solid #eee;">${claims.sub || '-'}</td>
            </tr>
            <tr>
              <td style="padding:0.5rem; border-bottom:1px solid #eee;"><strong>Issued At</strong></td>
              <td style="padding:0.5rem; border-bottom:1px solid #eee;">${claims.iat ? new Date(claims.iat * 1000).toLocaleString() : '-'}</td>
            </tr>
            <tr>
              <td style="padding:0.5rem; border-bottom:1px solid #eee;"><strong>Expires</strong></td>
              <td style="padding:0.5rem; border-bottom:1px solid #eee;"><span style="color: ${isExpired ? '#dc3545' : '#28a745'};">${expiryStr}</span></td>
            </tr>
            <tr>
              <td style="padding:0.5rem; border-bottom:1px solid #eee;"><strong>Status</strong></td>
              <td style="padding:0.5rem; border-bottom:1px solid #eee;">
                <span class="badge badge-${isExpired ? 'danger' : 'success'}">${isExpired ? 'Expired' : 'Active'}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top:2rem; padding:1rem; background:#f0f0f0; border-radius:4px; color:#666; font-size:0.9em;">
          <strong>Note:</strong> Token revocation is not yet implemented. Your token cannot be invalidated server-side until the expiry time.
        </div>
      </div>
    </div>
  `;

  window.systemTokens_logout = () => {
    localStorage.removeItem('jwt_token');
    window.location.href = '/';
  };
}
