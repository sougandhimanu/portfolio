(() => {
  const root = document.documentElement;
  const THEME_KEY = 'portfolio-theme';

  /* ---------- Theme toggle ---------- */
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme) root.setAttribute('data-theme', storedTheme);

  const currentTheme = () => {
    const explicit = root.getAttribute('data-theme');
    if (explicit) return explicit;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const syncThemeLabel = () => {
    themeLabel.textContent = currentTheme() === 'dark' ? 'LIGHT' : 'DARK';
  };
  syncThemeLabel();

  themeToggle.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    syncThemeLabel();
  });

  /* ---------- Mobile index overlay ---------- */
  const rail = document.getElementById('rail');
  const indexToggle = document.getElementById('indexToggle');

  const closeRail = () => {
    rail.classList.remove('open');
    indexToggle.setAttribute('aria-expanded', 'false');
  };

  indexToggle.addEventListener('click', () => {
    const open = rail.classList.toggle('open');
    indexToggle.setAttribute('aria-expanded', String(open));
  });

  rail.querySelectorAll('.rail-list a').forEach((link) => {
    link.addEventListener('click', closeRail);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeRail();
  });

  /* ---------- Live clock (Detroit-relative local time) ---------- */
  const clockEl = document.getElementById('clock');
  const tickClock = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${h}:${m}:${s}`;
  };
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------- Scroll: progress % + rail scrollspy ---------- */
  const scrollPctEl = document.getElementById('scrollPct');
  const railLinks = Array.from(document.querySelectorAll('.rail-list a'));
  const sections = railLinks
    .map((link) => document.getElementById(link.dataset.target))
    .filter(Boolean);

  const onScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    scrollPctEl.textContent = String(pct).padStart(2, '0') + '%';
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = railLinks.find((l) => l.dataset.target === entry.target.id);
          if (!link) return;
          if (entry.isIntersecting) {
            railLinks.forEach((l) => l.classList.remove('active'));
            link.classList.add('active');
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((sec) => spy.observe(sec));
  }

  /* ---------- Copy to clipboard ---------- */
  const toast = document.createElement('div');
  toast.className = 'copy-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  let toastTimer = null;

  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2200);
  };

  document.querySelectorAll('[data-copy]').forEach((el) => {
    el.addEventListener('click', async (e) => {
      e.preventDefault();
      const value = el.getAttribute('data-copy');
      const label = el.getAttribute('data-copy-label') || 'Value';
      try {
        await navigator.clipboard.writeText(value);
        showToast(`${label} copied to clipboard — ${value}`);
      } catch {
        showToast(`Copy this: ${value}`);
      }
    });
  });

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
