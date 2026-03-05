export const TABS = ["login", "setup", "cms", "system"];

export function normalizeRole(user) {
  if (!user) return "guest";
  if (typeof user.roles === "string") return user.roles;
  if (Array.isArray(user.roles) && user.roles.length > 0) return user.roles[0];
  return "subscriber";
}

export function canAccessSystem(role) {
  return role === "administrator" || role === "admin";
}

export function createInitialState({ token, user, requestedTab }) {
  const authenticated = Boolean(token);
  const role = authenticated ? normalizeRole(user) : "guest";
  const state = {
    authenticated,
    token: token || "",
    user: user || null,
    role,
    activeTab: "login",
    loadedTabs: new Set(),
    history: []
  };
  const resolved = resolveVisibleTab(state, requestedTab);
  state.activeTab = resolved;
  state.history = [resolved];
  return state;
}

export function visibleTabs(state) {
  if (!state.authenticated) return ["login"];
  if (canAccessSystem(state.role)) return ["setup", "cms", "system"];
  return ["cms"];
}

export function resolveVisibleTab(state, requestedTab) {
  const tabs = visibleTabs(state);
  if (requestedTab && tabs.includes(requestedTab)) return requestedTab;
  if (!state.authenticated) return "login";
  return tabs[0];
}

export function nextStateOnLogin(state, payload) {
  const next = { ...state };
  next.authenticated = true;
  next.token = payload.token;
  next.user = payload.user;
  next.role = normalizeRole(payload.user);
  const fallback = canAccessSystem(next.role) ? "setup" : "cms";
  next.activeTab = resolveVisibleTab(next, payload.requestedTab || fallback);
  next.history = [...state.history, next.activeTab];
  return next;
}

export function nextStateOnLogout(state) {
  return {
    authenticated: false,
    token: "",
    user: null,
    role: "guest",
    activeTab: "login",
    loadedTabs: new Set(["login"]),
    history: [...state.history, "login"]
  };
}

export function nextStateOnTabSelect(state, tab) {
  const next = { ...state };
  next.activeTab = resolveVisibleTab(state, tab);
  const last = state.history[state.history.length - 1];
  next.history = last === next.activeTab ? [...state.history] : [...state.history, next.activeTab];
  return next;
}
