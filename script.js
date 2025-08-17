(function () {
  const app = document.getElementById('app');
  const root = document.documentElement;
  const resumeRoot = document.getElementById('resume-root');
  const yearEl = document.getElementById('year');
  const viewSwitcher = document.getElementById('view-switcher');
  const btnInteractive = document.getElementById('btn-interactive');
  const btnPdf = document.getElementById('btn-pdf');
  const pdfView = document.getElementById('pdf-view');
  const pdfFrame = document.getElementById('pdf-frame');
  const downloadPdf = document.getElementById('download-pdf');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // detect if CV.pdf exists and enable switcher
  fetch('CV.pdf', { method: 'HEAD' })
    .then(res => {
      if (res.ok) {
        viewSwitcher.hidden = false;
        if (downloadPdf) downloadPdf.hidden = false;
        setView('pdf');
      }
    })
    .catch(() => {});

  function setView(mode) {
    const interactive = mode === 'interactive';
    btnInteractive && btnInteractive.setAttribute('aria-pressed', String(interactive));
    btnPdf && btnPdf.setAttribute('aria-pressed', String(!interactive));
    resumeRoot.hidden = !interactive;
    pdfView.hidden = interactive;
  }

  btnInteractive && btnInteractive.addEventListener('click', () => setView('interactive'));
  btnPdf && btnPdf.addEventListener('click', () => setView('pdf'));

  const DATE_RE = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|\b\d{4}\b|\b\d{4}\s*[–-]\s*(present|\d{4})/i;
  const UNI_RE = /(University|High School|Technical|Institute|Center|College)/i;

  function groupEducation(section) {
    const container = section.querySelector('.resume-details');
    if (!container) return;
    const nodes = Array.from(container.children);
    const entries = [];
    let entry = null;

    nodes.forEach(node => {
      if (node.tagName === 'P') {
        const t = node.textContent.trim();
        if (UNI_RE.test(t)) {
          if (entry) entries.push(entry);
          const dateMatch = t.match(DATE_RE);
          let title = t;
          let meta = '';
          if (dateMatch) {
            meta = dateMatch[0];
            title = t.replace(dateMatch[0], '').replace(/[–-]/g, ' ').replace(/\s{2,}/g, ' ').trim();
          }
          entry = { title, meta, body: [] };
        } else if (entry) {
          entry.body.push(t);
        }
      } else if (node.tagName === 'UL' && entry) {
        entry.body.push({ list: Array.from(node.querySelectorAll('li')).map(li => li.textContent.trim()) });
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

  function groupIndustry(section) {
    const container = section.querySelector('.resume-details');
    if (!container) return;
    const nodes = Array.from(container.children);
    const entries = [];
    let entry = null;

    nodes.forEach(node => {
      if (node.tagName === 'P') {
        const t = node.textContent.trim();
        if (!entry) {
          entry = { title: t, meta: '', body: [] };
          return;
        }
        if (!entry.meta && DATE_RE.test(t)) {
          entry.meta = t.match(DATE_RE)[0];
          return;
        }
        if (UNI_RE.test(t) || /Engineer|Supervisor|Company|Co\./i.test(t)) {
          if (entry) entries.push(entry);
          entry = { title: t, meta: '', body: [] };
          return;
        }
        entry.body.push(t);
      } else if (node.tagName === 'UL' && entry) {
        entry.body.push({ list: Array.from(node.querySelectorAll('li')).map(li => li.textContent.trim()) });
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

  function groupPublications(section) {
    const container = section.querySelector('.resume-details');
    if (!container) return;
    const nodes = Array.from(container.children).filter(n => n.tagName === 'P');
    if (!nodes.length) return;
    const ul = document.createElement('ul');
    nodes.forEach(n => {
      const t = n.textContent.trim();
      if (t) {
        const li = document.createElement('li');
        li.textContent = t;
        ul.appendChild(li);
      }
    });
    container.innerHTML = '';
    container.appendChild(ul);
  }

  // Load converted sections
  fetch('./converted.html', { cache: 'no-store' })
    .then(r => r.ok ? r.text() : '')
    .then(html => {
      if (!html) return;
      resumeRoot.innerHTML = html;

      // Remove contact duplicates from content
      const text = resumeRoot.textContent || '';
      const contactHints = ['@', 'ORCID', 'Phone', '+98', 'Ahvaz', 'IRAN'];
      if (contactHints.some(s => text.includes(s))) {
        resumeRoot.querySelectorAll('.resume-section').forEach(sec => {
          sec.querySelectorAll('p').forEach(p => {
            const t = p.textContent || '';
            if (/orcid|@|phone|email|address/i.test(t)) {
              p.remove();
            }
          });
        });
      }

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

        const name = (title.textContent || '').trim().toLowerCase();
        if (name === 'education') groupEducation(sec);
        if (name === 'industry experience' || name === 'work experience' || name === 'professional experience') groupIndustry(sec);
        if (name === 'publications' || name === 'journal publications' || name === 'conference publications') groupPublications(sec);
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