export async function init(container, ctx) {
  container.innerHTML = `
    <div class="mx-auto max-w-sm">
      <h2 class="mb-6 text-center text-2xl font-bold text-slate-800">Admin Login</h2>
      <form id="login-form" class="space-y-4" aria-label="Login form">
        <div>
          <label for="email" class="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input id="email" name="email" type="email" required class="block w-full rounded-md border border-slate-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500">
        </div>
        <div>
          <label for="password" class="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input id="password" name="password" type="password" required class="block w-full rounded-md border border-slate-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500">
        </div>
        <div>
          <button type="submit" class="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">Sign In</button>
        </div>
        <p id="login-error" class="hidden text-center text-sm text-red-600">Invalid email or password.</p>
      </form>
    </div>
  `;
  const form = container.querySelector("#login-form");
  const errorEl = container.querySelector("#login-error");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.classList.add("hidden");
    const email = form.email.value;
    const password = form.password.value;
    try {
      const r = await fetch(`${ctx.API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wp_user: { email, password } }),
      });
      if (!r.ok) {
        errorEl.textContent = "Invalid email or password.";
        errorEl.classList.remove("hidden");
        return;
      }
      const hdr = r.headers.get("Authorization");
      let token = hdr || "";
      if (!token) {
        const j = await r.json();
        token = j.token ? `Bearer ${j.token}` : "";
      }
      if (!token) {
        errorEl.textContent = "Missing token from server.";
        errorEl.classList.remove("hidden");
        return;
      }
      await ctx.loginSuccess({ token });
    } catch (e2) {
      errorEl.textContent = "Connection error. Please try again.";
      errorEl.classList.remove("hidden");
    }
  });
}
