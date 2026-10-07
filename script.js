/* ================================================================
   1. NETWORK CANVAS — subtle animated node graph
   ================================================================ */
(function(){
  const canvas = document.getElementById('net-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height, dpr;
  let nodes = [];
  const mouse = { x: -1000, y: -1000, active: false };

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    initNodes();
  }

  function initNodes(){
    const count = Math.min(70, Math.floor((width * height) / 22000));
    nodes = [];
    for(let i = 0; i < count; i++){
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.4 + 0.8
      });
    }
  }

  const LINK_DIST = 150;
  const MOUSE_DIST = 180;

  function draw(){
    ctx.clearRect(0, 0, width, height);

    for(const n of nodes){
      n.x += n.vx;
      n.y += n.vy;
      if(n.x < 0 || n.x > width) n.vx *= -1;
      if(n.y < 0 || n.y > height) n.vy *= -1;

      if(mouse.active){
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const d2 = dx*dx + dy*dy;
        if(d2 < MOUSE_DIST * MOUSE_DIST && d2 > 0.01){
          const d = Math.sqrt(d2);
          const force = (1 - d / MOUSE_DIST) * 0.6;
          n.x += (dx / d) * force;
          n.y += (dy / d) * force;
        }
      }
    }

    for(let i = 0; i < nodes.length; i++){
      for(let j = i + 1; j < nodes.length; j++){
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < LINK_DIST){
          const alpha = (1 - dist / LINK_DIST) * 0.35;
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for(const n of nodes){
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.fill();
    }

    if(!reduceMotion) requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  window.addEventListener('mouseleave', () => { mouse.active = false; });

  resize();
  draw();
})();

/* ================================================================
   2. VISITOR COUNTER — Abacus API + localStorage fallback
   ================================================================ */
(function(){
  const el = document.getElementById('visitorCount');
  const badge = document.getElementById('visitorBadge');
  if(!el) return;

  const NAMESPACE = 'chriscardozo-portfolio';
  const KEY = 'homepage-visits';
  const LOCAL_KEY = 'cc_local_visits';
  const SEEN_KEY  = 'cc_has_visited';

  // Local fallback count (always increments once per session)
  let local = parseInt(localStorage.getItem(LOCAL_KEY) || '0', 10);
  const alreadySeen = sessionStorage.getItem(SEEN_KEY);
  if(!alreadySeen){
    local += 1;
    localStorage.setItem(LOCAL_KEY, local);
    sessionStorage.setItem(SEEN_KEY, '1');
  }

  function render(n){
    el.textContent = Number(n).toLocaleString();
    badge.classList.add('pulse');
    setTimeout(() => badge.classList.remove('pulse'), 700);
  }

  // First: show local count immediately so user never sees "···"
  render(local);

  // Then try to get the global count from Abacus
  const endpoint = `https://abacus.jasoncameron.dev/${alreadySeen ? 'get' : 'hit'}/${NAMESPACE}/${KEY}`;

  fetch(endpoint)
    .then(r => {
      if(!r.ok) throw new Error('Network');
      return r.json();
    })
    .then(data => {
      if(data && typeof data.value === 'number'){
        render(data.value);
      }
    })
    .catch(() => {
      // Silently fall back to local count — already shown
    });
})();

/* ================================================================
   3. SCROLL PROGRESS + HEADER STATE + BACK-TO-TOP
   ================================================================ */
(function(){
  const progress = document.getElementById('progress');
  const header = document.getElementById('header');
  const topBtn = document.getElementById('top-btn');

  function onScroll(){
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const total = h.scrollHeight - h.clientHeight;
    if(progress) progress.style.width = (scrolled / total * 100) + '%';
    if(header) header.classList.toggle('scrolled', scrolled > 30);
    if(topBtn) topBtn.classList.toggle('show', scrolled > 600);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  if(topBtn){
    topBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();

/* ================================================================
   4. REVEAL ON SCROLL
   ================================================================ */
(function(){
  const els = document.querySelectorAll('.reveal');
  if(!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add('show');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  els.forEach(el => io.observe(el));
})();

/* ================================================================
   5. ACTIVE NAV LINK
   ================================================================ */
(function(){
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if(!sections.length || !navLinks.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px -55% 0px' });

  sections.forEach(s => io.observe(s));
})();

/* ================================================================
   6. MOBILE MENU
   ================================================================ */
(function(){
  const burger = document.getElementById('burger');
  const menu = document.getElementById('navLinks');
  if(!burger || !menu) return;

  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    menu.classList.toggle('open');
  });

  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      menu.classList.remove('open');
    });
  });
})();

/* ================================================================
   7. YEAR IN FOOTER
   ================================================================ */
(function(){
  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();
})();