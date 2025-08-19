(function () {
  const VERSION = '2025-08-19-22';
  const app = document.getElementById('app');
  const root = document.documentElement;
  const resumeRoot = document.getElementById('resume-root');
  const yearEl = document.getElementById('year');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const DATE_RE = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|\b\d{4}\b|\b\d{4}\s*[–-]\s*(present|\d{4})/i;
  const ORG_RE = /(University|High School|Technical|Institute|Center|College|Engineer|Supervisor|Company|Oil|Gas|Production|Department|Units|Co\.)/i;
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

  function buildEducationByColon(container) {
    const segments = [];
    Array.from(container.children).forEach(node => {
      if (node.tagName === 'UL') {
        Array.from(node.querySelectorAll('li')).forEach(li => {
          const t = (li.textContent || '').trim();
          if (t) segments.push({ text: t, bullet: true });
        });
      } else if (node.tagName === 'P') {
        const t = (node.textContent || '').trim();
        if (t) segments.push({ text: t, bullet: false });
      }
    });

    const entries = [];
    let entry = null;

    function flushEntry() {
      if (entry) entries.push(entry);
      entry = null;
    }

    segments.forEach(seg => {
      const t = seg.text;
      const colonIdx = t.indexOf(':');
      if (colonIdx > -1) {
        const lhs = t.slice(0, colonIdx).trim();
        const rhs = t.slice(colonIdx + 1).trim();
        if (isTitleCandidate(lhs)) {
          flushEntry();
          let meta = '';
          const m = rhs.match(DATE_RE);
          let rhsText = rhs;
          if (m) {
            meta = m[0];
            rhsText = rhs.replace(m[0], '').replace(/[–-]/g, ' ').replace(/\s{2,}/g, ' ').trim();
          }
          entry = { title: lhs, meta, body: [] };
          if (rhsText) entry.body.push({ type: seg.bullet ? 'li' : 'p', text: rhsText });
          return;
        }
      }
      // Detail line
      if (entry) entry.body.push({ type: seg.bullet ? 'li' : 'p', text: t });
    });
    flushEntry();

    if (!entries.length) return false;

    container.innerHTML = '';
    entries.forEach(e => {
      const art = document.createElement('article');
      art.className = 'entry';
      const header = document.createElement('div');
      header.className = 'entry__header';
      const h3 = document.createElement('h3');
      h3.className = 'entry__title';
      const strong = document.createElement('strong');
      strong.textContent = e.title;
      h3.appendChild(strong);
      const span = document.createElement('span');
      span.className = 'entry__meta';
      span.textContent = e.meta || '';
      header.appendChild(h3);
      if (e.meta) header.appendChild(span);
      art.appendChild(header);
      const body = document.createElement('div');
      body.className = 'entry__body';
      let ul = null;
      e.body.forEach(b => {
        if (b.type === 'li') {
          if (!ul) {
            ul = document.createElement('ul');
            body.appendChild(ul);
          }
          const li = document.createElement('li');
          li.textContent = b.text;
          ul.appendChild(li);
        } else {
          ul = null;
          const p = document.createElement('p');
          p.textContent = b.text;
          body.appendChild(p);
        }
      });
      art.appendChild(body);
      container.appendChild(art);
    });
    return true;
  }

  function formatEducationSchools(container) {
    // Group each school (ul>li) as bold header, with following siblings as details
    const nodes = Array.from(container.children);
    if (!nodes.length) return;

    function boldGPA(el) {
      if (!el || el.nodeType !== 1) return;
      const re = /(GPA\s*:?[\s\t]*[0-9]+(?:\.[0-9]+)?(?:\s*out of\s*\d+)*)/gi;
      if (el.tagName === 'P' || el.tagName === 'LI') {
        const txt = el.textContent || '';
        const replaced = txt.replace(re, '<strong>$1</strong>');
        if (replaced !== txt) el.innerHTML = replaced;
      } else {
        Array.from(el.childNodes).forEach(child => boldGPA(child));
      }
    }

    const articles = [];
    let i = 0;
    while (i < nodes.length) {
      const node = nodes[i];
      if (node.tagName === 'UL') {
        const li = node.querySelector('li');
        const headerText = (li && li.textContent) ? li.textContent.trim() : '';
        // Split header into school name and trailing location using dotted leaders or ellipses
        const parts = headerText.split(/\s*[\.\u2026]+\s*/).filter(Boolean);
        const schoolName = parts.length ? parts[0].trim() : headerText;
        const trailing = parts.length > 1 ? parts.slice(1).join(' ').trim() : '';

        const art = document.createElement('article');
        art.className = 'entry';
        const header = document.createElement('div');
        header.className = 'entry__header';
        const h3 = document.createElement('h3');
        h3.className = 'entry__title';
        const strong = document.createElement('strong');
        strong.textContent = schoolName;
        h3.appendChild(strong);
        header.appendChild(h3);
        art.appendChild(header);

        const body = document.createElement('div');
        body.className = 'entry__body';
        if (trailing) {
          const pLoc = document.createElement('p');
          pLoc.textContent = trailing;
          boldGPA(pLoc);
          body.appendChild(pLoc);
        }
        // collect following siblings until next UL or end
        let j = i + 1;
        while (j < nodes.length && nodes[j].tagName !== 'UL') {
          const cloned = nodes[j].cloneNode(true);
          boldGPA(cloned);
          body.appendChild(cloned);
          j += 1;
        }
        art.appendChild(body);
        articles.push(art);
        i = j;
      } else {
        i += 1;
      }
    }
    if (articles.length) {
      container.innerHTML = '';
      articles.forEach(a => container.appendChild(a));
    }
  }

  function buildEntries(container, sectionName) {
    const isIndustry = sectionName.includes('industry') || sectionName.includes('work') || sectionName.includes('professional');
    const nodes = Array.from(container.children);
    const entries = [];
    let entry = null;

    // Education via colon markers (if present)
    if (sectionName.includes('education')) {
      // Bold school line and group following details without changing wording
      formatEducationSchools(container);
      return;
    }

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

        if (entry) {
          entry.body.push({ list: items });
        }
        return;
      }

      if (node.tagName === 'P') {
        const raw = (node.textContent || '').trim();
        if (!raw) return;

        if (isIndustry) {
          if (!entry) return;
          entry.body.push(raw);
          return;
        }

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
        if (!sectionName.includes('industry')) {
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
  fetch('./converted.html?v=' + encodeURIComponent(VERSION), { cache: 'no-store' })
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

      // Split technical skills into separate section
      splitTechnicalSkills();

      // Split additional info into separate section
      splitAdditionalInfo();

      // (disabled) Do not strip contact lines; keep content exactly as in CV

      // Keep content as-is: no splitting or restructuring

      // Click-to-toggle and grouping
      const sections = Array.from(resumeRoot.querySelectorAll('.resume-section'));
      console.log(`🔍 Found ${sections.length} resume sections`);
      
      sections.forEach((sec, index) => {
        // Set initial state - sections start collapsed
        sec.setAttribute('aria-expanded', 'false');
        
        const title = sec.querySelector('.resume-title');
        if (!title) {
          console.warn(`⚠️ No title found in section ${index}`);
          return;
        }
        
        console.log(`✅ Processing section ${index + 1}: ${title.textContent.trim()}`);
        
        // Enhanced click handler with better event handling
        const handleToggle = (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const expanded = sec.getAttribute('aria-expanded') === 'true';
          const newState = expanded ? 'false' : 'true';
          
          // Update state
          sec.setAttribute('aria-expanded', newState);
          
          // Add visual feedback
          if (newState === 'true') {
            sec.style.transform = 'translateY(-2px)';
            setTimeout(() => {
              sec.style.transform = '';
            }, 200);
          }
          
          // Debug log
          console.log(`🎯 Section "${title.textContent.trim()}" ${newState === 'true' ? 'expanded' : 'collapsed'}`);
        };
        
        // Add click event listener only - remove touchend to avoid conflicts
        title.addEventListener('click', handleToggle);
        
        // Add keyboard support
        title.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle(e);
          }
        });
        
        // Add focus management for accessibility
        title.addEventListener('focus', () => {
          sec.style.outline = '2px solid var(--accent)';
          sec.style.outlineOffset = '2px';
        });
        
        title.addEventListener('blur', () => {
          sec.style.outline = '';
          sec.style.outlineOffset = '';
        });

        const name = (title.textContent || '').trim().toLowerCase();
        if (name === 'education') {
          // Render exactly as converted; no transformation - keep original structure
        } else if (name === 'industry experience' || name === 'work experience' || name === 'professional experience') {
          // Render exactly as converted; no transformation
        }
      });
      
      console.log(`✅ All ${sections.length} sections processed and event listeners attached`);

      // Preserve original order and details without injections

      // Do not override Industry Experience: render exactly as in converted.html
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