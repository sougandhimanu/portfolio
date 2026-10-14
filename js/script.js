(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
      e.stopPropagation();
      const value = el.getAttribute('data-copy');
      const label = el.getAttribute('data-copy-label') || 'Value';
      try {
        await navigator.clipboard.writeText(value);
        showToast(`${label} copied — ${value}`);
      } catch {
        showToast(`Copy this: ${value}`);
      }
    });
  });

  /* ---------- The book ---------- */
  const book = document.getElementById('book');
  const pages = Array.from(book.querySelectorAll(':scope > .page'));
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const navLabel = document.getElementById('navLabel');
  const tabs = Array.from(document.querySelectorAll('#tabs [data-page]'));
  const singleMQ = window.matchMedia('(max-width: 759px)');

  // Each section's first page gets a ribbon in its bookmark's colour.
  tabs.forEach((t) => {
    const page = pages[Number(t.dataset.page)];
    page.classList.add('has-mark');
    page.style.setProperty('--mark', t.style.getPropertyValue('--c'));
  });
  const FLIP_MS = reduceMotion ? 0 : 900;

  pages.forEach((page, i) => {
    if (i === 0 || i === pages.length - 1) return;
    const num = document.createElement('span');
    num.className = 'pg-num';
    num.textContent = String(i);
    page.appendChild(num);
  });

  let mode = null;    // 'spread' (two pages) or 'single' (one page, phones)
  let leaves = [];    // turnable sheets, first on top
  let pos = 0;        // how many leaves are turned
  let target = 0;
  let stepping = false;
  let zTop = 0;

  const div = (cls) => {
    const el = document.createElement('div');
    el.className = cls;
    return el;
  };

  const makeLeaf = (front, back) => {
    const leaf = div('leaf');
    const f = div('face front');
    const b = div('face back');
    if (front) f.appendChild(front);
    if (back) b.appendChild(back);
    leaf.append(f, b);
    return leaf;
  };

  // Pages visible for the current position
  const visiblePages = () => (mode === 'spread' ? [pos * 2, pos * 2 + 1] : [pos]);

  const updateNav = () => {
    const vis = visiblePages().filter((p) => p < pages.length);
    const labels = [...new Set(vis.map((p) => pages[p].dataset.label.replace(' (cont.)', '')))];
    navLabel.textContent = labels.join(' · ');
    prevBtn.disabled = pos === 0;
    nextBtn.disabled = pos === leaves.length;
    tabs.forEach((t) => t.classList.toggle('active', vis.includes(Number(t.dataset.page))));
  };

  const render = () => {
    leaves.forEach((leaf, i) => {
      const flipped = i < pos;
      leaf.classList.toggle('flipped', flipped);
      if (!leaf.dataset.flipping) leaf.style.zIndex = String(flipped ? i + 1 : leaves.length * 2 - i);
    });
    updateNav();
  };

  const build = (newMode) => {
    const page = mode === 'spread' ? pos * 2 : mode === 'single' ? pos : 0;
    mode = newMode;
    book.innerHTML = '';
    leaves = [];
    book.classList.add('ready', 'no-anim');
    book.classList.toggle('single', mode === 'single');
    const n = pages.length;

    if (mode === 'spread') {
      const left = div('base base-left');
      left.appendChild(pages[0]);
      const right = div('base base-right');
      right.appendChild(pages[n - 1]);
      book.append(left, right);
      for (let k = 0; 2 * k + 2 <= n - 2; k++) leaves.push(makeLeaf(pages[2 * k + 1], pages[2 * k + 2]));
      pos = Math.min(Math.floor(page / 2), leaves.length);
    } else {
      const base = div('base base-right');
      base.appendChild(pages[n - 1]);
      book.append(base);
      for (let i = 0; i < n - 1; i++) leaves.push(makeLeaf(pages[i], null));
      pos = Math.min(page, leaves.length);
    }
    leaves.forEach((leaf) => book.appendChild(leaf));
    target = pos;
    render();
    void book.offsetWidth;
    book.classList.remove('no-anim');
  };

  const stepLoop = async () => {
    stepping = true;
    while (pos !== target) {
      const forward = target > pos;
      const leaf = leaves[forward ? pos : pos - 1];
      pos += forward ? 1 : -1;
      leaf.dataset.flipping = '1';
      leaf.style.zIndex = String(1000 + ++zTop);
      leaf.classList.toggle('flipped', forward);
      updateNav();
      setTimeout(() => {
        delete leaf.dataset.flipping;
        render();
      }, FLIP_MS + 40);
      if (pos !== target) await sleep(reduceMotion ? 0 : 170);
    }
    stepping = false;
  };

  const go = (to) => {
    target = Math.max(0, Math.min(leaves.length, to));
    if (!stepping) stepLoop();
  };
  const goToPage = (p) => go(mode === 'spread' ? Math.floor(p / 2) : p);

  build(singleMQ.matches ? 'single' : 'spread');
  singleMQ.addEventListener('change', (e) => build(e.matches ? 'single' : 'spread'));

  prevBtn.addEventListener('click', () => go(target - 1));
  nextBtn.addEventListener('click', () => go(target + 1));
  tabs.forEach((t) => t.addEventListener('click', () => goToPage(Number(t.dataset.page))));
  document.getElementById('backToStart').addEventListener('click', (e) => {
    e.stopPropagation();
    go(0);
  });

  // Click the right half to turn forward, the left half to turn back.
  book.addEventListener('click', (e) => {
    if (e.target.closest('a, button, .polaroid')) return;
    if (String(window.getSelection())) return;
    const r = book.getBoundingClientRect();
    const split = mode === 'spread' ? r.width / 2 : r.width * 0.3;
    go(e.clientX - r.left < split ? target - 1 : target + 1);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') go(target + 1);
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(target - 1);
  });

  // Swipe on touch screens
  let touchX = null;
  book.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  book.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 45) go(dx < 0 ? target + 1 : target - 1);
  }, { passive: true });

  /* ---------- Box of chocolates ---------- */
  const reveal = document.getElementById('chocReveal');
  const revealName = reveal.querySelector('.reveal-name');
  const revealFlavour = reveal.querySelector('.reveal-flavour');
  const chocs = Array.from(document.querySelectorAll('.choc'));
  const chocBox = document.querySelector('.choc-box');
  const boxLid = document.getElementById('boxLid');
  const chocTray = document.getElementById('chocTray');

  const setReveal = (name, flavour) => {
    revealName.textContent = name;
    revealFlavour.textContent = flavour;
    reveal.classList.remove('pop');
    void reveal.offsetWidth;
    reveal.classList.add('pop');
  };

  // Lift the lid to see the chocolates; click it again to close the box.
  boxLid.addEventListener('click', () => {
    const open = !chocBox.classList.contains('open');
    chocBox.classList.toggle('open', open);
    boxLid.setAttribute('aria-expanded', String(open));
    boxLid.setAttribute('aria-label', open ? 'Close the Polymath box of chocolates' : 'Open the Polymath box of chocolates');
    chocTray.inert = !open;
    if (open) {
      setReveal('Pick a chocolate', 'each one is something I love doing');
    } else {
      chocs.forEach((c) => c.classList.remove('picked'));
      setReveal('The box is closed', 'click the lid to open it');
    }
  });

  chocs.forEach((choc) => {
    choc.addEventListener('click', () => {
      chocs.forEach((c) => c.classList.toggle('picked', c === choc));
      setReveal(choc.dataset.name, choc.dataset.flavour);
    });
  });

  /* ---------- Photo animation: the Polaroid drops in and develops ---------- */
  const polaroid = document.getElementById('polaroid');

  const playPhoto = () => {
    if (reduceMotion) return;
    polaroid.classList.remove('drop');
    void polaroid.offsetWidth; // restart the animation
    polaroid.classList.add('drop');
  };

  polaroid.addEventListener('click', (e) => {
    e.stopPropagation();
    playPhoto();
  });

  playPhoto();

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
