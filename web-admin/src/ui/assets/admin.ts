function syncToggleLabel(checkbox: HTMLInputElement): void {
  const root = checkbox.closest("label");
  const label = root?.querySelector(".toggle-label");
  if (label) label.textContent = checkbox.checked ? "On" : "Off";
}

function revertHtmxToggle(evt: Event): void {
  const elt = (evt as CustomEvent<{ elt?: EventTarget }>).detail?.elt;
  if (!(elt instanceof HTMLInputElement)) return;
  if (!elt.hasAttribute("data-htmx-revert-toggle")) return;
  elt.checked = !elt.checked;
  syncToggleLabel(elt);
}

document.body.addEventListener("htmx:responseError", revertHtmxToggle);
document.body.addEventListener("htmx:sendError", revertHtmxToggle);

document.body.addEventListener("htmx:configRequest", (evt) => {
  const meta = document.querySelector('meta[name="csrf-token"]');
  const headers = (
    evt as CustomEvent<{ headers?: Record<string, string> }>
  ).detail.headers;
  if (meta && headers) {
    headers["X-CSRF-Token"] = meta.getAttribute("content") || "";
  }
});

function drawerToggle(): HTMLInputElement | null {
  const el = document.getElementById("admin-drawer");
  return el instanceof HTMLInputElement ? el : null;
}

function drawerOpenBtn(): HTMLButtonElement | null {
  const el = document.getElementById("admin-drawer-open");
  return el instanceof HTMLButtonElement ? el : null;
}

function setDrawerOpen(open: boolean, focusTarget?: HTMLElement | null): void {
  const toggle = drawerToggle();
  const openBtn = drawerOpenBtn();
  if (!toggle) return;

  toggle.checked = open;
  openBtn?.setAttribute("aria-expanded", open ? "true" : "false");

  if (open) {
    const first = document.querySelector<HTMLElement>(
      ".drawer-side .menu button",
    );
    (first ?? openBtn)?.focus();
    return;
  }

  (focusTarget ?? openBtn)?.focus();
}

document.getElementById("admin-drawer-open")?.addEventListener("click", () => {
  setDrawerOpen(true);
});

drawerToggle()?.addEventListener("change", () => {
  const toggle = drawerToggle();
  const openBtn = drawerOpenBtn();
  if (!toggle || !openBtn) return;

  openBtn.setAttribute("aria-expanded", toggle.checked ? "true" : "false");
  if (toggle.checked) {
    const first = document.querySelector<HTMLElement>(
      ".drawer-side .menu button",
    );
    first?.focus();
  }
});

document.body.addEventListener("click", (evt) => {
  const target = evt.target;
  if (!(target instanceof Element)) return;

  if (target.closest("label.drawer-overlay")) {
    queueMicrotask(() => drawerOpenBtn()?.focus());
    return;
  }

  const moduleBtn = target.closest(".drawer-side .menu button[hx-get]");
  if (!moduleBtn) return;

  const main = document.getElementById("module-content");
  setDrawerOpen(false, main);
});
