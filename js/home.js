/* ── home.js – Hero canvas animation + hero fade-in trigger ── */

// Trigger hero fade-in immediately on load
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.querySelectorAll('.hero-content .fade-in').forEach(el => {
      el.classList.add('visible');
    });
  }, 100);

  initHeroCanvas();
  initWhyCarousel();
});

function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); });

  // Particles / fiber nodes
  const NODES = 60;
  const nodes = [];

  for (let i = 0; i < NODES; i++) {
    nodes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.5,
    });
  }

  const MAX_DIST = 200;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update positions
    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
      if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
    });

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.55;
          ctx.strokeStyle = `rgba(59,142,255,${alpha})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(77,159,255,${n.opacity})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  draw();
}

/* ── 3D Why MetaTech Carousel Engine ── */
function initWhyCarousel() {
  const stage    = document.getElementById('whyStage');
  const dotsWrap = document.getElementById('whyDots');
  const prevBtn  = document.getElementById('whyPrev');
  const nextBtn  = document.getElementById('whyNext');
  if (!stage) return;

  const cards   = Array.from(stage.querySelectorAll('.vc-card'));
  const total   = cards.length;
  let step      = 0;
  let autoTimer = null;
  const INTERVAL = 2400; /* Snappy, engaging rotation */

  function getMetrics() {
    const w = window.innerWidth;
    if (w <= 600) {
      return {
        radiusX: 130,
        depthZ: 120,
        angleY: 16,
        centerScale: 1.08,
        sideScale: 0.76,
        maxBlur: 0.5
      };
    } else if (w <= 900) {
      return {
        radiusX: 190,
        depthZ: 140,
        angleY: 18,
        centerScale: 1.10,
        sideScale: 0.78,
        maxBlur: 0.5
      };
    }
    return {
      radiusX: 250,     /* Optimized for 440px wide horizontal rectangle cards */
      depthZ: 160,     /* 3D depth separation */
      angleY: 18,      /* Gentle inward angle */
      centerScale: 1.12,/* Dominant sharp center card */
      sideScale: 0.80, /* Side cards clearly visible & defined */
      maxBlur: 0.6     /* Subtle blur for high background card clarity */
    };
  }

  // Build dots
  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    cards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'vc-dot';
      dot.setAttribute('aria-label', 'Go to pillar ' + (i + 1));
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll('.vc-dot')) : [];

  function applyPositions() {
    const { radiusX, depthZ, angleY, centerScale, sideScale, maxBlur } = getMetrics();
    const currentActive = ((step % total) + total) % total;
    const stepAngle = 360 / total; // 120 deg for 3 cards

    cards.forEach((card, i) => {
      // Continuous circular angle
      const angleDeg = (i - step) * stepAngle;
      const rad = angleDeg * (Math.PI / 180);

      const sin = Math.sin(rad);
      const cos = Math.cos(rad);

      // Circular 3D path: X moves along horizontal ellipse, Z pushes forward at center
      const tx = sin * radiusX;
      const tz = (cos - 1) * depthZ + 40 * Math.max(0, cos);
      const ry = -sin * angleY;

      // Position-based dynamic scaling, blur, brightness, opacity, and z-index
      let scale;
      let opacity;
      let brightness;
      let blur;
      let zIndex;

      // Smooth continuous values:
      // Center card (cos = 1): scale = centerScale, opacity = 1.0, brightness = 1.05
      // Background cards (cos = -0.5): scale = sideScale, opacity = 0.90, brightness = 0.90, crisp & clear
      const t = Math.max(0, Math.min(1, (cos + 0.5) / 1.5));
      scale      = sideScale + (centerScale - sideScale) * Math.pow(t, 1.2);
      opacity    = 0.90 + 0.10 * t;
      brightness = 0.90 + 0.15 * t;
      blur       = 0;
      zIndex     = cos > 0.5 ? 30 : 10;

      // Apply 3D transforms & depth filters
      card.style.transform = `translateX(${tx.toFixed(1)}px) translateZ(${tz.toFixed(1)}px) rotateY(${ry.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      card.style.opacity   = opacity.toFixed(3);
      card.style.filter    = `blur(${blur.toFixed(2)}px) brightness(${brightness.toFixed(2)})`;
      card.style.zIndex    = String(zIndex);

      // Center card dominance & pointer events
      if (cos > 0.7) {
        card.classList.add('vc-active');
        card.style.pointerEvents = 'auto';
      } else {
        card.classList.remove('vc-active');
        card.style.pointerEvents = 'auto';
      }
    });

    dots.forEach((dot, idx) => {
      dot.classList.toggle('vc-dot-active', idx === currentActive);
    });
  }

  function goTo(targetIndex) {
    const currentActive = ((step % total) + total) % total;
    let diff = targetIndex - currentActive;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    step += diff;
    applyPositions();
  }

  function next() {
    step += 1;
    applyPositions();
  }

  function prev() {
    step -= 1;
    applyPositions();
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(next, INTERVAL);
  }

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  // Controls
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); startAuto(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); startAuto(); });

  // Card interactions: click to jump & pause ONLY when mouse is directly on a card
  cards.forEach((card, i) => {
    card.addEventListener('click', () => {
      goTo(i);
      startAuto();
    });
    card.addEventListener('mouseenter', stopAuto);
    card.addEventListener('mouseleave', startAuto);
  });

  // Touch/swipe support
  let touchStartX = 0;
  stage.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      dx < 0 ? next() : prev();
      startAuto();
    }
  }, { passive: true });

  // Window resize
  window.addEventListener('resize', applyPositions);

  // Initial render & run
  applyPositions();
  startAuto();
}
