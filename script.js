(function () {
  const VERSION = '2025-08-19-5';
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

  // ... existing code ...

  // Visit notification - optional via meta[name="notify-endpoint"]
  try {
    const meta = document.querySelector('meta[name="notify-endpoint"]');
    const url = (meta && meta.content || '').trim();
    if (url) {
      const payload = {
        path: location.pathname + location.search,
        referrer: document.referrer || '',
        userAgent: navigator.userAgent,
        ts: new Date().toISOString()
      };
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), mode: 'no-cors', keepalive: true }).catch(() => {});
      }
    }
  } catch(_) {}

})();