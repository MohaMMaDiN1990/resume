(function () {
  const app = document.getElementById('app');
  const root = document.documentElement;
  const resumeRoot = document.getElementById('resume-root');
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Load converted sections
  fetch('./converted.html', { cache: 'no-store' })
    .then(r => r.ok ? r.text() : '')
    .then(html => {
      if (!html) return;
      resumeRoot.innerHTML = html;
      // mark sections collapsed by default for click/tap
      const sections = resumeRoot.querySelectorAll('.resume-section');
      sections.forEach(sec => {
        sec.setAttribute('aria-expanded', 'false');
        const title = sec.querySelector('.resume-title');
        if (!title) return;
        title.addEventListener('click', () => {
          const expanded = sec.getAttribute('aria-expanded') === 'true';
          sec.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        });
        title.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            title.click();
          }
        });
      });
    })
    .catch(() => {});

  // Mouse move driven styling
  function onMouseMove(e) {
    const rect = app.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0..1
    const y = (e.clientY - rect.top) / rect.height; // 0..1
    const hue = Math.round(200 + 160 * x);
    const rx = ((y - 0.5) * 6).toFixed(2) + 'deg';
    const ry = ((x - 0.5) * -10).toFixed(2) + 'deg';
    const tilt = ((x - 0.5) * -6).toFixed(2) + 'deg';

    root.style.setProperty('--hue', String(hue));
    root.style.setProperty('--bgx', (x * 100).toFixed(1) + '%');
    root.style.setProperty('--bgy', (y * 100).toFixed(1) + '%');
    root.style.setProperty('--rx', rx);
    root.style.setProperty('--ry', ry);
    root.style.setProperty('--tilt', tilt);
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
})();