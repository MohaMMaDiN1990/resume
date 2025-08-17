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
  const LOCATION_RE = /([A-Za-z\-\s]+,\s*[A-Za-z\-\s]+)$/;

  function isTitleCandidate(text) {
    return ORG_RE.test(text);
  }

  function parseTitleAndLocation(text) {
    const m = text.match(LOCATION_RE);
    if (m) {
      return { title: text.replace(LOCATION_RE, '').trim(), location: m[0].trim() };
    }
    return { title: text.trim(), location: '' };
  }

  function buildEntries(container, sectionName) {
    const isIndustry = sectionName.includes('industry') || sectionName.includes('work') || sectionName.includes('professional');
    const nodes = Array.from(container.children);
    const entries = [];
    let entry = null;

    nodes.forEach(node => {
      if (node.tagName === 'UL') {
        const items = Array.from(node.querySelectorAll('li')).map(li => (li.textContent || '').trim()).filter(Boolean);
        if (!items.length) return;

        if (isIndustry) {
          let bullets = [];
          for (let i = 0; i < items.length; i++) {
            const t = items[i];
            if (isTitleCandidate(t)) {
              if (entry && bullets.length) {
                entry.body.push({ list: bullets });
                bullets = [];
                entries.push(entry);
                entry = null;
              }
              const parsed = parseTitleAndLocation(t);
              entry = { title: parsed.title, date: '', location: parsed.location, body: [] };
            } else {
              if (!entry) continue;
              bullets.push(t);
            }
          }
          if (entry && bullets.length) {
            entry.body.push({ list: bullets });
          }
          return;
        }

        // Education and others: attach list to current entry
        if (entry) {
          entry.body.push({ list: items });
        }
        return;
      }

      if (node.tagName === 'P') {
        const raw = (node.textContent || '').trim();
        if (!raw) return;

        if (isIndustry) {
          if (!entry) return; // don't start entries from P in industry; keep exact wording
          entry.body.push(raw);
          return;
        }

        // Education and others
        if (!entry && isTitleCandidate(raw)) {
          const parsed = parseTitleAndLocation(raw);
          entry = { title: parsed.title, date: '', location: parsed.location, body: [] };
          return;
        }
        if (!entry) return;
        const dateMatch = raw.match(DATE_RE);
        let text = raw;
        if (!entry.date && dateMatch) {
          entry.date = dateMatch[0];
          text = text.replace(dateMatch[0], '').replace(/[–-]/g, ' ').replace(/\s{2,}/g, ' ').trim();
        }
        if (!entry.location) {
          const parsedLine = parseTitleAndLocation(text);
          if (parsedLine.location) {
            entry.location = parsedLine.location;
            text = parsedLine.title;
          }
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
        const metaParts = [];
        if (!isIndustry) {
          if (e.location) metaParts.push(e.location);
          if (e.date) metaParts.push(e.date);
        }
        span.textContent = metaParts.join(' — ');
        header.appendChild(h3);
        if (metaParts.length) header.appendChild(span);
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

  function splitTechnicalSkills() {
    const sections = Array.from(resumeRoot.querySelectorAll('.resume-section'));
    sections.forEach(sec => {
      const titleEl = sec.querySelector('.resume-title');
      const title = (titleEl?.textContent || '').trim().toLowerCase();
      if (!['programming languages', 'skills', 'technical skills'].includes(title)) return;
      const details = sec.querySelector('.resume-details');
      if (!details) return;
      const marker = Array.from(details.querySelectorAll('p')).find(p => (p.textContent || '').trim().toLowerCase() === 'technical skills' || (p.textContent || '').trim() === 'TECHNICAL SKILLS');
      if (!marker) return;
      const newSection = document.createElement('section');
      newSection.className = 'resume-section';
      newSection.setAttribute('data-level', '1');
      const h2 = document.createElement('h2');
      h2.className = 'resume-title';
      h2.setAttribute('tabindex', '0');
      h2.textContent = 'Technical Skills';
      const newDetails = document.createElement('div');
      newDetails.className = 'resume-details';
      let node = marker.nextSibling;
      marker.remove();
      const toMove = [];
      while (node) {
        const next = node.nextSibling;
        if (node.nodeType === 1) toMove.push(node);
        node = next;
      }
      toMove.forEach(n => newDetails.appendChild(n));
      newSection.appendChild(h2);
      newSection.appendChild(newDetails);
      sec.parentNode.insertBefore(newSection, sec.nextSibling);
    });
  }

  function splitAdditionalInfo() {
    const sections = Array.from(resumeRoot.querySelectorAll('.resume-section'));
    sections.forEach(sec => {
      const details = sec.querySelector('.resume-details');
      if (!details) return;
      const lists = Array.from(details.querySelectorAll('ul'));
      lists.forEach(ul => {
        const lis = Array.from(ul.querySelectorAll('li'));
        const markerIdx = lis.findIndex(li => (li.textContent || '').trim().toLowerCase() === 'additional info.' || (li.textContent || '').trim().toLowerCase() === 'additional info');
        if (markerIdx !== -1) {
          const newSection = document.createElement('section');
          newSection.className = 'resume-section';
          newSection.setAttribute('data-level', '1');
          const h2 = document.createElement('h2');
          h2.className = 'resume-title';
          h2.setAttribute('tabindex', '0');
          h2.textContent = 'Additional Info.';
          const newDetails = document.createElement('div');
          newDetails.className = 'resume-details';

          const newList = document.createElement('ul');
          for (let i = markerIdx + 1; i < lis.length; i++) {
            newList.appendChild(lis[i]);
          }
          lis[markerIdx].remove();
          if (newList.children.length > 0) {
            newDetails.appendChild(newList);
            newSection.appendChild(h2);
            newSection.appendChild(newDetails);
            sec.parentNode.insertBefore(newSection, sec.nextSibling);
          }
        }
      });
    });
  }

  // Load converted sections
  fetch('./converted.html', { cache: 'no-store' })
    .then(r => r.ok ? r.text() : '')
    .then(html => {
      if (!html) return;
      resumeRoot.innerHTML = html;

      // Remove Summary sections entirely
      resumeRoot.querySelectorAll('.resume-section').forEach(sec => {
        const title = sec.querySelector('.resume-title');
        if (title && (title.textContent || '').trim().toLowerCase() === 'summary') {
          sec.remove();
        }
      });

      // Remove contact duplicates from content
      resumeRoot.querySelectorAll('.resume-section').forEach(sec => {
        sec.querySelectorAll('p').forEach(p => {
          const t = p.textContent || '';
          if (/orcid|@|phone|email|address/i.test(t)) {
            p.remove();
          }
        });
      });

      // Split sections by markers before wiring interactions
      splitTechnicalSkills();
      splitAdditionalInfo();

      // Click-to-toggle and grouping
      const sections = Array.from(resumeRoot.querySelectorAll('.resume-section'));
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
          buildEntries(container, name);
        }
      });

      // Move Teaching Experience before Industry Experience
      const sectionsAfter = Array.from(resumeRoot.querySelectorAll('.resume-section'));
      const teach = sectionsAfter.find(s => (s.querySelector('.resume-title')?.textContent || '').trim().toLowerCase() === 'teaching experience');
      const industry = sectionsAfter.find(s => ['industry experience', 'work experience', 'professional experience'].includes((s.querySelector('.resume-title')?.textContent || '').trim().toLowerCase()));
      if (teach && industry && teach.compareDocumentPosition(industry) & Node.DOCUMENT_POSITION_FOLLOWING) {
        resumeRoot.insertBefore(teach, industry);
      }

      // Move Additional Info. before References
      const getTitle = (sec) => ((sec.querySelector('.resume-title')?.textContent || '').trim().toLowerCase().replace(/\.$/, ''));
      const addInfo = sectionsAfter.find(s => getTitle(s) === 'additional info');
      const refs = sectionsAfter.find(s => getTitle(s) === 'references');
      if (addInfo && refs) {
        resumeRoot.insertBefore(addInfo, refs);
      }
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