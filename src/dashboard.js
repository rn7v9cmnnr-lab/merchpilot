/* MerchPilot-Tab: https://merch.amazon.com/resource/merchpilot
   Übersicht · Designs · Warteschlange · Einstellungen – nutzt window.MerchPilot */
(() => {
  const MP = window.MerchPilot;
  if (!MP) return;
  const PATH = '/resource/merchpilot';

  // Menüpunkt in der Merch-Navigation
  const addNav = () => {
    const nav = [...document.querySelectorAll('a[href="/advertise"]')][0];
    if (!nav || document.getElementById('mp-nav')) return;
    // ganzen Menüeintrag (li/Wrapper) klonen, damit das Layout passt
    const item = nav.closest('li') || nav;
    const c = item.cloneNode(true); const a = c.tagName === 'A' ? c : c.querySelector('a');
    a.id = 'mp-nav'; a.href = PATH; a.textContent = 'MerchPilot'; a.style.fontWeight = '700';
    item.after(c);
  };
  addNav(); setTimeout(addNav, 2500);

  if (location.pathname !== PATH) return;

  // ---------- Seite aufbauen ----------
  document.title = 'MerchPilot';
  document.getElementById('mp-box')?.remove();
  const root = document.createElement('div');
  root.id = 'mp-app';
  document.body.innerHTML = ''; document.body.appendChild(root);
  const css = document.createElement('style');
  css.textContent = `
  body{margin:0;background:#f6f7f9;font:14px/1.45 system-ui,-apple-system,sans-serif;color:#1d2330}
  #mp-app{max-width:1180px;margin:0 auto;padding:20px}
  .mp-top{display:flex;align-items:center;gap:16px;margin-bottom:16px}.mp-top h1{font-size:20px;margin:0}
  .mp-tabs{display:flex;gap:4px}.mp-tabs button{border:0;background:#e6e9ef;padding:7px 14px;border-radius:8px;cursor:pointer;font-weight:600}
  .mp-tabs button.on{background:#1d2330;color:#fff}
  .mp-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
  .mp-card{background:#fff;border-radius:12px;padding:14px 16px;box-shadow:0 1px 2px #0001}
  .mp-k{font-size:26px;font-weight:700}.mp-l{color:#667;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
  .mp-grid2{display:grid;grid-template-columns:2fr 1fr;gap:12px}
  table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:6px 8px;border-bottom:1px solid #eef0f3;text-align:left}
  th{color:#667;font-weight:600;font-size:12px}td.n,th.n{text-align:right}
  .btn{border:0;background:#0a7d5a;color:#fff;padding:7px 12px;border-radius:8px;cursor:pointer;font-weight:600}
  .btn.sec{background:#e6e9ef;color:#1d2330}.btn.red{background:#b3261e}.btn:disabled{opacity:.4;cursor:default}
  .pill{display:inline-block;padding:1px 8px;border-radius:10px;font-size:11px;background:#eef0f3}
  .pill.ok{background:#d7f3e6;color:#0a7d5a}.pill.err{background:#fde2e0;color:#b3261e}.pill.wait{background:#fff3cd;color:#8a6d00}
  .muted{color:#778}.bar{fill:#0a7d5a}.bar.cur{fill:#7cc4a8}
  textarea,input[type=text],input[type=number]{width:100%;box-sizing:border-box;border:1px solid #d5d9e0;border-radius:8px;padding:8px;font:12px ui-monospace,monospace}
  .thumb{width:46px;height:55px;background:#222;border-radius:4px;object-fit:contain}`;
  document.head.appendChild(css);

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const eur = (v) => (v ?? 0).toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' €';
  let tab = sessionStorage.getItem('mp.tab') || 'overview';

  root.innerHTML = `<div class="mp-top"><h1>MerchPilot</h1><div class="mp-tabs">
      <button data-t="overview">Übersicht</button><button data-t="designs">Designs</button>
      <button data-t="queue">Warteschlange</button><button data-t="settings">Einstellungen</button></div>
      <span style="flex:1"></span><a href="/designs/new" class="muted">Create ↗</a></div><div id="mp-view"></div>`;
  root.querySelector('.mp-tabs').onclick = (e) => { const t = e.target.dataset.t; if (t) { tab = t; sessionStorage.setItem('mp.tab', t); show(); } };
  const view = root.querySelector('#mp-view');

  function show() {
    root.querySelectorAll('.mp-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
    ({ overview, designs, queue, settings })[tab]();
  }

  // ---------- Übersicht ----------
  async function overview(force = false) {
    let s = JSON.parse(localStorage.getItem('mp.stats') || 'null');
    const stale = !s || Date.now() - new Date(s.generated).getTime() > 6 * 3600e3;
    if (force || stale) {
      view.innerHTML = '<div class="mp-card">Lade Verkaufsdaten … (ca. 30 s)</div>';
      try { s = await MP.stats(); } catch (e) { view.innerHTML = `<div class="mp-card">Fehler beim Laden: ${esc(e.message)} <button class="btn sec" id="mp-retry0">Nochmal</button></div>`; view.querySelector('#mp-retry0').onclick = () => overview(true); return; }
    }
    const m = s.monthly; const last12 = m.slice(-12); const prev12 = m.slice(-24, -12);
    const sum = (a, k) => a.reduce((x, y) => x + y[k], 0);
    const max = Math.max(1, ...m.map((x) => x.units));
    const bars = m.map((x, i) => { const h = Math.round((x.units / max) * 120); return `<rect class="bar ${i === m.length - 1 ? 'cur' : ''}" x="${i * 30 + 4}" y="${130 - h}" width="22" height="${h}"><title>${x.month}: ${x.units} Stk · ${x.royaltyEUR.toFixed(0)} €</title></rect>${i % 3 === 0 ? `<text x="${i * 30 + 15}" y="146" font-size="9" text-anchor="middle" fill="#889">${x.month.slice(2)}</text>` : ''}`; }).join('');
    const q = MP.queue(); const cfg = MP.config();
    view.innerHTML = `
      <div class="mp-kpis">
        <div class="mp-card"><div class="mp-l">Verkäufe 12 M</div><div class="mp-k">${sum(last12, 'units')}</div><div class="muted">Vorjahr ${sum(prev12, 'units')}</div></div>
        <div class="mp-card"><div class="mp-l">Royalties 12 M</div><div class="mp-k">${eur(sum(last12, 'royaltyEUR'))}</div><div class="muted">gesamt ${eur(s.totals.royaltyEUR)}</div></div>
        <div class="mp-card"><div class="mp-l">Warteschlange</div><div class="mp-k">${q.filter((x) => x.status === 'pending').length}</div><div class="muted">${q.filter((x) => x.status === 'done').length} hochgeladen</div></div>
        <div class="mp-card"><div class="mp-l">Heute genutzt</div><div class="mp-k">${MP.usedToday()}/${cfg.dailyProductLimit}</div><div class="muted">Produkte × Märkte</div></div>
      </div>
      <div class="mp-grid2">
        <div class="mp-card"><div class="mp-l">Verkäufe pro Monat (24 M)</div><svg viewBox="0 0 ${m.length * 30 + 8} 150" width="100%">${bars}</svg></div>
        <div class="mp-card"><div class="mp-l">Nach Markt</div><table>${s.byMarket.map((x) => `<tr><td>${x.key}</td><td class="n">${x.units}</td><td class="n">${eur(x.royaltyEUR)}</td></tr>`).join('')}</table></div>
      </div>
      <div class="mp-card" style="margin-top:12px"><div style="display:flex;justify-content:space-between"><div class="mp-l">Top-Designs (gesamt)</div>
        <button class="btn sec" id="mp-ref">Aktualisieren</button></div>
        <table><tr><th>Design</th><th class="n">Stück</th><th class="n">Royalties</th></tr>
        ${s.topDesigns.slice(0, 15).map((x) => `<tr><td>${esc(x.key)}</td><td class="n">${x.units}</td><td class="n">${eur(x.royaltyEUR)}</td></tr>`).join('')}</table>
        <div class="muted" style="margin-top:6px">Stand ${new Date(s.generated).toLocaleString('de-DE')} · Umrechnung in € gerundet</div></div>`;
    view.querySelector('#mp-ref').onclick = () => overview(true);
  }

  // ---------- Designs / Aufräumen ----------
  async function designs() {
    view.innerHTML = '<div class="mp-card">Lade Designs und Verkäufe …</div>';
    const [ds, s12, sAll] = [await MP.designs(), await MP.sales(Date.now() - 365 * 864e5), await MP.sales(Date.now() - 7 * 365 * 864e5)];
    const n = (s) => (s || '').toLowerCase().replace(/[^a-z0-9äöüß ]/g, ' ').replace(/\s+/g, ' ').trim();
    const count = (rows, t) => { const k = n(t).slice(0, 22); return rows.filter((r) => n(r.name).includes(k)).reduce((a, r) => a + r.units, 0); };
    const live = ds.filter((d) => d.status.some((x) => x === 'PUBLISHED' || x === 'PROPAGATED'));
    const rows = live.map((d) => ({ ...d, u12: count(s12, d.title), uAll: count(sAll, d.title), age: Math.round((Date.now() - new Date(d.created)) / 864e5) }))
      .sort((a, b) => a.u12 - b.u12 || b.age - a.age);
    const cand = rows.filter((r) => r.u12 === 0 && r.age > 365);
    view.innerHTML = `<div class="mp-card">
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px">
        <b>${live.length} live</b><span class="muted">· ${cand.length} ohne Verkauf in 12 M (älter als 1 Jahr) · davon ${cand.filter((r) => r.uAll === 0).length} nie verkauft</span>
        <span style="flex:1"></span>
        <button class="btn sec" id="mp-selc">Kandidaten markieren</button>
        <button class="btn red" id="mp-del" disabled title="Löschen wird nach der ersten Bestätigung freigeschaltet">Markierte löschen</button></div>
      <table><tr><th></th><th>Design</th><th>Erstellt</th><th class="n">Verk. 12 M</th><th class="n">Verk. gesamt</th><th class="n">Produkte</th></tr>
      ${rows.map((r) => `<tr><td><input type="checkbox" data-id="${r.id}"></td><td>${esc(r.title)}<div class="muted">${esc(r.brand)}</div></td><td>${r.created}</td>
        <td class="n">${r.u12 || '<span class="pill">0</span>'}</td><td class="n">${r.uAll}</td><td class="n">${r.products}</td></tr>`).join('')}</table></div>`;
    view.querySelector('#mp-selc').onclick = () => { const ids = new Set(cand.map((c) => c.id)); view.querySelectorAll('input[data-id]').forEach((c) => (c.checked = ids.has(c.dataset.id))); };
    window.__mpSelected = () => [...view.querySelectorAll('input[data-id]:checked')].map((c) => c.dataset.id);
  }

  // ---------- Warteschlange ----------
  async function queue() {
    const q = MP.queue();
    const pill = (s) => `<span class="pill ${s === 'done' ? 'ok' : s === 'error' ? 'err' : 'wait'}">${{ review: 'zur Freigabe', pending: 'freigegeben', done: 'hochgeladen', error: 'Fehler', blocked: 'gesperrt (Prüfung)' }[s] || s}</span>`;
    view.innerHTML = `<div class="mp-card">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
        <b>${q.filter((x) => x.status === 'pending').length} wartend</b><span class="muted">· ca. ${Math.floor(MP.config().dailyProductLimit / Object.values(MP.config().products).reduce((s, m) => s + m.length, 0))} Designs/Tag möglich</span>
        <span style="flex:1"></span>
        <button class="btn sec" id="mp-approve">✓ Alle zur Freigabe freigeben (${q.filter((x) => x.status === 'review').length})</button>
        <button class="btn" id="mp-run">▶ Jetzt starten</button>
        <button class="btn sec" id="mp-retry">Fehler erneut</button>
        <button class="btn sec" id="mp-clear">Erledigte entfernen</button></div>
      <table><tr><th></th><th>Titel</th><th>Marke</th><th>Status</th><th></th></tr>
      ${q.slice().reverse().map((x) => `<tr><td><canvas class="thumb" data-p="${x.id}" width="90" height="108"></canvas></td>
        <td>${esc(x.title)}<div class="muted">${esc(x.niche || '')}</div>${x.error ? `<div class="pill err">${esc(x.error)}</div>` : ''}${(x.lint || []).map((i) => `<div class="pill ${i.lvl === 'error' ? 'err' : 'wait'}">${esc(i.field)}: ${esc(i.word || '')} – ${esc(i.why)}</div>`).join(' ')}</td>
        <td>${esc(x.brand)}</td><td>${pill(x.status)}</td><td>${x.status === 'review' ? `<button class="btn" data-ok="${x.id}">✓</button> ` : ''}<button class="btn sec" data-rm="${x.id}">✕</button></td></tr>`).join('') || '<tr><td colspan=5 class="muted">Leer – im Chat „neue Designs“ schreiben.</td></tr>'}</table></div>
      <div class="mp-card" style="margin-top:12px"><div class="mp-l">JSON importieren (Liste von Designs)</div>
      <textarea id="mp-json" rows="4" placeholder='[{"title":"…","brand":"…","bullet1":"…","bullet2":"…","description":"…","spec":{"lines":[{"text":"…","font":"Anton","size":600,"color":"#fff"}]}}]'></textarea>
      <button class="btn sec" id="mp-imp" style="margin-top:6px">Importieren</button></div>`;
    view.querySelector('#mp-run').onclick = () => MP.run();
    view.querySelector('#mp-approve').onclick = () => { MP.saveQueue(MP.queue().map((x) => (x.status === 'review' ? { ...x, status: 'pending' } : x))); queue(); };
    view.querySelectorAll('[data-ok]').forEach((b) => (b.onclick = () => { MP.saveQueue(MP.queue().map((x) => (x.id === b.dataset.ok ? { ...x, status: 'pending' } : x))); queue(); }));
    view.querySelector('#mp-retry').onclick = () => { MP.saveQueue(MP.queue().map((x) => (x.status === 'error' ? { ...x, status: 'pending', error: null } : x))); queue(); };
    view.querySelector('#mp-clear').onclick = () => { MP.saveQueue(MP.queue().filter((x) => x.status !== 'done')); queue(); };
    view.querySelector('#mp-imp').onclick = () => { try { MP.enqueue(JSON.parse(view.querySelector('#mp-json').value)); queue(); } catch (e) { alert('JSON fehlerhaft: ' + e.message); } };
    view.querySelectorAll('[data-rm]').forEach((b) => (b.onclick = () => { MP.saveQueue(MP.queue().filter((x) => x.id !== b.dataset.rm)); queue(); }));
    // Vorschaubilder
    for (const c of view.querySelectorAll('canvas[data-p]')) {
      const it = q.find((x) => x.id === c.dataset.p); if (!it) continue;
      const blob = it.imageDataUrl ? await (await fetch(it.imageDataUrl)).blob() : it.spec ? await MP.render(it.spec) : null;
      if (!blob) continue;
      const img = await createImageBitmap(blob); const g = c.getContext('2d'); g.fillStyle = '#222'; g.fillRect(0, 0, 90, 108); g.drawImage(img, 0, 0, 90, 108);
    }
  }

  // ---------- Einstellungen ----------
  function settings() {
    const c = MP.config();
    view.innerHTML = `<div class="mp-card" style="max-width:640px">
      <div class="mp-l">Produkte × Märkte (Amazon-Schlüssel; Märkte US, GB, DE, FR, IT, ES, JP)</div>
      <textarea id="mp-prod" rows="5">${esc(JSON.stringify(c.products, null, 1))}</textarea>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:10px">
        <label>Tageslimit<input type="number" id="mp-lim" value="${c.dailyProductLimit}"></label>
        <label>Pause min (s)<input type="number" id="mp-d0" value="${c.delaySec[0]}"></label>
        <label>Pause max (s)<input type="number" id="mp-d1" value="${c.delaySec[1]}"></label></div>
      <label style="display:block;margin-top:10px"><input type="checkbox" id="mp-tr" ${c.translate ? 'checked' : ''}> Amazon übersetzt Listings automatisch</label>
      <button class="btn" id="mp-save" style="margin-top:12px">Speichern</button>
      <p class="muted">Täglicher Autopilot: Klick aufs MerchPilot-Icon in der Chrome-Leiste (Badge „ON“). Chrome und der Rechner müssen laufen.</p></div>`;
    view.querySelector('#mp-save').onclick = () => {
      try {
        MP.config({ products: JSON.parse(view.querySelector('#mp-prod').value), dailyProductLimit: +view.querySelector('#mp-lim').value, delaySec: [+view.querySelector('#mp-d0').value, +view.querySelector('#mp-d1').value], translate: view.querySelector('#mp-tr').checked });
        view.querySelector('#mp-save').textContent = 'Gespeichert ✓';
      } catch (e) { alert('Produkte-JSON fehlerhaft'); }
    };
  }

  show();
})();
