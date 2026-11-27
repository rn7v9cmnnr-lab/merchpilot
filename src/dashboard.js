/* MerchPilot-Tab: https://merch.amazon.com/resource/merchpilot
   Drei Ansichten: Cockpit (Workflow + Entscheidungen) · Freigabe (Kacheln) · Analyse (Zahlen, Regeln, Werbung, Strategie).
   Einstellungen über ⚙. Nutzt window.MerchPilot, __MP_RULES, __MP_PLAN. */
(() => {
  const MP = window.MerchPilot;
  if (!MP) return;
  const PATH = '/resource/merchpilot';

  // Menüpunkt in der Merch-Navigation
  const addNav = () => {
    const nav = [...document.querySelectorAll('a[href="/advertise"]')][0];
    if (!nav || document.getElementById('mp-nav')) return;
    const item = nav.closest('li') || nav;
    const c = item.cloneNode(true); const a = c.tagName === 'A' ? c : c.querySelector('a');
    a.id = 'mp-nav'; a.href = PATH; a.textContent = 'MerchPilot'; a.style.fontWeight = '700';
    item.after(c);
  };
  addNav(); setTimeout(addNav, 2500);
  if (location.pathname !== PATH) return;

  // ---------- Grundgerüst ----------
  document.title = 'MerchPilot';
  document.getElementById('mp-box')?.remove();
  const root = document.createElement('div'); root.id = 'mp-app';
  document.body.innerHTML = ''; document.body.appendChild(root); MP.importInput && MP.importInput();
  const css = document.createElement('style');
  css.textContent = `
  :root{--g:#0a7d5a;--gl:#e3f4ec;--o:#d98a00;--ol:#fff1d6;--r:#c0392b;--rl:#fde4e1;--t:#1d2330;--m:#7a8291;--b:#e6e9ef;--bg:#f5f6f8}
  body{margin:0;background:var(--bg);font:13px/1.4 system-ui,-apple-system,sans-serif;color:var(--t)}
  #mp-app{max-width:1200px;margin:0 auto;padding:16px 20px}
  .top{display:flex;align-items:center;gap:10px;margin-bottom:14px}.top h1{font-size:18px;margin:0 8px 0 0;font-weight:800;letter-spacing:-.02em}
  .seg{display:flex;background:#e6e9ef;border-radius:9px;padding:3px}.seg button{border:0;background:none;padding:6px 14px;border-radius:7px;cursor:pointer;font-weight:600;color:#4a5160}
  .seg button.on{background:#fff;color:var(--t);box-shadow:0 1px 2px #0002}.seg .n{display:inline-block;min-width:16px;margin-left:5px;padding:0 5px;border-radius:9px;background:var(--o);color:#fff;font-size:11px}
  .chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:20px;font-weight:600;font-size:12px;background:#fff;border:1px solid var(--b)}
  .dot{width:8px;height:8px;border-radius:50%;background:var(--m)}.dot.g{background:var(--g)}.dot.o{background:var(--o)}.dot.r{background:var(--r)}
  .ic{border:0;background:#fff;border:1px solid var(--b);border-radius:8px;width:32px;height:30px;cursor:pointer;font-size:15px}
  .card{background:#fff;border-radius:12px;padding:14px;box-shadow:0 1px 2px #0001}
  .h{font-size:11px;font-weight:700;color:var(--m);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
  .btn{border:0;background:var(--g);color:#fff;padding:6px 12px;border-radius:8px;cursor:pointer;font-weight:600;font-size:12px}
  .btn.sec{background:#eef0f3;color:var(--t)}.btn.o{background:var(--o)}.btn.red{background:var(--r)}.btn:disabled{opacity:.4;cursor:default}
  .muted{color:var(--m)}
  /* Workflow */
  .flow{display:flex;align-items:stretch;gap:0;margin-bottom:14px}
  .st{flex:1;background:#fff;border-radius:12px;padding:12px 12px 10px;box-shadow:0 1px 2px #0001;cursor:pointer;border-top:4px solid #cfd4dc;min-width:0}
  .st:hover{box-shadow:0 2px 8px #0002}.st.g{border-top-color:var(--g)}.st.o{border-top-color:var(--o);background:linear-gradient(#fffaf0,#fff)}.st.r{border-top-color:var(--r)}
  .st .l{font-size:11px;font-weight:700;color:var(--m);text-transform:uppercase;letter-spacing:.05em}
  .st .k{font-size:28px;font-weight:800;line-height:1.15;margin:2px 0}.st .s{font-size:11.5px;color:var(--m);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .st .tag{font-size:10.5px;font-weight:700;margin-top:6px}.st.g .tag{color:var(--g)}.st.o .tag{color:var(--o)}.st.r .tag{color:var(--r)}
  .arr{flex:none;width:18px;display:flex;align-items:center;justify-content:center;color:#b8bec9;font-size:16px}
  .meter{height:5px;background:#eef0f3;border-radius:4px;overflow:hidden;margin-top:5px}.meter div{height:100%;background:var(--g)}
  .g2{display:grid;grid-template-columns:1.6fr 1fr;gap:14px}
  /* Entscheidungen */
  .dec{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f0f1f4}.dec:last-child{border:0}
  .dec .ico{flex:none;width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;background:var(--ol)}
  .dec.info .ico{background:#eef0f3}.dec.err .ico{background:var(--rl)}
  .dec .tx{flex:1;min-width:0}.dec .tx b{display:block;font-size:13px}.dec .tx span{color:var(--m);font-size:12px}
  .empty{display:flex;align-items:center;gap:10px;padding:16px 4px;color:var(--g);font-weight:600}
  .nrow{display:flex;align-items:center;gap:8px;padding:5px 0;font-size:12.5px}.nrow .nm{flex:1}.nrow .u{font-weight:700;width:28px;text-align:right}
  .spark{display:flex;align-items:flex-end;gap:3px;height:54px;margin:6px 0 2px}.spark div{flex:1;background:#cfe9dd;border-radius:2px 2px 0 0}.spark div.c{background:var(--g)}
  .kp{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}.kp b{display:block;font-size:20px}
  /* Freigabe */
  .bar2{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
  .fc{border:1px solid var(--b);background:#fff;border-radius:16px;padding:4px 10px;cursor:pointer;font-size:12px;font-weight:600;color:#4a5160}.fc.on{background:var(--t);color:#fff;border-color:var(--t)}
  .tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px}
  .ti{position:relative;background:#fff;border-radius:10px;padding:6px;box-shadow:0 1px 2px #0001;cursor:pointer;border:2px solid transparent}
  .ti:hover{border-color:#cfd4dc}.ti.pending{border-color:var(--g)}.ti.parked{opacity:.5}.ti.error,.ti.blocked{border-color:var(--r)}
  .ti canvas{width:100%;aspect-ratio:5/6;border-radius:6px;background:#1f2024;display:block}
  .ti .tt{font-size:11.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:5px}
  .ti .nn{font-size:10.5px;color:var(--m)}
  .ti .qa{position:absolute;top:10px;right:10px;display:flex;gap:4px;opacity:0;transition:.15s}.ti:hover .qa{opacity:1}
  .ti .qa button{border:0;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:13px;box-shadow:0 1px 3px #0004}
  .ti .badge{position:absolute;top:10px;left:10px;font-size:10px;font-weight:700;padding:2px 6px;border-radius:8px;background:#fff}
  .ti .bk{position:absolute;bottom:44px;right:10px;font-size:10px;background:#fff;border-radius:6px;padding:1px 5px}
  .drw{position:fixed;top:0;right:0;width:440px;height:100vh;background:#fff;box-shadow:-4px 0 20px #0002;overflow:auto;padding:16px;box-sizing:border-box;z-index:50}
  .drw .pv{display:flex;gap:8px}.drw canvas{width:100%;border-radius:8px;background:#1f2024}
  .kv{display:grid;grid-template-columns:84px 1fr;gap:4px 8px;margin:12px 0;font-size:12.5px}.kv span{color:var(--m)}
  .sw{display:inline-block;width:14px;height:14px;border-radius:50%;margin-right:3px;border:1px solid #ccc;vertical-align:middle}
  .sw-black{background:#111}.sw-navy{background:#1f2a44}.sw-asphalt{background:#3d4148}.sw-dark_heather{background:#4a4b4f}.sw-royal{background:#2a4fb0}.sw-white{background:#fff}
  .pill{display:inline-block;padding:1px 8px;border-radius:10px;font-size:11px;background:#eef0f3;margin:2px 2px 0 0}.pill.ok{background:var(--gl);color:var(--g)}.pill.err{background:var(--rl);color:var(--r)}.pill.wait{background:var(--ol);color:#8a5a00}
  /* Analyse */
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}.kpis b{display:block;font-size:24px;font-weight:800}
  details.sec{background:#fff;border-radius:12px;box-shadow:0 1px 2px #0001;margin-bottom:10px}
  details.sec>summary{cursor:pointer;padding:12px 14px;font-weight:700;list-style:none;display:flex;align-items:center;gap:8px}
  details.sec>summary::before{content:'›';display:inline-block;transition:.15s;color:var(--m);font-size:16px}details.sec[open]>summary::before{transform:rotate(90deg)}
  details.sec>summary .muted{font-weight:400}details.sec>.in{padding:0 14px 14px}
  table{width:100%;border-collapse:collapse;font-size:12.5px}th,td{padding:5px 7px;border-bottom:1px solid #eef0f3;text-align:left}th{color:var(--m);font-weight:600;font-size:11.5px}td.n,th.n{text-align:right}
  textarea,input[type=text],input[type=number]{box-sizing:border-box;border:1px solid #d5d9e0;border-radius:8px;padding:6px 8px;font:12px ui-monospace,monospace}
  /* Altbestand aus plan.js / rules.js */
  .mp-card{background:#fff;border-radius:12px;padding:14px 16px;box-shadow:0 1px 2px #0001}.mp-l{color:var(--m);font-size:11px;text-transform:uppercase;letter-spacing:.04em;font-weight:700}
  .mp-k{font-size:24px;font-weight:700}.mp-grid2{display:grid;grid-template-columns:2fr 1fr;gap:12px}.mp-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .mp-hero{background:linear-gradient(135deg,#10231c,#1d3b30);color:#eef}.mp-hero .mp-l,.mp-hero .muted{color:#9fc9b6}.mp-list{margin:6px 0 8px;padding-left:18px}
  .mp-bar{height:8px;background:#eef0f3;border-radius:6px;overflow:hidden}.mp-bar div{height:100%;background:var(--g)}
  .mp-step{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #eef0f3}.mp-pill2{flex:0 0 86px;font-size:11px;font-weight:700;color:#2e6bd6;background:#e9f0fd;border-radius:6px;padding:3px 6px;text-align:center}
  .mp-prio{color:#fff;font-weight:800;font-size:12px;border-radius:6px;padding:2px 8px}.mp-camp{border:1px solid #eef0f3;border-radius:10px;padding:10px 12px;margin-top:8px}
  .mp-campgrid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:8px 0;font-size:12.5px}`;
  document.head.appendChild(css);

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const eur = (v, d = 0) => (v ?? 0).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }) + ' €';
  const L = { get: (k, d) => { try { return JSON.parse(localStorage.getItem('mp.' + k)) ?? d; } catch (e) { return d; } }, set: (k, v) => localStorage.setItem('mp.' + k, JSON.stringify(v)) };
  const today = () => new Date().toISOString().slice(0, 10);
  const dmy = (d) => d ? d.slice(8, 10) + '.' + d.slice(5, 7) + '.' : '';
  const cnt = (q, s) => q.filter((x) => x.status === s).length;

  let tab = sessionStorage.getItem('mp.tab2') || 'cockpit';
  let qFilter = 'review', nFilter = 'alle';
  root.innerHTML = `<div class="top"><h1>MerchPilot</h1>
      <div class="seg" id="seg"><button data-t="cockpit">Cockpit</button><button data-t="review">Freigabe<span class="n" id="nrev"></span></button><button data-t="analyse">Analyse</button></div>
      <span style="flex:1"></span><span class="chip" id="ap"></span>
      <button class="ic" id="imp" title="Designs importieren (PNG + JSON)">＋</button><button class="ic" id="gear" title="Einstellungen">⚙</button>
      <a href="/dashboard" class="muted" style="margin-left:4px">Merch ↗</a></div><div id="view"></div>`;
  const view = root.querySelector('#view');
  root.querySelector('#seg').onclick = (e) => { const t = e.target.closest('button')?.dataset.t; if (t) go(t); };
  root.querySelector('#gear').onclick = () => go('settings');
  root.querySelector('#imp').onclick = () => document.getElementById('mp-import')?.click();
  function go(t, f) { tab = t; if (f) qFilter = f; sessionStorage.setItem('mp.tab2', t); show(); }
  function show() {
    root.querySelectorAll('#seg button').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
    const r = cnt(MP.queue(), 'review'); const n = root.querySelector('#nrev'); n.textContent = r || ''; n.style.display = r ? '' : 'none';
    autopilotChip();
    ({ cockpit, review, analyse, settings })[tab]();
  }

  // ---------- Autopilot-Status (immer sichtbar) ----------
  function autopilot() {
    const c = MP.config(), q = MP.queue(), used = MP.usedToday(), pend = cnt(q, 'pending');
    const running = L.get('resume', false) && Date.now() - (L.get('runLock', 0) || 0) < 10 * 60e3;
    if (running) return { c: 'g', t: 'Upload läuft', s: `${used}/${c.dailyProductLimit} heute` };
    if (!c.autoStart) return { c: '', t: 'Autopilot aus', s: 'in ⚙ einschalten' };
    if (L.get('autoSkip') === today()) return { c: 'o', t: 'Pausiert bis morgen', s: '' };
    if (used >= c.dailyProductLimit) return { c: 'g', t: 'Tagesziel erreicht', s: `${used}/${c.dailyProductLimit} · morgen ${c.autoStartHour}:00` };
    if (!pend) return { c: cnt(q, 'review') ? 'o' : 'r', t: cnt(q, 'review') ? 'Wartet auf Freigabe' : 'Puffer leer', s: '' };
    if (new Date().getHours() < c.autoStartHour) return { c: 'g', t: `Start ${c.autoStartHour}:00`, s: `${Math.min(pend, c.dailyProductLimit - used)} Uploads` };
    return { c: 'g', t: 'Startet beim nächsten Seitenaufruf', s: `${pend} bereit` };
  }
  function autopilotChip() { const a = autopilot(); root.querySelector('#ap').innerHTML = `<i class="dot ${a.c}"></i>${esc(a.t)}${a.s ? `<span class="muted" style="font-weight:400">· ${esc(a.s)}</span>` : ''}`; }

  // ---------- Hintergrund-Daten (Cache, nie blockierend) ----------
  const stale = (at, h) => !at || Date.now() - new Date(at).getTime() > h * 3600e3;
  let busy = {};
  async function refresh(kind, fn) {
    if (busy[kind]) return; busy[kind] = true;
    try { await fn(); } catch (e) { console.warn('MerchPilot', kind, e); }
    busy[kind] = false; if (tab === 'cockpit') cockpit();
  }
  const ensureStats = () => { const s = L.get('stats'); if (stale(s?.generated, 6)) refresh('stats', () => MP.stats()); return s; };
  const ensureRules = () => {
    const r = L.get('rulesCache'); if (stale(r?.at, 6) && window.__MP_RULES && MP.queue().some((x) => x.status === 'done'))
      refresh('rules', async () => { const x = await window.__MP_RULES.evaluate(); const ph = {}; x.designs.forEach((d) => (ph[d.plan.phase] = (ph[d.plan.phase] || 0) + 1));
        L.set('rulesCache', { at: x.at, niches: x.niches.map((n) => ({ name: n.name, designs: n.designs, live: n.live, units: n.units, royalty: n.royalty, verdict: n.plan.verdict, next: n.plan.next })), actions: x.actions, phases: ph, live: x.designs.filter((d) => d.state === 'live').length, problems: x.designs.filter((d) => d.state === 'Problem').length }); });
    return r;
  };
  const ensureStrategy = () => { const s = L.get('strategy'); if (!busy.strat && window.__MP_PLAN?.load && !sessionStorage.getItem('mp.stratLoaded')) { sessionStorage.setItem('mp.stratLoaded', 1); refresh('strat', () => window.__MP_PLAN.load()); } return s; };

  // ---------- Cockpit ----------
  function cockpit() {
    const q = MP.queue(), c = MP.config(), s = ensureStats(), r = ensureRules(), st = ensureStrategy();
    const used = MP.usedToday(), rev = cnt(q, 'review'), pend = cnt(q, 'pending'), done = cnt(q, 'done'), err = cnt(q, 'error'), blk = cnt(q, 'blocked');
    const buffer = (rev + pend) / Math.max(1, c.dailyProductLimit);
    const season = (st?.season?.kalender || []).filter((k) => k.upload_bis >= today()).sort((a, b) => a.upload_bis.localeCompare(b.upload_bis));
    const nextS = season.find((k) => !/Batch/.test(k.status)) || season[0];
    const m = s?.monthly || []; const cur = m.at(-1), prev = m.at(-2);
    const ads = st?.ads?.live; const liveAds = (st?.ads?.campaigns || []).filter((x) => x.status === 'live');
    const asA = L.get('asins', null); const asins = Array.isArray(asA) ? asA.length : asA && typeof asA === 'object' ? Object.keys(asA.map || asA).length : 0;
    const ap = autopilot();

    const steps = [
      { k: 'Planen', v: (st?.niches || []).filter((n) => n.prio !== 'C').length || '–', s: nextS ? `nächster Anlass: ${nextS.anlass.split(' (')[0]} · bis ${dmy(nextS.upload_bis)}` : 'Nischen aktiv', c: 'g', tag: 'Nischen aktiv', to: () => go('analyse') },
      { k: 'Designs', v: rev + pend, s: `Puffer ${buffer.toFixed(1).replace('.', ',')} Tage`, c: buffer < 1 ? 'r' : buffer < 2 ? 'o' : 'g', tag: buffer < 1 ? 'Nachschub nötig' : 'im Puffer', to: () => go('review', 'all') },
      { k: 'Freigabe', v: rev, s: c.autoApproveH ? `sonst automatisch nach ${c.autoApproveH} h` : 'nur manuell', c: rev ? 'o' : 'g', tag: rev ? 'Deine Prüfung' : 'nichts offen', to: () => go('review', 'review') },
      { k: 'Upload', v: `${used}/${c.dailyProductLimit}`, s: `${pend} freigegeben`, c: err ? 'r' : ap.c || 'g', tag: ap.t, meter: used / c.dailyProductLimit, to: () => go('review', 'pending') },
      { k: 'Live', v: r?.live ?? done, s: `${done} hochgeladen${r?.problems ? ` · ${r.problems} Problem` : ''}${asins ? ` · ${asins} ASINs` : ''}`, c: r?.problems ? 'r' : 'g', tag: r ? `${r.phases?.Indexierung || 0} indexieren · ${r.phases?.Test || 0} im Test` : 'Status lädt', to: () => go('review', 'done') },
      { k: 'Auswerten', v: cur ? eur(cur.royaltyEUR) : '–', s: `Tantieme ${cur ? cur.month : ''}${prev ? ` · Vormonat ${eur(prev.royaltyEUR)}` : ''}`, c: 'g', tag: liveAds.length ? `${liveAds.length} Kampagnen · ${ads?.dailyBudget || ''} €/Tag` : 'Werbung aus', to: () => go('analyse') },
    ];
    // Entscheidungen: nur was David tun/entscheiden muss; Infos grau
    const decided = L.get('decided', {});
    const D = [];
    if (rev) D.push({ i: '👀', t: `${rev} Designs warten auf Freigabe`, s: c.autoApproveH ? `Ohne Einwand gehen sie nach ${c.autoApproveH} h automatisch raus.` : 'Werden erst nach Freigabe hochgeladen.', b: [['Ansehen', () => go('review', 'review'), 'sec'], ['Alle freigeben', () => { MP.saveQueue(MP.queue().map((x) => (x.status === 'review' && !(x.lint || []).some((i) => i.lvl === 'error') ? { ...x, status: 'pending', approvedBy: 'David' } : x))); show(); }]] });
    if (err) D.push({ cl: 'err', i: '⚠️', t: `${err} Uploads fehlgeschlagen`, s: 'Meist Formular-Timeout – erneut versuchen ist sicher.', b: [['Ansehen', () => go('review', 'error'), 'sec'], ['Erneut', () => { MP.saveQueue(MP.queue().map((x) => (x.status === 'error' ? { ...x, status: 'pending', error: null } : x))); show(); }]] });
    if (blk) D.push({ cl: 'err', i: '⛔', t: `${blk} Designs gesperrt (Marke/Regel)`, s: 'Werden nie automatisch hochgeladen.', b: [['Ansehen', () => go('review', 'blocked'), 'sec']] });
    (r?.actions || []).filter((a) => !decided['a:' + a.id + a.what]).slice(0, 6).forEach((a) => D.push({ i: '🎯', t: a.what, s: a.title, b: [['Ja', () => { decided['a:' + a.id + a.what] = 'ja ' + today(); L.set('decided', decided); cockpit(); }], ['Nein', () => { decided['a:' + a.id + a.what] = 'nein ' + today(); L.set('decided', decided); cockpit(); }, 'sec']] }));
    if (pend && !L.get('resume', false) && new Date().getHours() >= c.autoStartHour && used < c.dailyProductLimit && L.get('autoSkip') !== today()) D.push({ cl: 'info', i: '▶', t: `${Math.min(pend, c.dailyProductLimit - used)} Uploads bereit`, s: 'Der Autopilot startet beim nächsten Aufruf der Merch-Übersicht – oder jetzt.', b: [['Jetzt starten', () => MP.run()]] });
    if (nextS && nextS.upload_bis <= new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10)) D.push({ cl: 'info', i: '📅', t: `${nextS.anlass}: Upload bis ${dmy(nextS.upload_bis)}`, s: nextS.status, b: [] });
    if (buffer < 1) D.push({ cl: 'info', i: '🧩', t: 'Puffer reicht nicht für morgen', s: 'Nächste Batch wird vorbereitet.', b: [] });

    const max = Math.max(1, ...m.slice(-12).map((x) => x.units));
    view.innerHTML = `
      <div class="flow">${steps.map((x, i) => `${i ? '<div class="arr">›</div>' : ''}<div class="st ${x.c}" data-i="${i}"><div class="l">${x.k}</div><div class="k">${x.v}</div>
        ${x.meter != null ? `<div class="meter"><div style="width:${Math.min(100, x.meter * 100)}%"></div></div>` : ''}<div class="s" title="${esc(x.s)}">${esc(x.s)}</div><div class="tag">${esc(x.tag)}</div></div>`).join('')}</div>
      <div class="g2">
        <div class="card"><div class="h">Deine Entscheidungen ${D.filter((d) => d.cl !== 'info').length ? `<span class="pill wait">${D.filter((d) => d.cl !== 'info').length}</span>` : ''}</div>
          ${D.length ? D.map((d, i) => `<div class="dec ${d.cl || ''}"><div class="ico">${d.i}</div><div class="tx"><b>${esc(d.t)}</b><span>${esc(d.s || '')}</span></div>${d.b.map((b, k) => `<button class="btn ${b[2] || ''}" data-d="${i}-${k}">${b[0]}</button>`).join('')}</div>`).join('')
            : '<div class="empty">✓ Nichts zu entscheiden – der Autopilot arbeitet.</div>'}</div>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="card"><div class="h">Verkäufe · 12 Monate</div>
            <div class="kp"><div><b>${m.slice(-12).reduce((a, x) => a + x.units, 0) || '–'}</b><span class="muted">Stück</span></div><div><b>${s ? eur(m.slice(-12).reduce((a, x) => a + x.royaltyEUR, 0)) : '–'}</b><span class="muted">Tantieme</span></div></div>
            <div class="spark">${m.slice(-12).map((x, i, a) => `<div class="${i === a.length - 1 ? 'c' : ''}" style="height:${Math.max(3, (x.units / max) * 100)}%" title="${x.month}: ${x.units} Stk · ${eur(x.royaltyEUR)}"></div>`).join('') || '<span class="muted">lädt …</span>'}</div></div>
          <div class="card"><div class="h">Nischen-Ampel</div>
            ${(r?.niches || []).length ? r.niches.sort((a, b) => b.units - a.units).map((n) => `<div class="nrow"><i class="dot ${/Kurs|Ausbau|Kern/.test(n.verdict) ? 'g' : /Halten|startet|wartet/.test(n.verdict) ? 'o' : 'r'}"></i><span class="nm">${esc(n.name)}</span><span class="muted">${n.live}/${n.designs} live</span><span class="u">${n.units}</span></div>`).join('') + '<div class="muted" style="font-size:11px;margin-top:4px">Zahl = Verkäufe seit Upload · Gate 1 am 4.1.</div>'
              : '<div class="muted">Wird nach dem ersten Upload ausgewertet …</div>'}</div>
        </div></div>`;
    view.querySelectorAll('.st').forEach((el) => (el.onclick = () => steps[+el.dataset.i].to()));
    view.querySelectorAll('[data-d]').forEach((el) => { const [i, k] = el.dataset.d.split('-').map(Number); el.onclick = () => D[i].b[k][1](); });
  }

  // ---------- Freigabe (Kacheln + Detail-Leiste) ----------
  const LBL = { review: 'Zur Freigabe', pending: 'Freigegeben', done: 'Hochgeladen', error: 'Fehler', blocked: 'Gesperrt', parked: 'Geparkt', all: 'Alle' };
  const thumbCache = new Map();
  async function paint(c, it, back) {
    const key = (back ? 'b:' : 'f:') + it.id;
    try {
      let bmp = thumbCache.get(key);
      if (!bmp) {
        const blob = back ? await MP.imgGet(it.backImageKey) : it.imageKey ? await MP.imgGet(it.imageKey) : it.imageDataUrl ? await (await fetch(it.imageDataUrl)).blob() : it.spec ? await MP.render(it.spec) : null;
        if (!blob) return; bmp = await createImageBitmap(blob, { resizeWidth: 250, resizeHeight: 300, resizeQuality: 'high' }); thumbCache.set(key, bmp);
      }
      const g = c.getContext('2d'); g.fillStyle = '#1f2024'; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height);
    } catch (e) { /* Vorschau optional */ }
  }
  function setStatus(ids, st) { const s = new Set(ids); MP.saveQueue(MP.queue().map((x) => (s.has(x.id) ? { ...x, status: st, ...(st === 'pending' ? { approvedBy: 'David' } : {}) } : x))); }
  function review() {
    const all = MP.queue();
    const base = all.filter((x) => (qFilter === 'all' ? true : x.status === qFilter));
    const niches = ['alle', ...new Set(base.map((x) => x.niche || '–'))];
    if (!niches.includes(nFilter)) nFilter = 'alle';
    const q = base.filter((x) => nFilter === 'alle' || (x.niche || '–') === nFilter).slice().reverse();
    view.innerHTML = `<div class="card" style="margin-bottom:12px">
        <div class="bar2">${Object.keys(LBL).filter((k) => k === 'all' || k === qFilter || cnt(all, k)).map((k) => `<button class="fc ${qFilter === k ? 'on' : ''}" data-f="${k}">${LBL[k]} ${k === 'all' ? all.length : cnt(all, k)}</button>`).join('')}
          <span style="flex:1"></span>${qFilter === 'review' && q.length ? `<button class="btn" id="okall">✓ ${q.length} freigeben</button>` : ''}${qFilter === 'error' && q.length ? `<button class="btn o" id="retry">Erneut versuchen</button>` : ''}</div>
        ${niches.length > 2 ? `<div class="bar2" style="margin:0">${niches.map((n) => `<button class="fc ${nFilter === n ? 'on' : ''}" data-n="${esc(n)}">${esc(n)}${n === 'alle' ? '' : ' ' + base.filter((x) => (x.niche || '–') === n).length}</button>`).join('')}</div>` : ''}
        <div class="muted" style="margin-top:6px;font-size:11.5px">Kachel anklicken = Details · ✓ freigeben · ⏸ parken${qFilter === 'review' && MP.config().autoApproveH ? ` · nicht Geparktes geht nach ${MP.config().autoApproveH} h automatisch raus` : ''}</div></div>
      <div class="tiles">${q.map((x) => `<div class="ti ${x.status}" data-id="${esc(x.id)}"><canvas width="250" height="300"></canvas>
          ${x.status !== qFilter || qFilter === 'all' ? `<span class="badge">${LBL[x.status] || x.status}</span>` : ''}${(x.lint || []).some((i) => i.lvl === 'error') ? '<span class="badge" style="background:#fde4e1;color:#c0392b">Regel</span>' : ''}
          ${x.backImageKey ? '<span class="bk">+ Rücken</span>' : ''}
          <div class="qa">${x.status !== 'pending' && x.status !== 'done' ? `<button data-ok="${esc(x.id)}" style="background:#0a7d5a;color:#fff" title="Freigeben">✓</button>` : ''}${x.status === 'review' || x.status === 'pending' ? `<button data-pk="${esc(x.id)}" style="background:#fff" title="Parken">⏸</button>` : ''}</div>
          <div class="tt" title="${esc(x.title)}">${esc(x.title)}</div><div class="nn">${esc(x.niche || '')}${x.prices?.DE ? ` · ${String(x.prices.DE).replace('.', ',')} €` : ''}</div></div>`).join('') || '<div class="muted">Nichts in dieser Ansicht.</div>'}</div>`;
    view.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { qFilter = b.dataset.f; nFilter = 'alle'; review(); }));
    view.querySelectorAll('[data-n]').forEach((b) => (b.onclick = () => { nFilter = b.dataset.n; review(); }));
    view.querySelector('#okall') && (view.querySelector('#okall').onclick = () => { setStatus(q.filter((x) => !(x.lint || []).some((i) => i.lvl === 'error')).map((x) => x.id), 'pending'); show(); });
    view.querySelector('#retry') && (view.querySelector('#retry').onclick = () => { MP.saveQueue(MP.queue().map((x) => (x.status === 'error' ? { ...x, status: 'pending', error: null } : x))); show(); });
    view.querySelectorAll('.ti').forEach((el) => {
      const it = q.find((x) => x.id === el.dataset.id); paint(el.querySelector('canvas'), it);
      el.onclick = (e) => {
        const ok = e.target.dataset.ok, pk = e.target.dataset.pk;
        if (ok) { setStatus([ok], 'pending'); return show(); }
        if (pk) { setStatus([pk], 'parked'); return show(); }
        drawer(it);
      };
    });
  }
  function drawer(x) {
    document.querySelector('.drw')?.remove();
    const b = x.brief || {}; const d = document.createElement('div'); d.className = 'drw';
    const pr = x.prices ? Object.entries(x.prices).map(([m, v]) => `${m} ${String(v).replace('.', ',')} €`).join(' · ') : '';
    const row = (k, v) => (v ? `<span>${k}</span><div>${v}</div>` : '');
    d.innerHTML = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><b style="flex:1">${esc(x.niche || '')} · ${esc(x.id)}</b><span class="pill ${x.status === 'done' ? 'ok' : x.status === 'error' || x.status === 'blocked' ? 'err' : 'wait'}">${LBL[x.status] || x.status}</span><button class="ic" id="cl">✕</button></div>
      <div class="pv"><canvas width="250" height="300"></canvas>${x.backImageKey ? '<canvas width="250" height="300"></canvas>' : ''}</div>
      <div style="font-weight:700;font-size:14px;margin-top:10px">${esc(x.title)}</div><div class="muted">${esc(x.brand)}</div>
      <div class="kv">${row('Ziel', esc(b.ziel))}${row('Zielgruppe', esc(b.zielgruppe))}${row('Anlass', esc(b.anlass))}${row('Preis', esc(b.preis || pr))}${row('Werbung', esc(b.werbung))}
        ${row('Farben', (x.colors || []).map((c) => `<i class="sw sw-${c}" title="${c}"></i>`).join(''))}${row('Marke', esc(b.markencheck))}${row('ASIN', esc(x.asin))}</div>
      ${x.error ? `<div class="pill err">${esc(x.error)}</div>` : ''}${(x.lint || []).map((i) => `<div class="pill ${i.lvl === 'error' ? 'err' : 'wait'}">${esc(i.field)}: ${esc(i.word || '')} – ${esc(i.why)}</div>`).join('')}
      <details style="margin-top:8px"><summary class="muted">Listing-Text</summary><div style="font-size:12px;margin-top:6px">• ${esc(x.bullet1 || '')}<br>• ${esc(x.bullet2 || '')}<p>${esc(x.description || '')}</p></div></details>
      <div style="display:flex;gap:8px;margin-top:14px">${x.status !== 'pending' && x.status !== 'done' ? '<button class="btn" data-s="pending">✓ Freigeben</button>' : ''}${x.status === 'review' || x.status === 'pending' ? '<button class="btn sec" data-s="parked">⏸ Parken</button>' : ''}${x.status === 'parked' || x.status === 'pending' ? '<button class="btn sec" data-s="review">↩ Zur Freigabe</button>' : ''}</div>`;
    document.body.appendChild(d);
    const cv = d.querySelectorAll('canvas'); paint(cv[0], x); if (cv[1]) paint(cv[1], x, true);
    d.querySelector('#cl').onclick = () => d.remove();
    d.querySelectorAll('[data-s]').forEach((bt) => (bt.onclick = () => { setStatus([x.id], bt.dataset.s); d.remove(); show(); }));
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelector('.drw')?.remove(); });

  // ---------- Analyse ----------
  function analyse() {
    const s = ensureStats(), st = L.get('strategy'), m = s?.monthly || [];
    const y = m.slice(-12), sum = (a, k) => a.reduce((x, z) => x + z[k], 0), max = Math.max(1, ...m.map((x) => x.units));
    const ads = st?.ads?.live;
    const bars = m.map((x, i) => { const h = Math.round((x.units / max) * 110); return `<rect fill="${i === m.length - 1 ? '#0a7d5a' : '#9fd3bd'}" x="${i * 30 + 4}" y="${120 - h}" width="22" height="${h}" rx="2"><title>${x.month}: ${x.units} Stk · ${eur(x.royaltyEUR)}</title></rect>${i % 3 === 0 ? `<text x="${i * 30 + 15}" y="134" font-size="9" text-anchor="middle" fill="#889">${x.month.slice(2)}</text>` : ''}`; }).join('');
    const SEC = [
      ['rules', 'Nischen & Regeln', 'Phase je Design, Ampel je Nische, Gates', (el) => window.__MP_RULES?.view(el)],
      ['ads', 'Werbung & Preise', ads ? `${(st.ads.campaigns || []).filter((c) => c.status === 'live').length} Kampagnen live · ${ads.dailyBudget} €/Tag` : '', (el) => window.__MP_PLAN?.pricing(el)],
      ['strat', 'Strategie & Saison', 'Fokus, Fahrplan, Nischen-Matrix, Saisonkalender', (el) => window.__MP_PLAN?.strategy(el)],
      ['top', 'Top-Designs & Märkte', 'Alle Zeiten', (el) => { if (!s) return (el.innerHTML = '<div class="muted">lädt …</div>'); el.innerHTML = `<div class="mp-grid2"><table><tr><th>Design</th><th class="n">Stück</th><th class="n">Tantieme</th></tr>${s.topDesigns.slice(0, 15).map((x) => `<tr><td>${esc(x.key)}</td><td class="n">${x.units}</td><td class="n">${eur(x.royaltyEUR)}</td></tr>`).join('')}</table><table><tr><th>Markt</th><th class="n">Stück</th><th class="n">Tantieme</th></tr>${s.byMarket.map((x) => `<tr><td>${x.key}</td><td class="n">${x.units}</td><td class="n">${eur(x.royaltyEUR)}</td></tr>`).join('')}</table></div>`; }],
      ['clean', 'Bereinigung', 'Alte Designs ohne Verkauf', (el) => cleanup(el)],
    ];
    view.innerHTML = `<div class="kpis">
        <div class="card"><div class="h">Verkäufe 12 M</div><b>${s ? sum(y, 'units') : '–'}</b><span class="muted">Vorjahr ${s ? sum(m.slice(-24, -12), 'units') : '–'}</span></div>
        <div class="card"><div class="h">Tantieme 12 M</div><b>${s ? eur(sum(y, 'royaltyEUR')) : '–'}</b><span class="muted">gesamt ${s ? eur(s.totals.royaltyEUR) : '–'}</span></div>
        <div class="card"><div class="h">Tantieme ${m.at(-1)?.month || ''}</div><b>${m.at(-1) ? eur(m.at(-1).royaltyEUR, 2) : '–'}</b><span class="muted">${m.at(-1)?.units ?? 0} Verkäufe</span></div>
        <div class="card"><div class="h">Werbebudget</div><b>${ads ? ads.dailyBudget + ' €/Tag' : '–'}</b><span class="muted">Auswertung Mo + Do</span></div></div>
      <div class="card" style="margin-bottom:12px"><div style="display:flex"><div class="h" style="flex:1">Verkäufe pro Monat (24 M)</div><button class="btn sec" id="rf">↻</button></div><svg viewBox="0 0 ${m.length * 30 + 8} 140" width="100%" style="max-height:170px">${bars}</svg></div>
      ${SEC.map(([k, t, sub]) => `<details class="sec" data-k="${k}"><summary>${t}<span class="muted">· ${esc(sub)}</span></summary><div class="in"></div></details>`).join('')}`;
    view.querySelector('#rf').onclick = () => { view.querySelector('#rf').disabled = true; MP.stats().then(analyse); };
    const open = new Set(JSON.parse(sessionStorage.getItem('mp.open') || '[]'));
    view.querySelectorAll('details.sec').forEach((d) => {
      const sec = SEC.find((x) => x[0] === d.dataset.k); let done = false;
      const load = () => { if (d.open && !done) { done = true; sec[3](d.querySelector('.in')); } };
      d.ontoggle = () => { d.open ? open.add(d.dataset.k) : open.delete(d.dataset.k); sessionStorage.setItem('mp.open', JSON.stringify([...open])); load(); };
      if (open.has(d.dataset.k)) d.open = true;
    });
  }

  async function cleanup(el) {
    el.innerHTML = '<div class="muted">Lade Designs und Verkäufe …</div>';
    const [ds, s12, sAll] = [await MP.designs(), await MP.sales(Date.now() - 365 * 864e5), await MP.sales(Date.now() - 7 * 365 * 864e5)];
    const n = (s) => (s || '').toLowerCase().replace(/[^a-z0-9äöüß ]/g, ' ').replace(/\s+/g, ' ').trim();
    const count = (rows, t) => { const k = n(t).slice(0, 22); return rows.filter((r) => n(r.name).includes(k)).reduce((a, r) => a + r.units, 0); };
    const live = ds.filter((d) => d.status.some((x) => x === 'PUBLISHED' || x === 'PROPAGATED'));
    const rows = live.map((d) => ({ ...d, u12: count(s12, d.title), uAll: count(sAll, d.title), age: Math.round((Date.now() - new Date(d.created)) / 864e5) })).sort((a, b) => a.u12 - b.u12 || b.age - a.age);
    const cand = rows.filter((r) => r.u12 === 0 && r.age > 365);
    el.innerHTML = `<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px"><b>${live.length} live</b><span class="muted">· ${cand.length} ohne Verkauf in 12 M (älter 1 J.) · ${cand.filter((r) => r.uAll === 0).length} nie verkauft</span><span style="flex:1"></span><button class="btn sec" id="selc">Kandidaten markieren</button></div>
      <table><tr><th></th><th>Design</th><th>Erstellt</th><th class="n">12 M</th><th class="n">gesamt</th></tr>${rows.map((r) => `<tr><td><input type="checkbox" data-id="${r.id}"></td><td>${esc(r.title)} <span class="muted">${esc(r.brand)}</span></td><td>${r.created}</td><td class="n">${r.u12}</td><td class="n">${r.uAll}</td></tr>`).join('')}</table>`;
    el.querySelector('#selc').onclick = () => { const ids = new Set(cand.map((c) => c.id)); el.querySelectorAll('input[data-id]').forEach((c) => (c.checked = ids.has(c.dataset.id))); };
    window.__mpSelected = () => [...el.querySelectorAll('input[data-id]:checked')].map((c) => c.dataset.id);
  }

  // ---------- Einstellungen (⚙) ----------
  function settings() {
    const c = MP.config();
    view.innerHTML = `<div class="card" style="max-width:620px"><div class="h">Autopilot</div>
      <label style="display:block;margin:6px 0"><input type="checkbox" id="as" ${c.autoStart ? 'checked' : ''}> Täglich ab <input type="number" id="ah" value="${c.autoStartHour}" style="width:54px"> Uhr bis <input type="number" id="lim" value="${c.dailyProductLimit}" style="width:60px"> Uploads</label>
      <label style="display:block;margin:6px 0">Automatisch freigeben nach <input type="number" id="aa" value="${c.autoApproveH}" style="width:54px"> h <span class="muted">(0 = nur manuell; gesperrte nie)</span></label>
      <label style="display:block;margin:6px 0">Pause zwischen Uploads <input type="number" id="d0" value="${c.delaySec[0]}" style="width:54px"> – <input type="number" id="d1" value="${c.delaySec[1]}" style="width:54px"> s</label>
      <label style="display:block;margin:6px 0"><input type="checkbox" id="tr" ${c.translate ? 'checked' : ''}> Amazon übersetzt Listings automatisch</label>
      <details style="margin-top:10px"><summary class="muted">Produkte × Märkte (JSON)</summary><textarea id="prod" rows="5" style="width:100%;margin-top:6px">${esc(JSON.stringify(c.products, null, 1))}</textarea></details>
      <button class="btn" id="save" style="margin-top:12px">Speichern</button> <span class="muted" style="font-size:11.5px">Chrome und Rechner müssen laufen.</span></div>`;
    view.querySelector('#save').onclick = () => {
      try {
        const v = (id) => view.querySelector('#' + id);
        MP.config({ products: JSON.parse(v('prod').value), dailyProductLimit: +v('lim').value, delaySec: [+v('d0').value, +v('d1').value], translate: v('tr').checked, autoStart: v('as').checked, autoStartHour: +v('ah').value, autoApproveH: +v('aa').value });
        v('save').textContent = 'Gespeichert ✓'; autopilotChip();
      } catch (e) { alert('Produkte-JSON fehlerhaft'); }
    };
  }

  window.addEventListener('storage', (e) => { if (e.key === 'mp.queue' && tab !== 'settings') show(); });
  show();
})();
