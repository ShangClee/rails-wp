export async function init(container, ctx) {
  const c = document.createElement("div");
  c.className = "space-y-4";
  const statusEl = document.createElement("div");
  statusEl.className = "rounded border border-slate-200 bg-white p-4";
  statusEl.textContent = "Checking installation status...";
  const actionEl = document.createElement("div");
  actionEl.className = "flex gap-2";
  c.append(statusEl, actionEl);
  container.appendChild(c);
  try {
    const r = await fetch(`${ctx.API_URL}/setup`, { headers: { Authorization: ctx.getState().token } });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    if (j.status === "installed") {
      statusEl.textContent = "Installed";
      const a = document.createElement("a");
      a.href = "/adminWP/setup.html";
      a.className = "inline-flex items-center rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50";
      a.textContent = "View Setup Details";
      actionEl.appendChild(a);
    } else {
      statusEl.textContent = "Ready for installation";
      const a = document.createElement("a");
      a.href = "/adminWP/setup.html";
      a.className = "inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700";
      a.textContent = "Open Setup Wizard";
      actionEl.appendChild(a);
    }
  } catch (e) {
    statusEl.textContent = "Cannot connect to server.";
  }
}
