document.body.addEventListener("htmx:configRequest", (evt) => {
  const meta = document.querySelector('meta[name="csrf-token"]');
  const headers = (
    evt as CustomEvent<{ headers?: Record<string, string> }>
  ).detail.headers;
  if (meta && headers) {
    headers["X-CSRF-Token"] = meta.getAttribute("content") || "";
  }
});

document.body.addEventListener("click", (evt) => {
  const target = evt.target;
  if (!(target instanceof Element)) return;
  const moduleBtn = target.closest(".drawer-side .menu button[hx-get]");
  if (!moduleBtn) return;
  const toggle = document.getElementById("admin-drawer");
  if (toggle instanceof HTMLInputElement) toggle.checked = false;
});
