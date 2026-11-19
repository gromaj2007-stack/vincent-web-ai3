/* Vivi: reload when deployed HTML changes; no permanent app cache. */
(() => {
  let baseline = null;
  let checking = false;
  const page = new URL(location.pathname, location.href);
  async function check() {
    if (checking || document.hidden || !navigator.onLine) return;
    checking = true;
    try {
      const response = await fetch(page.href + (page.search ? '&' : '?') + '_vivi_check=' + Date.now(), {cache:'no-store'});
      if (!response.ok) return;
      const html = await response.text();
      // Strip only the injected query parameter, if ever reflected by a host.
      if (baseline !== null && baseline !== html) {
        location.reload();
        return;
      }
      baseline = html;
    } catch (_) { /* offline: keep current page */ }
    finally { checking = false; }
  }
  check();
  setInterval(check, 45000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  window.addEventListener('pageshow', check);
})();
