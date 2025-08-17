(function () {
  const app = document.getElementById('app');
  const root = document.documentElement;
  const resumeRoot = document.getElementById('resume-root');
  const yearEl = document.getElementById('year');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const DATE_RE = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|\b\d{4}\b|\b\d{4}\s*[–-]\s*(present|\d{4})/i;
  const ORG_RE = /(Engineer|Supervisor|University|High School|Technical|Institute|Center|College|Company|Oil|Gas|Production|Department|Units|Co\.)/i;

  function buildEntries(container, isEducation) {
    const nodes = Array.from(container.children);
    const entries = [];
    let entry = null;

    nodes.forEach(node => {
      if (node.tagName === 'UL') {
        const li = node.querySelector('li');
        const liText = li ? li.textContent.trim() : '';
        if (liText && ORG_RE.test(liText)) {
          if (entry) entries.push(entry);
          entry = { title: liText, meta: '', body: [] };
          return;
        }
        if (entry && li) {
          const list = Array.from(node.querySelectorAll('li')).map(li => li.textContent.trim());
          entry.body.push({ list });
          return;
        }
      }

      if (node.tagName === 'P') {
        const raw = (node.textContent || '').trim();
        if (!raw) return;
        if (!entry) return;
        const dateMatch = raw.match(DATE_RE);
        let text = raw;
        if (!entry.meta && dateMatch) {
          entry.meta = dateMatch[0];
          text = raw.replace(dateMatch[0], '').replace(/[–-]/g, ' ').replace(/\s{2,}/g, ' ').trim();
        }
        if (text) entry.body.push(text);
      }
    });

    if (entry) entries.push(entry);

    if (entries.length) {
      container.innerHTML = '';
      entries.forEach(e => {
        const art = document.createElement('article');
        art.className = 'entry';
        const header = document.createElement('div');
        header.className = 'entry__header';
        const h3 = document.createElement('h3');
        h3.className = 'entry__title';
        h3.textContent = e.title;
        const span = document.createElement('span');
        span.className = 'entry__meta';
        span.textContent = e.meta;
        header.appendChild(h3);
        header.appendChild(span);
        art.appendChild(header);
        const body = document.createElement('div');
        body.className = 'entry__body';
        e.body.forEach(b => {
          if (typeof b === 'string') {
            const p = document.createElement('p');
            p.textContent = b;
            body.appendChild(p);
          } else if (b.list) {
            const ul = document.createElement('ul');
            b.list.forEach(it => {
              const li = document.createElement('li');
              li.textContent = it;
              ul.appendChild(li);
            });
            body.appendChild(ul);
          }
        });
        art.appendChild(body);
        container.appendChild(art);
      });
    }
  }

  // Load converted sections
  fetch('./converted.html', { cache: 'no-store' })
    .then(r => r.ok ? r.text() : '')
    .then(html => {
      if (!html) return;
      resumeRoot.innerHTML = html;

      // Remove contact duplicates from content
      resumeRoot.querySelectorAll('.resume-section').forEach(sec => {
        sec.querySelectorAll('p').forEach(p => {
          const t = p.textContent || '';
          if (/orcid|@|phone|email|address/i.test(t)) {
            p.remove();
          }
        });
      });

      // Click-to-toggle
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

        const name = (title.textContent || '').trim().toLowerCase();
        if (name === 'education' || name === 'industry experience' || name === 'work experience' || name === 'professional experience') {
          const container = sec.querySelector('.resume-details');
          buildEntries(container, name === 'education');
        }
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