// Same chat as shawnsingh.me. The key stays in the Worker.
(() => {
  const PROXY = 'https://groq-chat.shawnpsi.workers.dev';
  const SITE = 'https://shawnsingh.me';
  const form = document.getElementById('chat');
  const log = document.getElementById('chat-log');
  const input = document.getElementById('chat-input');
  const msgs = [];

  const say = (who, text) => {
    const p = document.createElement('p');
    p.className = who;
    p.textContent = text;
    log.append(p);
    log.scrollTop = log.scrollHeight;
    return p;
  };

  const LINK = /\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s)*<>]*[^\s)*<>.,;:!?'"]|\/[\w./-]+\.html\b)/g;
  const TITLES = {
    '/about.html': 'About', '/work.html': 'Work', '/project-cloudexa.html': 'Cloudexa',
    '/project-emmy.html': 'Emmy Award', '/project-djai.html': 'DJai', '/project-ngc2.html': 'NGC2',
    '/project-visuallyrepresented.html': 'Visually Represented',
  };
  const linkify = (el, text) => {
    let i = 0;
    for (const m of text.matchAll(LINK)) {
      const href = m[2] || m[3];
      if (!/^(https?:\/\/|\/)/.test(href)) continue;
      el.append(text.slice(i, m.index));
      const a = document.createElement('a');
      a.href = href[0] === '/' ? SITE + href : href;
      a.textContent = (TITLES[href] ? TITLES[href] + ' \u2192' : m[1]) || (href[0] === '/' ? href : new URL(href).hostname);
      if (href[0] !== '/') { a.target = '_blank'; a.rel = 'noopener'; }
      el.append(a);
      i = m.index + m[0].length;
    }
    el.append(text.slice(i));
  };
  const render = (el, text) => {
    text = text.replace(/\*\*/g, '').replace(/[\u2010\u2011]/g, '-');
    el.textContent = '';
    let ul = null, buf = '';
    const flush = () => { if (buf.trim()) { linkify(el, buf.trim()); ul = null; } buf = ''; };
    for (const line of text.split('\n')) {
      const item = line.match(/^\s*[-*\u2022]\s+(.*)/);
      if (!item) { buf += line + '\n'; continue; }
      flush();
      if (!ul) el.append(ul = document.createElement('ul'));
      const li = document.createElement('li');
      linkify(li, item[1].trim());
      ul.append(li);
    }
    flush();
  };

  for (const b of document.querySelectorAll('#connect button')) b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.url); b.textContent = b.dataset.done; }
    catch { b.textContent = b.dataset.url; }
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    say('me', text);
    msgs.push({ role: 'user', content: text });
    const out = say('bot', '\u2026');
    try {
      const r = await fetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs }),
      });
      const raw = await r.text();
      if (!r.ok) {
        let msg = raw.slice(0, 300);
        try { msg = JSON.parse(raw).error?.message || JSON.parse(raw).error || msg; } catch {}
        throw new Error(msg);
      }
      const reply = JSON.parse(raw).choices[0].message.content;
      msgs.push({ role: 'assistant', content: reply });
      render(out, reply);
    } catch (err) {
      msgs.pop();
      out.textContent = err.message || String(err);
      out.classList.add('err');
    }
    log.scrollTop = log.scrollHeight;
  });
})();
