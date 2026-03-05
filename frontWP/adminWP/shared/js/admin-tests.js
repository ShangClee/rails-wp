import { createInitialState, nextStateOnLogin, nextStateOnLogout, nextStateOnTabSelect, visibleTabs } from "./admin-state.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

export function runAdminTests() {
  const results = [];
  function run(name, fn) {
    try { fn(); results.push({ name, ok: true }); }
    catch (e) { results.push({ name, ok: false, err: e.message }); }
  }

  run("guest can only see login", () => {
    const s = createInitialState({ token: "", user: null, requestedTab: "cms" });
    assert(s.activeTab === "login", "active should be login");
    const v = visibleTabs(s);
    assert(v.length === 1 && v[0] === "login", "only login visible");
  });

  run("admin sees setup/cms/system", () => {
    let s = createInitialState({ token: "t", user: { roles: "administrator" }, requestedTab: "setup" });
    const v = visibleTabs(s);
    assert(v.includes("setup") && v.includes("cms") && v.includes("system"), "admin tabs visible");
    s = nextStateOnTabSelect(s, "system");
    assert(s.activeTab === "system", "tab switch works");
  });

  run("login hides login tab", () => {
    let s = createInitialState({ token: "", user: null, requestedTab: "login" });
    s = nextStateOnLogin(s, { token: "x", user: { roles: "administrator" }, requestedTab: "setup" });
    const v = visibleTabs(s);
    assert(!v.includes("login"), "login tab hidden");
  });

  run("logout shows login", () => {
    let s = createInitialState({ token: "t", user: { roles: "administrator" }, requestedTab: "cms" });
    s = nextStateOnLogout(s);
    assert(s.activeTab === "login", "returns to login");
    assert(visibleTabs(s)[0] === "login", "login visible");
  });

  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.right = "1rem";
  overlay.style.bottom = "1rem";
  overlay.style.zIndex = "9999";
  overlay.style.background = "white";
  overlay.style.border = "1px solid #e2e8f0";
  overlay.style.borderRadius = "0.5rem";
  overlay.style.boxShadow = "0 2px 10px rgba(0,0,0,.1)";
  overlay.style.padding = "1rem";
  overlay.style.maxWidth = "22rem";
  overlay.style.fontFamily = "system-ui, -apple-system, Segoe UI, sans-serif";

  const okCount = results.filter(r => r.ok).length;
  const div = document.createElement("div");
  div.innerHTML = `<h3 style="margin:0 0 .5rem 0;font-size:1rem">Admin Tests</h3>
    <p style="margin:0 0 .5rem 0;color:#334155">${okCount}/${results.length} passed</p>
    <ul style="margin:0;padding-left:1rem;max-height:12rem;overflow:auto">${results.map(r => `<li style="margin:.25rem 0">${r.ok ? "✅" : "❌"} ${r.name}${r.ok ? "" : ` — ${r.err}`}</li>`).join("")}</ul>`;
  overlay.appendChild(div);
  document.body.appendChild(overlay);
}
