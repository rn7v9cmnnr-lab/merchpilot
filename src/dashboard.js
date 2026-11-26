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
  document.body.innerHTML = ''; document.body.appendChild(root); MP.importInput && MP.importInput();
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
  .thumb{width:46px;height:55px;background:#222;border-radius:4px;object-fit:contain}
  .mp-top h1{font-weight:800;letter-spacing:-.02em}.mp-focus{background:#eaf6f0;color:#0a7d5a;font-weight:600;font-size:12px;padding:4px 10px;border-radius:20px}
  .mp-hero{background:linear-gradient(135deg,#10231c,#1d3b30);color:#eef}.mp-hero .mp-l,.mp-hero .muted{color:#9fc9b6}
  .mp-list{margin:6px 0 8px;padding-left:18px}.mp-list li{margin:2px 0}
  .mp-bar{height:8px;background:#eef0f3;border-radius:6px;overflow:hidden}.mp-bar div{height:100%;background:#0a7d5a}
  .mp-step{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #eef0f3}
  .mp-pill2{flex:0 0 86px;font-size:11px;font-weight:700;color:#2e6bd6;background:#e9f0fd;border-radius:6px;padding:3px 6px;text-align:center}
  .mp-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .mp-prio{color:#fff;font-weight:800;font-size:12px;border-radius:6px;padding:2px 8px}
  .mp-camp{border:1px solid #eef0f3;border-radius:10px;padding:10px 12px;margin-top:8px}
  .mp-campgrid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:8px 0;font-size:13px}
  .pill{margin:2px 0}`;
  document.head.appendChild(css);

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const eur = (v) => (v ?? 0).toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' €';
  let tab = sessionStorage.getItem('mp.tab') || 'overview';

  root.innerHTML = `<div class="mp-top"><h1>MerchPilot</h1><div class="mp-tabs">
      <button data-t="overview">Übersicht</button><button data-t="strategy">Strategie</button><button data-t="control">Steuerung</button><button data-t="pricing">Preise & Werbung</button>
      <button data-t="designs">Designs</button><button data-t="queue">Warteschlange</button><button data-t="settings">Einstellungen</button></div>
      <span style="flex:1"></span><span class="mp-focus">Fokus: T-Shirt · Amazon.de</span><a href="/dashboard" class="muted">Merch ↗</a></div><div id="mp-view"></div>`;
  root.querySelector('.mp-tabs').onclick = (e) => { const t = e.target.dataset.t; if (t) { tab = t; sessionStorage.setItem('mp.tab', t); show(); } };
  const view = root.querySelector('#mp-view');

  function show() {
    root.querySelectorAll('.mp-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
    const plan = window.__MP_PLAN || {};
    ({ overview, designs, queue, settings, strategy: () => plan.strategy(view), pricing: () => plan.pricing(view), control: () => window.__MP_RULES.view(view) })[tab]();
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
  let qFilter = 'review';
  async function queue() {
    const all = MP.queue();
    const cnt = (s) => all.filter((x) => x.status === s).length;
    const q = all.filter((x) => (qFilter === 'all' ? true : x.status === qFilter));
    const pill = (s) => `<span class="pill ${s === 'done' ? 'ok' : s === 'error' ? 'err' : 'wait'}">${{ review: 'zur Freigabe', parked: 'geparkt', pending: 'freigegeben', done: 'hochgeladen', error: 'Fehler', blocked: 'gesperrt (Prüfung)' }[s] || s}</span>`;
    const tabs = [['review', 'Zur Freigabe'], ['pending', 'Freigegeben'], ['done', 'Hochgeladen'], ['error', 'Fehler'], ['blocked', 'Gesperrt'], ['parked', 'Geparkt'], ['all', 'Alle']];
    const niches = [...new Set(q.map((x) => x.niche || '–'))];
    const card = (x) => {
      const b = x.brief || {}; const pr = x.prices ? Object.entries(x.prices).map(([m, v]) => `${m} ${String(v).replace('.', ',')} €`).join(', ') : '';
      return `<div class="qc ${x.status}">
        <canvas class="qimg" data-p="${x.id}" width="200" height="240"></canvas>
        <div class="qb"><div class="qt">${esc(x.title)}</div><div class="muted">${esc(x.brand)} · ${esc(x.id)}</div>
        ${b.ziel ? `<div class="qr"><span>Ziel</span>${esc(b.ziel)}</div>` : ''}
        ${b.zielgruppe ? `<div class="qr"><span>Zielgruppe</span>${esc(b.zielgruppe)}</div>` : ''}
        ${b.anlass ? `<div class="qr"><span>Anlass</span>${esc(b.anlass)}</div>` : ''}
        ${pr ? `<div class="qr"><span>Preis</span>${esc(b.preis || pr)}</div>` : ''}
        ${b.werbung ? `<div class="qr"><span>Werbung</span>${esc(b.werbung)}</div>` : ''}
        ${x.colors ? `<div class="qr"><span>Farben</span>${x.colors.map((c) => `<i class="sw sw-${c}" title="${c}"></i>`).join('')}</div>` : ''}
        ${b.markencheck ? `<div class="qr"><span>Marke</span>${esc(b.markencheck)}</div>` : ''}
        <details><summary class="muted">Listing</summary><div class="muted">• ${esc(x.bullet1 || '')}<br>• ${esc(x.bullet2 || '')}<br>${esc(x.description || '')}</div></details>
        ${x.error ? `<div class="pill err">${esc(x.error)}</div>` : ''}${(x.lint || []).map((i) => `<div class="pill ${i.lvl === 'error' ? 'err' : 'wait'}">${esc(i.field)}: ${esc(i.word || '')} – ${esc(i.why)}</div>`).join(' ')}
        <div class="qa">${pill(x.status)}<span style="flex:1"></span>${x.status === 'review' ? `<button class="btn" data-ok="${x.id}">✓ Freigeben</button><button class="btn sec" data-park="${x.id}">Parken</button>` : ''}${x.status === 'parked' ? `<button class="btn sec" data-rev="${x.id}">Zur Freigabe</button>` : ''}${x.status === 'pending' ? `<button class="btn sec" data-rev="${x.id}">Zurück</button>` : ''}</div></div></div>`;
    };
    view.innerHTML = `<style>
      .qg{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:10px}
      .qc{display:flex;gap:10px;background:#fff;border:1px solid #e3e6ea;border-radius:10px;padding:10px}
      .qc.pending{border-color:#2a6}.qimg{border-radius:8px;flex:none;width:150px;height:180px;background:#1f2024}
      .qb{flex:1;min-width:0;font-size:12px}.qt{font-weight:600;font-size:13px;margin-bottom:2px}
      .qr{display:flex;gap:6px;margin-top:3px}.qr span{flex:none;width:70px;color:#889}
      .qa{display:flex;gap:6px;align-items:center;margin-top:8px}.qn{margin:14px 0 6px;font-weight:600}
      .sw{display:inline-block;width:14px;height:14px;border-radius:50%;margin-right:3px;border:1px solid #ccc}
      .sw-black{background:#111}.sw-navy{background:#1f2a44}.sw-asphalt{background:#3d4148}.sw-dark_heather{background:#4a4b4f}.sw-royal{background:#2a4fb0}
      .qtabs button{margin-right:4px}</style>
      <div class="mp-card">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <b>${cnt('review')} zur Freigabe</b><span class="muted">· ${cnt('pending')} freigegeben · heute ${MP.usedToday()}/${MP.config().dailyProductLimit} Produkte genutzt</span>
        <span style="flex:1"></span>
        <button class="btn sec" id="mp-approve">✓ Alle freigeben (${cnt('review')})</button>
        <button class="btn" id="mp-run">▶ Freigegebene veröffentlichen (${cnt('pending')})</button>
        <button class="btn sec" id="mp-retry">Fehler erneut</button></div>
      <div class="qtabs" style="margin-top:8px">${tabs.map(([k, l]) => `<button class="btn ${qFilter === k ? '' : 'sec'}" data-f="${k}">${l} (${k === 'all' ? all.length : cnt(k)})</button>`).join('')}</div></div>
      ${niches.map((n) => `<div class="qn">${esc(n)} · ${q.filter((x) => (x.niche || '–') === n).length}</div><div class="qg">${q.filter((x) => (x.niche || '–') === n).map(card).join('')}</div>`).join('') || '<div class="mp-card muted" style="margin-top:10px">Nichts in dieser Ansicht.</div>'}`;
    const set = (id, st) => { MP.saveQueue(MP.queue().map((x) => (x.id === id ? { ...x, status: st } : x))); queue(); };
    view.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { qFilter = b.dataset.f; queue(); }));
    view.querySelector('#mp-run').onclick = () => { if (!cnt('pending')) return alert('Noch nichts freigegeben.'); if (confirm(`${cnt('pending')} Designs jetzt auf Amazon veröffentlichen? Der Tab wechselt zum Upload-Formular und arbeitet die Liste ab.`)) MP.run(); };
    view.querySelector('#mp-approve').onclick = () => { MP.saveQueue(MP.queue().map((x) => (x.status === 'review' ? { ...x, status: 'pending' } : x))); queue(); };
    view.querySelectorAll('[data-ok]').forEach((b) => (b.onclick = () => set(b.dataset.ok, 'pending')));
    view.querySelectorAll('[data-park]').forEach((b) => (b.onclick = () => set(b.dataset.park, 'parked')));
    view.querySelectorAll('[data-rev]').forEach((b) => (b.onclick = () => set(b.dataset.rev, 'review')));
    view.querySelector('#mp-retry').onclick = () => { MP.saveQueue(MP.queue().map((x) => (x.status === 'error' ? { ...x, status: 'pending', error: null } : x))); queue(); };
    for (const c of view.querySelectorAll('canvas[data-p]')) {
      const it = q.find((x) => x.id === c.dataset.p); if (!it) continue;
      try {
        const blob = it.imageKey ? await MP.imgGet(it.imageKey) : it.imageDataUrl ? await (await fetch(it.imageDataUrl)).blob() : it.spec ? await MP.render(it.spec) : null;
        if (!blob) continue;
        const img = await createImageBitmap(blob, { resizeWidth: 200, resizeHeight: 240, resizeQuality: 'high' }); const g = c.getContext('2d'); g.fillStyle = '#1f2024'; g.fillRect(0, 0, 200, 240); g.drawImage(img, 0, 0, 200, 240);
      } catch (e) { /* Vorschau optional */ }
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
      <div class="mp-l" style="margin-top:14px">Autopilot</div>
      <label style="display:block"><input type="checkbox" id="mp-as" ${c.autoStart ? 'checked' : ''}> Täglich ab <input type="number" id="mp-ah" value="${c.autoStartHour}" style="width:50px"> Uhr bis zum Tageslimit hochladen (startet, sobald eine Merch-Übersichtsseite offen ist)</label>
      <label style="display:block;margin-top:6px">Automatisch freigeben nach <input type="number" id="mp-aa" value="${c.autoApproveH}" style="width:50px"> Stunden (0 = nur manuell). Gesperrte Designs (Prüfung) werden nie freigegeben.</label>
      <button class="btn" id="mp-save" style="margin-top:12px">Speichern</button>
      <p class="muted">Täglicher Autopilot: Klick aufs MerchPilot-Icon in der Chrome-Leiste (Badge „ON“). Chrome und der Rechner müssen laufen.</p></div>`;
    view.querySelector('#mp-save').onclick = () => {
      try {
        MP.config({ products: JSON.parse(view.querySelector('#mp-prod').value), dailyProductLimit: +view.querySelector('#mp-lim').value, delaySec: [+view.querySelector('#mp-d0').value, +view.querySelector('#mp-d1').value], translate: view.querySelector('#mp-tr').checked, autoStart: view.querySelector('#mp-as').checked, autoStartHour: +view.querySelector('#mp-ah').value, autoApproveH: +view.querySelector('#mp-aa').value });
        view.querySelector('#mp-save').textContent = 'Gespeichert ✓';
      } catch (e) { alert('Produkte-JSON fehlerhaft'); }
    };
  }

  show();
})();
