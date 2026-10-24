(() => {
  const root = document.documentElement;
  const THEME_KEY = 'portfolio-theme';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Pixel penguin sprites ---------- */
  // Each string is one row of pixels; each letter is a colour from PALETTE.
  const PALETTE = {
    K: '#141a26', // black feathers
    D: '#2c3548', // feather shading
    W: '#ffffff', // belly
    S: '#d8e6f2', // belly shadow
    Y: '#f2a33a', // beak
    F: '#f07f2e', // feet
    G: '#a6b1c4', // chick fluff
    H: '#7f8ca3', // chick fluff shading
    E: '#ffffff', // eye shine
  };
  const SPRITES = {
    'peng-idle': [
      '....KKKK....',
      '...KKKKKK...',
      '..KKKKKKKK..',
      '..KWKKKKWK..',
      '..KKKYYKKK..',
      '..KKKKKKKK..',
      '.KKKWWWWKKK.',
      '.KDWWWWWWDK.',
      'KKDWWWWWWDKK',
      'KK.WWWWWW.KK',
      '..KWWWWWSK..',
      '..KKWSSSKK..',
      '...KKKKKK...',
      '...FF..FF...',
    ],
    'peng-blink': [
      '....KKKK....',
      '...KKKKKK...',
      '..KKKKKKKK..',
      '..KKKKKKKK..',
      '..KKKYYKKK..',
      '..KKKKKKKK..',
      '.KKKWWWWKKK.',
      '.KDWWWWWWDK.',
      'KKDWWWWWWDKK',
      'KK.WWWWWW.KK',
      '..KWWWWWSK..',
      '..KKWSSSKK..',
      '...KKKKKK...',
      '...FF..FF...',
    ],
    chick: [
      '...KKKK...',
      '..KKKKKK..',
      '.KWWWWWWK.',
      '.WWKWWKWW.',
      '.WWWYYWWW.',
      '..GWWWWG..',
      '.GGGGGGGG.',
      'GGGGGGGGGG',
      'GHGGGGGGHG',
      '.GHGGGGHG.',
      '..GGGGGG..',
      '..FF..FF..',
    ],
  };

  // Build one <symbol> per sprite, merging horizontal runs of a colour into one rect.
  const spriteSymbols = Object.entries(SPRITES).map(([name, rows]) => {
    const rects = [];
    rows.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const ch = row[x];
        let end = x;
        while (end < row.length && row[end] === ch) end++;
        if (PALETTE[ch]) rects.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${PALETTE[ch]}"/>`);
        x = end;
      }
    });
    return `<symbol id="${name}" viewBox="0 0 ${rows[0].length} ${rows.length}">${rects.join('')}</symbol>`;
  });
  const spriteSheet = document.createElement('div');
  spriteSheet.setAttribute('aria-hidden', 'true');
  spriteSheet.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  spriteSheet.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${spriteSymbols.join('')}</svg>`;
  document.body.prepend(spriteSheet);

  /* ---------- Theme toggle ---------- */
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');
  let storedTheme = null;
  try { storedTheme = localStorage.getItem(THEME_KEY); } catch { /* storage blocked */ }
  if (storedTheme) root.setAttribute('data-theme', storedTheme);

  const currentTheme = () => {
    const explicit = root.getAttribute('data-theme');
    if (explicit) return explicit;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const syncThemeLabel = () => {
    themeLabel.textContent = currentTheme() === 'dark' ? 'POLAR DAY' : 'POLAR NIGHT';
  };
  syncThemeLabel();
  themeToggle.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* storage blocked */ }
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
  rail.querySelectorAll('.rail-list a').forEach((link) => link.addEventListener('click', closeRail));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeRail();
  });

  /* ---------- Scroll: temperature readout + rail scrollspy ---------- */
  // The readout warms from -40° to 0° as you scroll to the bottom.
  const tempEl = document.getElementById('scrollPct');
  const railLinks = Array.from(document.querySelectorAll('.rail-list a'));
  const sections = railLinks.map((link) => document.getElementById(link.dataset.target)).filter(Boolean);
  const onScroll = () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? window.scrollY / docHeight : 0;
    tempEl.textContent = `${Math.round(-40 + pct * 40)}°`;
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        railLinks.forEach((l) => l.classList.toggle('active', l.dataset.target === entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
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
        showToast(`${label} copied: ${value}`);
      } catch {
        showToast(`Copy this: ${value}`);
      }
    });
  });

  /* ---------- Penguins: click one to make it hop and talk ---------- */
  const bubble = document.getElementById('pengBubble');
  let bubbleTimer = null;
  document.querySelectorAll('.peng').forEach((peng) => {
    peng.addEventListener('click', () => {
      peng.classList.remove('hop');
      void peng.offsetWidth;
      peng.classList.add('hop');
      peng.addEventListener('animationend', () => peng.classList.remove('hop'), { once: true });
      bubble.textContent = peng.dataset.say;
      bubble.classList.add('show');
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 1600);
    });
  });

  /* ---------- Snowfall with gusts of wind ---------- */
  const canvas = document.getElementById('snow');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let flakes = [];
    let w = 0;
    let h = 0;
    let wind = 0;
    let gust = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(160, (w * h) / 11000));
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        s: Math.random() < 0.15 ? 3 : Math.random() < 0.5 ? 2 : 1, // pixel sizes
        v: 0.3 + Math.random() * 0.9,
        p: Math.random() * Math.PI * 2,
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    const tick = (t) => {
      // A gust builds every so often and dies away
      if (Math.random() < 0.002) gust = 1.5 + Math.random() * 2;
      gust *= 0.985;
      wind += ((Math.sin(t / 4000) * 0.4 + gust) - wind) * 0.02;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = currentTheme() === 'dark' ? 'rgba(235,245,255,0.85)' : 'rgba(140,180,215,0.75)';
      flakes.forEach((f) => {
        f.y += f.v * (0.6 + f.s * 0.25);
        f.x += wind * (0.4 + f.s * 0.3) + Math.sin(t / 900 + f.p) * 0.2;
        if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
        if (f.x > w + 4) f.x = -4;
        if (f.x < -4) f.x = w + 4;
        ctx.fillRect(Math.round(f.x), Math.round(f.y), f.s, f.s);
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
