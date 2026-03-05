import { createInitialState, nextStateOnLogin, nextStateOnLogout, nextStateOnTabSelect, visibleTabs } from "./admin-state.js";

const API_URL = "http://localhost:8888/api/v2";
const TAB_LABELS = { login: "Login", setup: "Setup", cms: "CMS", system: "System" };
const MODULES = {
  login: () => import("./modules/login.js"),
  setup: () => import("./modules/setup.js"),
  cms: () => import("./modules/cms.js"),
  system: () => import("./modules/system.js"),
};

function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

async function fetchMe(token) {
  if (!token) return null;
  const r = await fetch(`${API_URL}/users/me`, { headers: { Authorization: token } });
  if (!r.ok) return null;
  const j = await r.json();
  return j.data?.attributes || null;
}

async function init() {
  const urlTab = location.hash.replace("#", "") || "login";
  const token = localStorage.getItem("jwt_token") || "";
  const user = await fetchMe(token);
  let state = createInitialState({ token, user, requestedTab: urlTab });

  const dom = {
    tablist: qs("#module-tablist"),
    tabs: {
      login: qs("#tab-login"),
      setup: qs("#tab-setup"),
      cms: qs("#tab-cms"),
      system: qs("#tab-system"),
    },
    panels: {
      login: qs("#panel-login"),
      setup: qs("#panel-setup"),
      cms: qs("#panel-cms"),
      system: qs("#panel-system"),
    },
    breadcrumbCurrent: qs("#breadcrumb-current"),
    toolbar: qs("#context-toolbar"),
    sidebar: qs("#sidebar"),
    backdrop: qs("#sidebar-backdrop"),
    mobileToggle: qs("#mobile-menu-toggle"),
  };

  function setSidebarVisibility(visible) {
    const s = dom.sidebar;
    const b = dom.backdrop;
    if (visible) {
      s.classList.remove("-translate-x-full");
      b.classList.remove("hidden");
    } else {
      s.classList.add("-translate-x-full");
      b.classList.add("hidden");
    }
    dom.mobileToggle?.setAttribute("aria-expanded", String(visible));
  }

  dom.mobileToggle?.addEventListener("click", () => {
    const isHidden = dom.sidebar.classList.contains("-translate-x-full");
    setSidebarVisibility(isHidden);
  });
  
  dom.backdrop?.addEventListener("click", () => setSidebarVisibility(false));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setSidebarVisibility(false);
  });

  function applyVisibility() {
    const allowed = new Set(visibleTabs(state));
    Object.entries(dom.tabs).forEach(([k, el]) => {
      el.closest("li").style.display = allowed.has(k) ? "" : "none";
    });
  }

  function updateBreadcrumbAndToolbar() {
    dom.breadcrumbCurrent.textContent = TAB_LABELS[state.activeTab] || state.activeTab;
    dom.toolbar.innerHTML = "";
    if (state.activeTab === "cms") {
      const a = document.createElement("a");
      a.className = "inline-flex items-center rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50";
      a.href = "/adminWP/cms/posts.html";
      a.textContent = "Posts";
      dom.toolbar.appendChild(a);
    } else if (state.activeTab === "system") {
      const a = document.createElement("a");
      a.className = "inline-flex items-center rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50";
      a.href = "/adminWP/system/users.html";
      a.textContent = "Users";
      dom.toolbar.appendChild(a);
    } else if (state.activeTab === "setup") {
      const a = document.createElement("a");
      a.className = "inline-flex items-center rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50";
      a.href = "/adminWP/setup.html";
      a.textContent = "Open Setup Wizard";
      dom.toolbar.appendChild(a);
    }
  }

  function updateTabSelection() {
    Object.entries(dom.panels).forEach(([k, panel]) => {
      if (k === state.activeTab) panel.classList.remove("hidden");
      else panel.classList.add("hidden");
    });
    Object.entries(dom.tabs).forEach(([k, tab]) => {
      const selected = k === state.activeTab;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    location.hash = `#${state.activeTab}`;
    updateBreadcrumbAndToolbar();
  }

  async function ensureLoaded(tab) {
    if (state.loadedTabs.has(tab)) return;
    const mod = await MODULES[tab]();
    await mod.init(dom.panels[tab], {
      API_URL,
      getState: () => state,
      loginSuccess: async (payload) => {
        localStorage.setItem("jwt_token", payload.token);
        const me = await fetchMe(payload.token);
        state = nextStateOnLogin(state, { token: payload.token, user: me, requestedTab: "setup" });
        applyVisibility();
        state.loadedTabs.add("setup");
        updateTabSelection();
        setSidebarVisibility(false);
      },
      logout: () => {
        localStorage.removeItem("jwt_token");
        state = nextStateOnLogout(state);
        applyVisibility();
        updateTabSelection();
      },
    });
    state.loadedTabs.add(tab);
  }

  function onSelect(tab) {
    const allowed = new Set(visibleTabs(state));
    if (!allowed.has(tab)) return;
    state = nextStateOnTabSelect(state, tab);
    ensureLoaded(state.activeTab).then(() => {
      updateTabSelection();
      setSidebarVisibility(false);
    });
  }

  qsa("#module-tablist [role=tab]").forEach((tab) => {
    tab.addEventListener("click", () => onSelect(tab.dataset.tab));
    tab.addEventListener("keydown", (e) => {
      const items = qsa("#module-tablist [role=tab]").filter(el => el.closest("li").style.display !== "none");
      const idx = items.indexOf(tab);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = items[(idx + 1) % items.length];
        next.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = items[(idx - 1 + items.length) % items.length];
        prev.focus();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(tab.dataset.tab);
      }
    });
  });

  applyVisibility();
  await ensureLoaded(state.activeTab);
  updateTabSelection();

  if (new URLSearchParams(location.search).get("test") === "1") {
    const t = await import("./admin-tests.js");
    t.runAdminTests();
  }
}

init();
