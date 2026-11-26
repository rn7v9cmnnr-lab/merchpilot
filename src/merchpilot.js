/* MerchPilot – läuft im Seitenkontext von merch.amazon.com.
   API für den Chat:  window.MerchPilot.{stats, designs, cleanupCandidates, enqueue, queue, run, render, config}  */
(() => {
  if (window.MerchPilot) return;

  // ---------- Basis ----------
  const MKT = { US: 'ATVPDKIKX0DER', UK: 'A1F83G8C2ARO7P', DE: 'A1PA6795UKMFR9', FR: 'A13V1IB3VIYZZH', IT: 'APJ6JRA9NG5V4', ES: 'A1RKKUPIHCS9HS', JP: 'A1VC38T7YXB528' };
  const MKT_NAME = Object.fromEntries(Object.entries(MKT).map(([k, v]) => [v, k]));
  const FX = { EUR: 1, USD: 0.92, GBP: 1.17, JPY: 0.0061 };
  const DEFAULT_CFG = {
    // Amazon-Produktschlüssel × Marktplatz (US, GB, DE, FR, IT, ES, JP) – jede Kombination zählt 1 aufs Tageslimit
    products: { STANDARD_TSHIRT: ['DE'] }, // Fokus: nur T-Shirt auf Amazon.de
    dailyProductLimit: 50,   // Amazon zählt Produkt × Marktplatz
    delaySec: [10, 25],      // Pause zwischen Uploads
    searchable: true,
    translate: false,        // nur Amazon.de, Listing ist bereits deutsch
    colors: ['black', 'navy', 'asphalt', 'dark_heather'], // helle Motive → dunkle Shirts
    prices: { DE: 19.99 },   // Startpreis laut Preisstrategie
    minRoyalty: 3.5,
    autoApproveH: 12,        // Designs „zur Freigabe“ werden nach X Stunden automatisch freigegeben (0 = aus)
    autoStart: true,         // täglich ab autoStartHour die Warteschlange abarbeiten, sobald eine Merch-Seite offen ist
    autoStartHour: 10,         // Sicherheitsnetz: nie unter 3,50 € Tantieme veröffentlichen
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ls = { get: (k, d = null) => { try { return JSON.parse(localStorage.getItem('mp.' + k)) ?? d; } catch { return d; } }, set: (k, v) => localStorage.setItem('mp.' + k, JSON.stringify(v)) };
  const cfg = () => ({ ...DEFAULT_CFG, ...ls.get('cfg', {}) });
  const today = () => new Date().toISOString().slice(0, 10);
  const log = (...a) => { console.log('[MerchPilot]', ...a); ui.status(a.join(' ')); };

  let _sess = null;
  function session() {
    const s = [...document.scripts].map((x) => x.textContent).join('\n');
    const r = { token: (s.match(/"token":"([^"]+)"/) || [])[1], accountId: (s.match(/"accountId":"([^"]+)"/) || [])[1] };
    return r.token ? r : _sess || r;
  }
  // Auf Seiten ohne eingebettetes Token (z. B. Dashboard-Ressource) Token aus /dashboard holen
  async function ensureSession() {
    if (session().token) return session();
    const h = await (await fetch('/dashboard', { credentials: 'include' })).text();
    _sess = { token: (h.match(/"token":"([^"]+)"/) || [])[1], accountId: (h.match(/"accountId":"([^"]+)"/) || [])[1] };
    return _sess;
  }
  async function coral(path, body) {
    const { token } = await ensureSession();
    return new Promise((res, rej) => {
      const x = new XMLHttpRequest();
      x.open('POST', '/api/ng-amazon/coral/' + path);
      x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      x.setRequestHeader('X-CSRF-Token', token);
      x.setRequestHeader('Accept', 'application/json, text/plain, */*');
      x.setRequestHeader('Content-Type', 'text/plain');
      x.onload = () => (x.status < 300 ? res(JSON.parse(x.responseText || '{}')) : rej(new Error(path + ' ' + x.status)));
      x.onerror = rej;
      x.send(JSON.stringify(body));
    });
  }
  const mkQs = Object.values(MKT).map((m) => 'marketplaceId=' + m).join('&');

  // ---------- Daten ----------
  // robust: leere Antworten / Drosselung -> bis zu 3 Versuche mit Pause
  async function getJson(url) {
    for (let k = 0; k < 3; k++) {
      try { const r = await fetch(url); const t = await r.text(); if (r.ok && t) return JSON.parse(t); } catch (e) { /* nochmal */ }
      await sleep(800 * (k + 1));
    }
    console.warn('[MerchPilot] keine Daten für', url.split('?')[0]); return {};
  }
  async function sales(fromMs, toMs = Date.now()) {
    const rows = [];
    for (let end = toMs; end > fromMs;) {
      const from = Math.max(fromMs, end - 90 * 864e5);
      const j = await getJson(`/api/reporting/purchases/records?${mkQs}&fromDate=${from}&toDate=${end}`);
      for (const mid in j) for (const mp in j[mid]) for (const r of j[mid][mp]) {
        const cur = r.revenue?.code;
        rows.push({ id: mid, mkt: MKT_NAME[mp], type: r.productType, name: r.asinName || '', units: r.unitsSold, returned: r.unitsReturned, cancelled: r.unitsCancelled, royaltyEUR: (r.royalties?.value || 0) * (FX[cur] || 1), revenueEUR: (r.revenue?.value || 0) * (FX[cur] || 1), from, to: end });
      }
      end = from - 1;
    }
    return rows;
  }

  async function monthly(months = 24) {
    const out = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const f = new Date(now.getFullYear(), now.getMonth() - i, 1).getTime();
      const t = Math.min(Date.now(), new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime() - 1);
      const r = await sales(f, t);
      out.push({ month: new Date(f).toISOString().slice(0, 7), units: r.reduce((s, x) => s + x.units - x.returned - x.cancelled, 0), royaltyEUR: +r.reduce((s, x) => s + x.royaltyEUR, 0).toFixed(2) });
    }
    return out;
  }

  async function stats({ years = 7 } = {}) {
    const rows = await sales(Date.now() - years * 365 * 864e5);
    const agg = (key) => Object.entries(rows.reduce((o, r) => { const k = key(r); o[k] = o[k] || { units: 0, royaltyEUR: 0 }; o[k].units += r.units; o[k].royaltyEUR += r.royaltyEUR; return o; }, {}))
      .map(([k, v]) => ({ key: k, units: v.units, royaltyEUR: +v.royaltyEUR.toFixed(2) })).sort((a, b) => b.units - a.units);
    const res = {
      generated: new Date().toISOString(),
      totals: { units: rows.reduce((s, r) => s + r.units, 0), returned: rows.reduce((s, r) => s + r.returned, 0), royaltyEUR: +rows.reduce((s, r) => s + r.royaltyEUR, 0).toFixed(2), revenueEUR: +rows.reduce((s, r) => s + r.revenueEUR, 0).toFixed(2) },
      byMarket: agg((r) => r.mkt), byProduct: agg((r) => r.type), topDesigns: agg((r) => r.name.slice(0, 80)).slice(0, 40),
      monthly: await monthly(24),
    };
    ls.set('stats', res);
    return res;
  }

  async function designs() {
    const all = []; let pageToken = [];
    do {
      const j = await coral('com.amazon.merch.search.MerchSearchService/FindDesigns', {
        pageSize: 250, pageToken, sortField: 'DateCreated', sortOrder: 'Descending', status: ['DRAFT','TRANSLATING','REVIEW','DECLINED','AMAZON_REJECTED','PUBLISHING','TIMED_OUT','PROPAGATED','PUBLISHED','REMOVED','LOCKED'], marketplaces: null, productTypes: null,
        searchableOnRetail: null, accountId: (await ensureSession()).accountId, __type: 'com.amazon.merch.search#FindDesignsRequest',
      });
      all.push(...(j.results || [])); pageToken = j.pageToken && j.pageToken.length ? j.pageToken : null;
    } while (pageToken);
    return all.map((d) => ({ id: d.designId, title: d.designTitle, brand: d.brandName, created: new Date(d.createdDate * 1000).toISOString().slice(0, 10), status: d.listingStatuses, markets: d.marketplaces, products: d.productCount }));
  }

  const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9äöüß ]/g, ' ').replace(/\s+/g, ' ').trim();
  async function cleanupCandidates({ noSaleDays = 365, minAgeDays = 365 } = {}) {
    const [ds, rows] = [await designs(), await sales(Date.now() - noSaleDays * 864e5)];
    const names = rows.map((r) => norm(r.name));
    const cutoff = Date.now() - minAgeDays * 864e5;
    return ds.filter((d) => d.status.some((s) => s === 'PUBLISHED' || s === 'PROPAGATED'))
      .filter((d) => new Date(d.created).getTime() < cutoff)
      .filter((d) => !names.some((n) => n.includes(norm(d.title).slice(0, 22))));
  }

  // ---------- Renderer: JSON-Spec -> PNG 4500x5400 ----------
  let fontsReady = null;
  function loadFonts() {
    if (fontsReady) return fontsReady;
    fontsReady = Promise.all(Object.entries(window.__MP_FONTS || {}).map(async ([name, b64]) => {
      const buf = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
      const f = new FontFace(name, buf); await f.load(); document.fonts.add(f);
    }));
    return fontsReady;
  }
  /* spec: { lines:[{text, font:'Anton', size:600, color:'#fff', weight?, italic?, gap?}], align:'center', top: 300, shadow?:false, stroke?:{color,width} , icon?: null } */
  /* spec: { lines: [[text, font, size, color], …] }  font: Anton | Bebas | Marker | Oswald
     Hauptzeilen füllen 88 % der Breite, Marker-Zeilen 75 % (max. 60 % der Hauptzeilenhöhe) – wie die Vorschau im Plan. */
  const FONT = { Anton: 'Anton', Bebas: 'Bebas Neue', Marker: 'Permanent Marker', Oswald: 'Oswald' };
  async function render(spec) {
    await loadFonts();
    const W = 4500, H = 5400, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.textBaseline = 'alphabetic';
    const L0 = spec.lines.map((l) => (Array.isArray(l) ? { text: l[0], font: l[1], color: l[3] } : l));
    const fam = (f) => FONT[f] || f || 'Anton';
    const fit = (t, f, frac, cap) => { g.font = `100px "${fam(f)}"`; return Math.min(Math.floor(100 * W * frac / g.measureText(t).width), cap); };
    const mains = L0.filter((l) => l.font !== 'Marker');
    const ref = mains.length ? Math.min(...mains.map((l) => fit(l.text, l.font, 0.88, 1500))) : 900;
    let L = L0.map((l) => ({ ...l, size: l.font !== 'Marker' ? fit(l.text, l.font, 0.88, 1500) : fit(l.text, l.font, 0.75, Math.floor(ref * 0.6)) }));
    const measure = (l) => { g.font = `${l.size}px "${fam(l.font)}"`; const m = g.measureText(l.text); return { w: m.width, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent }; };
    const gap = 120;
    let total = L.reduce((s, l) => { const m = measure(l); return s + m.asc + m.desc; }, 0) + gap * (L.length - 1);
    if (total > H * 0.62) { const k = (H * 0.62) / total; L = L.map((l) => ({ ...l, size: Math.floor(l.size * k) })); }
    let y = spec.top ?? 150;
    for (const l of L) {
      const m = measure(l); y += m.asc;
      g.fillStyle = l.color || '#ffffff'; g.fillText(l.text, (W - m.w) / 2, y);
      y += m.desc + gap;
    }
    return new Promise((r) => c.toBlob(r, 'image/png'));
  }

  // ---------- Bildablage (IndexedDB, bleibt im Browser) ----------
  const idb = () => new Promise((res, rej) => { const r = indexedDB.open('merchpilot', 1); r.onupgradeneeded = () => r.result.createObjectStore('images'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  async function imgPut(key, blob) { const db = await idb(); return new Promise((res, rej) => { const tx = db.transaction('images', 'readwrite'); tx.objectStore('images').put(blob, key); tx.oncomplete = () => res(key); tx.onerror = () => rej(tx.error); }); }
  async function imgGet(key) { const db = await idb(); return new Promise((res, rej) => { const tx = db.transaction('images', 'readonly'); const q = tx.objectStore('images').get(key); q.onsuccess = () => res(q.result || null); q.onerror = () => rej(q.error); }); }
  async function imgKeys() { const db = await idb(); return new Promise((res) => { const tx = db.transaction('images', 'readonly'); const q = tx.objectStore('images').getAllKeys(); q.onsuccess = () => res(q.result || []); }); }
  // Unsichtbares Datei-Feld: Bilder per Dateiauswahl in die Ablage übernehmen (Dateiname = Schlüssel)
  function importInput() {
    let inp = document.getElementById('mp-import');
    if (inp) return inp;
    inp = document.createElement('input'); inp.type = 'file'; inp.id = 'mp-import'; inp.multiple = true; inp.accept = 'image/png,application/json';
    inp.style.cssText = 'position:fixed;left:-9999px;top:0';
    inp.addEventListener('change', async () => {
      const done = [];
      for (const f of inp.files) {
        if (f.name.endsWith('.json')) { const items = JSON.parse(await f.text()); enqueue(items.items || items, { status: 'review' }); done.push(f.name); }
        else { await imgPut(f.name, f); done.push(f.name); }
      }
      ls.set('lastImport', { at: new Date().toISOString(), files: done });
      inp.value = '';
      ui.status(`${done.length} Dateien übernommen`);
    });
    document.body.appendChild(inp); return inp;
  }

  // ---------- Warteschlange ----------
  /* Item: { id, spec | imageDataUrl, title, brand, bullet1, bullet2, description, niche, products? } */
  const queue = () => ls.get('queue', []);
  const saveQueue = (q) => ls.set('queue', q);
  function enqueue(items, { status = 'pending' } = {}) {
    const q = queue();
    for (const it of [].concat(items)) {
      const l = window.__MP_LINT ? window.__MP_LINT(it, cfg().lintExtra || []) : { ok: true, issues: [] };
      q.push({ id: it.id || crypto.randomUUID(), status: l.ok ? status : 'blocked', added: new Date().toISOString(), lint: l.issues, ...it });
    }
    saveQueue(q); ui.refresh(); return q.filter((x) => x.status === 'pending').length;
  }
  const usedToday = () => (ls.get('usage', {})[today()] || 0);
  const addUsage = (n) => { const u = ls.get('usage', {}); u[today()] = (u[today()] || 0) + n; ls.set('usage', u); };
  const productCount = (p) => Object.values(p).reduce((s, m) => s + m.length, 0);

  // ---------- Uploader (füllt das offizielle Create-Formular) ----------
  const $ = (s, r = document) => r.querySelector(s);
  async function waitFor(fn, ms = 30000, step = 300) { const t = Date.now(); while (Date.now() - t < ms) { const v = fn(); if (v) return v; await sleep(step); } throw new Error('Timeout'); }
  function setVal(el, v) {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.dispatchEvent(new Event('blur', { bubbles: true }));
  }
  async function dropArtwork(blob) {
    const file = new File([blob], 'design.png', { type: 'image/png' });
    const dt = new DataTransfer(); dt.items.add(file);
    const zone = [...document.querySelectorAll('*')].filter((e) => /Drag and drop artwork here/.test(e.textContent) && e.children.length < 6).pop();
    if (!zone) throw new Error('Upload-Feld nicht gefunden');
    ['dragenter', 'dragover', 'drop'].forEach((t) => zone.dispatchEvent(new DragEvent(t, { bubbles: true, cancelable: true, dataTransfer: dt })));
    await waitFor(() => !/Drag and drop artwork here|Uploading/.test(document.body.innerText), 90000);
    await sleep(1500);
  }
  async function selectProducts(products) {
    const modal = () => $('.modal.show');
    const btn = (txt) => [...(modal()?.querySelectorAll('button,a') || [])].find((b) => b.innerText.trim() === txt);
    const checked = () => [...modal().querySelectorAll('flowcheckbox')].filter((f) => f.querySelector('input')?.checked).map((f) => f.className.split(' ')[0]);
    $('#select-marketplace-button-original').click();
    await waitFor(() => btn('Continue'));
    (btn('None') || btn('Deselect All'))?.click(); await sleep(800);
    if (checked().length) { for (const c of checked()) { modal().querySelector(`flowcheckbox.${c}`)?.click(); await sleep(150); } }
    const want = [];
    for (const [type, mkts] of Object.entries(products)) for (const mk of mkts) {
      const el = $(`.modal.show flowcheckbox.${type}-${mk}`); // Angular rendert neu -> jedes Mal frisch suchen
      if (!el) throw new Error(`Produkt/Markt nicht verfügbar: ${type}-${mk}`);
      el.click(); want.push(`${type}-${mk}`); await sleep(500);
    }
    const got = checked();
    if (got.sort().join() !== want.sort().join()) throw new Error(`Produktauswahl ${got.join(',') || 'leer'} statt ${want.join(',')}`);
    btn('Continue').click();
    await waitFor(() => !modal());
    await sleep(800);
    const lim = [...document.querySelectorAll('.alert')].find((e) => /daily limit/i.test(e.innerText));
    if (lim) throw new Error('Amazon-Tageslimit-Hinweis: ' + lim.innerText.trim().slice(0, 120));
  }
  // Produkt-Editor (Farben/Preis) öffnen, falls zu
  async function openEditor() {
    if (document.querySelector('colorcheckbox')) return;
    const card = [...document.querySelectorAll('*')].filter((e) => e.children.length < 12 && /^Standard t-shirt\s*Edit details/i.test(e.innerText.trim())).pop();
    const b = card && [...card.querySelectorAll('button,a')].find((x) => /Edit details/i.test(x.innerText));
    if (b) b.click();
    await waitFor(() => document.querySelector('colorcheckbox'), 15000);
  }
  async function setColors(colors) {
    await openEditor();
    for (const c of document.querySelectorAll('colorcheckbox')) {
      const name = c.className.split(' ')[0].replace('-checkbox', '');
      const inp = c.querySelector('input');
      if (inp.checked !== colors.includes(name)) { (c.querySelector('span') || c).click(); await sleep(250); }
    }
    const on = [...document.querySelectorAll('colorcheckbox')].filter((c) => c.querySelector('input').checked).map((c) => c.className.split(' ')[0].replace('-checkbox', ''));
    if (on.sort().join() !== [...colors].sort().join()) throw new Error('Farben: ' + on.join(',') + ' statt ' + colors.join(','));
  }
  const DOMAIN = { DE: '.de', US: '.com', UK: '.co.uk', FR: '.fr', IT: '.it', ES: '.es', JP: '.co.jp' };
  const rowOf = (i) => { let a = i; for (let k = 0; k < 6; k++) a = a.parentElement; return a; };
  async function setPrices(prices) {
    await openEditor();
    const res = {};
    for (const [mk, price] of Object.entries(prices)) {
      const inp = [...document.querySelectorAll('input[formcontrolname=amount]')].find((i) => new RegExp(DOMAIN[mk].replace(/\./g, '\\.') + '(\\s|$)').test(rowOf(i).innerText));
      if (!inp) throw new Error('Preisfeld fehlt: ' + mk);
      setVal(inp, Number(price).toFixed(2)); await sleep(1200);
      res[mk] = +((rowOf(inp).innerText.match(/([\d.,]+)\s*Estimated royalty/) || [])[1] || '0').replace(',', '.');
    }
    return res; // geschätzte Tantieme je Markt
  }
  async function fillAndPublish(item, { dryRun = false } = {}) {
    const c = cfg();
    const l = window.__MP_LINT ? window.__MP_LINT(item, c.lintExtra || []) : { ok: true, issues: [] };
    if (!l.ok) throw new Error('Prüfung: ' + l.issues.filter((x) => x.lvl === 'error').map((x) => `${x.field}: ${x.word || x.why}`).join('; '));
    const blob = item.imageKey ? await imgGet(item.imageKey) : item.imageDataUrl ? await (await fetch(item.imageDataUrl)).blob() : await render(item.spec);
    if (!blob) throw new Error('Bild fehlt in der Ablage: ' + item.imageKey);
    await dropArtwork(blob);
    await selectProducts(item.products || c.products);
    await setColors(item.colors || c.colors);
    const roy = await setPrices(item.prices || c.prices);
    item.royalty = roy;
    for (const [mk, r] of Object.entries(roy)) if (r < (c.minRoyalty || 0)) throw new Error(`Tantieme ${mk} ${r} < Minimum ${c.minRoyalty}`);
    if (item.translate ?? c.translate) $('#translation-request-yes')?.click(); else $('#translation-request-no')?.click();
    await sleep(500);
    setVal($('#designCreator-productEditor-title'), item.title.slice(0, 60));
    setVal($('#designCreator-productEditor-brandName'), item.brand.slice(0, 50));
    if (item.bullet1) setVal($('#designCreator-productEditor-featureBullet1'), item.bullet1.slice(0, 256));
    if (item.bullet2) setVal($('#designCreator-productEditor-featureBullet2'), item.bullet2.slice(0, 256));
    let desc = item.description || '';
    if (desc.length < 75) desc = [desc, item.bullet1, item.bullet2].filter(Boolean).join(' ');
    setVal($('#designCreator-productEditor-description'), desc.slice(0, 2000)); // Amazon verlangt 75–2000 Zeichen
    // Sichtbarkeit: Radios in der Reihenfolge [Non-searchable, Searchable]
    const radios = [...document.querySelectorAll('input[type=radio]')].filter((r) => !/translation/.test(r.id));
    radios[c.searchable ? radios.length - 1 : radios.length - 2]?.click();
    await sleep(800);
    if (dryRun) return 'dry-run: Formular gefüllt, nicht veröffentlicht';
    const btn = await waitFor(() => { const b = $('#submit-button'); return b && !b.disabled && b; }, 30000);
    btn.click();
    // evtl. Bestätigungsdialog
    await sleep(2000);
    const confirm = [...document.querySelectorAll('.modal.show button')].find((b) => /^(publish|submit|confirm|yes)/i.test(b.innerText.trim()));
    if (confirm) confirm.click();
    // Erfolg prüfen: Design taucht in der eigenen Designliste auf
    const t = norm(item.title).slice(0, 30);
    await sleep(2500);
    for (let k = 0; k < 20; k++) {
      if ((await designs()).some((d) => norm(d.title).startsWith(t))) return 'published';
      await sleep(3000);
    }
    throw new Error('Veröffentlichung nicht bestätigt – bitte in Manage prüfen');
  }

  async function run({ max = Infinity, dryRun = false } = {}) {
    if (!location.pathname.startsWith('/designs/new')) { ls.set('resume', true); location.href = '/designs/new'; return; }
    const c = cfg(); const per = productCount(c.products);
    const q = queue(); const item = q.find((x) => x.status === 'pending');
    if (!item) { ls.set('resume', false); return log('Warteschlange leer.'); }
    if (usedToday() + productCount(item.products || c.products) > c.dailyProductLimit) { ls.set('resume', false); return log(`Tageslimit erreicht (${usedToday()}/${c.dailyProductLimit}).`); }
    if (max <= 0) { ls.set('resume', false); return; }
    ls.set('resume', true); ls.set('runLock', Date.now());
    log('Lade hoch:', item.title);
    try {
      const r = await fillAndPublish(item, { dryRun });
      if (dryRun) return log(r);
      item.status = 'done'; item.published = new Date().toISOString(); addUsage(productCount(item.products || c.products)); ls.set('errStreak', 0);
    } catch (e) { item.status = 'error'; item.error = String(e.message || e); log('Fehler:', item.error); ls.set('errStreak', (ls.get('errStreak', 0) || 0) + 1); }
    saveQueue(q);
    if (ls.get('errStreak', 0) >= 2) { ls.set('resume', false); ls.set('errStreak', 0); return log('Gestoppt: 2 Fehler in Folge – bitte prüfen.'); }
    if (ls.get('resume') === false) return log('Gestoppt.');
    ls.set('resumeMax', max - 1);
    await sleep(rnd(...c.delaySec) * 1000);
    if (ls.get('resume') === false) return log('Gestoppt.');
    location.href = '/designs/new';
  }

  // ---------- Mini-UI ----------
  const ui = (() => {
    const box = document.createElement('div');
    box.id = 'mp-box';
    box.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:99999;font:13px system-ui;background:#111;color:#eee;border-radius:10px;box-shadow:0 4px 20px #0006;min-width:220px;max-width:320px';
    box.innerHTML = `<div style="padding:8px 12px;display:flex;justify-content:space-between;cursor:pointer" id="mp-h"><b>MerchPilot</b><span id="mp-badge"></span></div>
      <div id="mp-body" style="display:none;padding:0 12px 12px">
        <div id="mp-kpi" style="margin:4px 0 8px;line-height:1.6"></div>
        <button data-a="run">▶ Warteschlange starten</button> <button data-a="stop">■ Stop</button>
        <div id="mp-st" style="margin-top:8px;color:#9c9;font-size:12px"></div></div>`;
    const css = document.createElement('style'); css.textContent = '#mp-box button{background:#2a6;border:0;color:#fff;border-radius:6px;padding:4px 8px;margin:2px 0;cursor:pointer}#mp-box button[data-a=stop]{background:#733}';
    document.head.appendChild(css);
    const mount = () => { document.body.appendChild(box); refresh(); };
    box.addEventListener('click', (e) => {
      if (e.target.closest('#mp-h')) { const b = box.querySelector('#mp-body'); b.style.display = b.style.display === 'none' ? 'block' : 'none'; }
      const a = e.target.dataset?.a; if (a === 'run') run(); if (a === 'stop') { ls.set('resume', false); ls.set('autoSkip', today()); window.dispatchEvent(new Event('mp-stop')); status('Gestoppt (Autopilot ruht bis morgen).'); }
    });
    function refresh() {
      const q = queue(); const p = q.filter((x) => x.status === 'pending').length, d = q.filter((x) => x.status === 'done').length, er = q.filter((x) => x.status === 'error').length;
      box.querySelector('#mp-badge').textContent = p ? p + ' in Warteschlange' : '';
      const s = ls.get('stats');
      box.querySelector('#mp-kpi').innerHTML = `Warteschlange: <b>${p}</b> · fertig ${d} · Fehler ${er}<br>Heute genutzt: <b>${usedToday()}</b>/${cfg().dailyProductLimit} Produkte` + (s ? `<br>Royalties gesamt: ${s.totals.royaltyEUR.toFixed(0)} €` : '');
    }
    function status(t) { const el = box.querySelector('#mp-st'); if (el) el.textContent = t; refresh(); }
    return { mount, refresh, status };
  })();

  (function captureApi() {
    const send = XMLHttpRequest.prototype.send, open = XMLHttpRequest.prototype.open;
    const KEEP = /(Publish|Submit|Create|Save|Delete|Update|Upsert|Product|Listing|assetUrlPut)/i, SKIP = /(Get|Find|metrics|translations|ratelimiter|assetUrlGet)/i;
    XMLHttpRequest.prototype.open = function (m, u) { this.__mpU = u; this.__mpM = m; return open.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function (body) {
      const u = String(this.__mpU || '');
      if (u.includes('/api/') && KEEP.test(u) && !SKIP.test(u.split('/').pop())) {
        this.addEventListener('loadend', () => {
          const cap = ls.get('apiCapture', []);
          cap.push({ at: new Date().toISOString(), m: this.__mpM, u: u.split('?')[0], st: this.status, body: typeof body === 'string' ? body.slice(0, 20000) : null, resp: (this.responseText || '').slice(0, 4000) });
          ls.set('apiCapture', cap.slice(-40));
        });
      }
      return send.apply(this, arguments);
    };
  })();

  window.MerchPilot = { version: '0.9.0', imgGet, imgPut, imgKeys, importInput, apiCapture: () => ls.get('apiCapture', []), lint: (it) => window.__MP_LINT(it, cfg().lintExtra || []), stats, monthly, sales, designs, cleanupCandidates, render, enqueue, queue, saveQueue, run, fillAndPublish, setColors, setPrices, config: (c) => (c ? ls.set('cfg', { ...ls.get('cfg', {}), ...c }) : cfg()), usedToday };
  ui.mount();
  importInput();

  // Automatische Freigabe: geprüfte Designs, die länger als autoApproveH in „zur Freigabe“ liegen
  (function autoApprove() {
    const c = cfg(); if (!c.autoApproveH) return;
    const q = queue(); let n = 0;
    for (const x of q) if (x.status === 'review' && Date.now() - new Date(x.added).getTime() > c.autoApproveH * 3600e3 && !(x.lint || []).some((i) => i.lvl === 'error')) { x.status = 'pending'; x.approvedBy = 'auto'; n++; }
    if (n) { saveQueue(q); log(`${n} Designs automatisch freigegeben.`); }
  })();
  // Tagesstart: sobald eine Merch-Seite offen ist und heute noch Kontingent frei ist
  (function autoStart() {
    const c = cfg(); if (!c.autoStart || location.pathname.startsWith('/designs/new')) return;
    const pend = queue().filter((x) => x.status === 'pending').length;
    const lockFresh = Date.now() - (ls.get('runLock', 0) || 0) < 10 * 60e3;
    if (!pend || usedToday() >= c.dailyProductLimit || new Date().getHours() < c.autoStartHour || lockFresh || ls.get('autoSkip') === today()) return;
    if (!/^\/(dashboard|resource\/merchpilot)/.test(location.pathname)) return; // nur von Übersichtsseiten aus, nie mitten in der Arbeit
    ui.status(`Autopilot: ${Math.min(pend, c.dailyProductLimit - usedToday())} Uploads starten in 30 s – „■ Stop“ bricht für heute ab.`);
    const t = setTimeout(() => { ls.set('resume', true); location.href = '/designs/new'; }, 30000);
    window.addEventListener('mp-stop', () => { clearTimeout(t); ls.set('autoSkip', today()); }, { once: true });
  })();

  // Autopilot fortsetzen (nach Seitenwechsel oder täglichem Alarm)
  if (location.pathname.startsWith('/designs/new') && (ls.get('resume') || location.hash === '#mp-auto')) {
    setTimeout(() => run({ max: ls.get('resumeMax', Infinity) ?? Infinity }), 4000);
  }
})();
