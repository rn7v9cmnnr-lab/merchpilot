/* MerchPilot-Plan: Tabs „Strategie“ und „Preise & Werbung“. Inhalte kommen aus strategy.json im GitHub-Repo. */
(() => {
  const URL = 'https://raw.githubusercontent.com/rn7v9cmnnr-lab/merchpilot/main/strategy.json';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  async function load() {
    try { const r = await fetch(URL + '?t=' + Date.now()); const j = await r.json(); localStorage.setItem('mp.strategy', JSON.stringify(j)); return j; }
    catch (e) { return JSON.parse(localStorage.getItem('mp.strategy') || 'null'); }
  }
  const PRIO = { A: '#0a7d5a', B: '#2e6bd6', C: '#9aa3b2' };
  const day = (d) => new Date(d + 'T12:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' });

  // 2x2: Nachfrage (y) gegen Wettbewerb (x)
  function matrix(niches) {
    const W = 560, H = 360, L = 50, T = 20, R = 20, B = 44, iw = W - L - R, ih = H - T - B;
    const x = (v) => L + (v / 10) * iw, y = (v) => T + ih - (v / 10) * ih;
    const dots = niches.map((n) => {
      const r = 8 + (n.designs || 0) * 1.1;
      return `<g><circle cx="${x(n.competition)}" cy="${y(n.demand)}" r="${r}" fill="${PRIO[n.prio]}" fill-opacity="${n.prio === 'C' ? 0.25 : 0.85}"><title>${esc(n.name)}: Nachfrage ${n.demand}/10, Wettbewerb ${n.competition}/10, ${n.designs} Designs</title></circle>
        <text x="${x(n.competition) + r + 6}" y="${y(n.demand) + 4}" font-size="12" fill="#1d2330" font-weight="${n.prio === 'C' ? 400 : 600}">${esc(n.name)}</text></g>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Nischen nach Nachfrage und Wettbewerb">
      <rect x="${L}" y="${T}" width="${iw / 2}" height="${ih / 2}" fill="#0a7d5a" fill-opacity=".07"/>
      <text x="${L + 8}" y="${T + 16}" font-size="11" fill="#0a7d5a" font-weight="600">BESPIELEN: hohe Nachfrage, wenig Wettbewerb</text>
      <text x="${L + iw - 8}" y="${T + 16}" font-size="11" fill="#667" text-anchor="end">nur mit spitzen Sprüchen</text>
      <text x="${L + iw - 8}" y="${T + ih - 8}" font-size="11" fill="#667" text-anchor="end">meiden</text>
      <text x="${L + 8}" y="${T + ih - 8}" font-size="11" fill="#667">klein, aber frei</text>
      <line x1="${L}" y1="${T + ih / 2}" x2="${L + iw}" y2="${T + ih / 2}" stroke="#d5d9e0" stroke-dasharray="4 4"/>
      <line x1="${L + iw / 2}" y1="${T}" x2="${L + iw / 2}" y2="${T + ih}" stroke="#d5d9e0" stroke-dasharray="4 4"/>
      <line x1="${L}" y1="${T + ih}" x2="${L + iw}" y2="${T + ih}" stroke="#9aa3b2"/><line x1="${L}" y1="${T}" x2="${L}" y2="${T + ih}" stroke="#9aa3b2"/>
      <text x="${L + iw / 2}" y="${H - 10}" font-size="12" fill="#667" text-anchor="middle">Wettbewerb auf Amazon.de →</text>
      <text transform="translate(16 ${T + ih / 2}) rotate(-90)" font-size="12" fill="#667" text-anchor="middle">Nachfrage (Bestseller-Rang) →</text>
      ${dots}</svg>`;
  }

  // Zeitplan mit Heute-Linie und Gates
  function timeline(s) {
    const W = 1100, L = 20, R = 20, iw = W - L - R, ph = s.roadmap;
    const t0 = Date.parse(ph[0].from), t1 = Date.parse(ph.at(-1).to) + 864e5, X = (d) => L + ((Date.parse(d) - t0) / (t1 - t0)) * iw;
    const now = Date.now(), nowX = L + ((now - t0) / (t1 - t0)) * iw;
    const bands = ph.map((p, i) => { const x0 = X(p.from), x1 = X(p.to) + (iw / ((t1 - t0) / 864e5)); return `<g>
      <rect x="${x0 + 2}" y="30" width="${x1 - x0 - 4}" height="92" rx="8" fill="#fff" stroke="#d5d9e0"/>
      <text x="${x0 + 12}" y="52" font-size="13" font-weight="600" fill="#1d2330">${esc(p.name)}</text>
      <text x="${x0 + 12}" y="68" font-size="11" fill="#667">${day(p.from)} – ${day(p.to)}</text>
      ${p.items.map((it, k) => `<text x="${x0 + 12}" y="${90 + k * 16}" font-size="11.5" fill="#1d2330">${esc(it)}</text>`).join('')}</g>`; }).join('');
    const gates = s.gates.map((g) => `<g><path d="M${X(g.date)} 128l8 8l-8 8l-8 -8z" fill="#2e6bd6"/><text x="${X(g.date)}" y="160" font-size="11" text-anchor="middle" fill="#1d2330" font-weight="600">${day(g.date)}</text><text x="${X(g.date)}" y="174" font-size="11" text-anchor="middle" fill="#667">${esc(g.rule)}</text></g>`).join('');
    const today = now >= t0 && now <= t1 ? `<line x1="${nowX}" y1="22" x2="${nowX}" y2="150" stroke="#e94b3c" stroke-width="2"/><text x="${nowX}" y="16" font-size="11" fill="#e94b3c" text-anchor="middle" font-weight="600">heute</text>` : `<text x="${L}" y="16" font-size="11" fill="#e94b3c">Start am ${day(ph[0].from)}</text>`;
    return `<svg viewBox="0 0 ${W} 184" width="100%" role="img" aria-label="Fahrplan 8 Wochen">${bands}${gates}${today}</svg>`;
  }

  // Royalty-Kurve DE
  function curve(p) {
    const W = 520, H = 240, L = 46, R = 16, T = 16, B = 36, iw = W - L - R, ih = H - T - B;
    const xs = p.points.map((q) => q[0]), ys = p.points.map((q) => q[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y1 = Math.ceil(Math.max(...ys) + 1);
    const X = (v) => L + ((v - x0) / (x1 - x0)) * iw, Y = (v) => T + ih - (v / y1) * ih;
    const path = p.points.map((q, i) => `${i ? 'L' : 'M'}${X(q[0])} ${Y(q[1])}`).join('');
    const ry = (v) => { for (let i = 1; i < p.points.length; i++) { const [a, b] = [p.points[i - 1], p.points[i]]; if (v <= b[0]) return a[1] + ((v - a[0]) / (b[0] - a[0])) * (b[1] - a[1]); } return p.points.at(-1)[1]; };
    const mark = (v, lab, c) => `<g><line x1="${X(v)}" y1="${T}" x2="${X(v)}" y2="${T + ih}" stroke="${c}" stroke-dasharray="3 3"/><circle cx="${X(v)}" cy="${Y(ry(v))}" r="5" fill="${c}"/><text x="${X(v) + 6}" y="${Y(ry(v)) - 8}" font-size="11.5" fill="${c}" font-weight="600">${lab}: ${ry(v).toFixed(2).replace('.', ',')} ${p.cur}</text></g>`;
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Royalty je Verkaufspreis T-Shirt ${p.mkt}">
      ${[0, 2, 4, 6].filter((v) => v <= y1).map((v) => `<line x1="${L}" x2="${L + iw}" y1="${Y(v)}" y2="${Y(v)}" stroke="#eef0f3"/><text x="${L - 8}" y="${Y(v) + 4}" font-size="11" fill="#667" text-anchor="end">${v} ${p.cur}</text>`).join('')}
      ${p.points.map((q) => `<text x="${X(q[0])}" y="${H - 14}" font-size="11" fill="#667" text-anchor="middle">${String(q[0]).replace('.', ',')}</text>`).join('')}
      <path d="${path}" fill="none" stroke="#9aa3b2" stroke-width="2"/>
      ${p.points.map((q) => `<circle cx="${X(q[0])}" cy="${Y(q[1])}" r="3" fill="#9aa3b2"><title>${q[0]} ${p.cur} → ${q[1]} ${p.cur} Royalty</title></circle>`).join('')}
      ${mark(p.rec, 'Start', '#0a7d5a')}${mark(21.99, 'Preistest', '#2e6bd6')}
      <text x="${L + iw / 2}" y="${H - 1}" font-size="11" fill="#667" text-anchor="middle">Verkaufspreis T-Shirt Amazon.${p.mkt.toLowerCase()} (${p.cur}, inkl. MwSt.)</text></svg>`;
  }

  async function strategy(view) {
    view.innerHTML = '<div class="mp-card">Lade Plan …</div>';
    const s = await load(); if (!s) { view.innerHTML = '<div class="mp-card">Plan nicht erreichbar.</div>'; return; }
    const stats = JSON.parse(localStorage.getItem('mp.stats') || 'null');
    const done = JSON.parse(localStorage.getItem('mp.queue') || '[]').filter((x) => x.status === 'done').length;
    const act = s.niches.filter((n) => n.prio !== 'C');
    view.innerHTML = `
      <div class="mp-grid2" style="grid-template-columns:1.3fr 1fr;margin-bottom:12px">
        <div class="mp-card mp-hero"><div class="mp-l">Fokus</div>
          <div class="mp-k" style="font-size:22px;margin:4px 0">${esc(s.focus.product)} · nur ${esc(s.focus.market)}</div>
          <ul class="mp-list">${s.focus.why.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
          <div class="muted">${esc(s.focus.tradeoff)}</div></div>
        <div class="mp-card"><div class="mp-l">Ziel bis ${day(s.goal.deadline)}</div>
          <div class="mp-k" style="font-size:22px;margin:4px 0">${s.goal.sales} Verkäufe</div>
          <div class="mp-bar"><div style="width:0%"></div></div>
          <div class="muted" style="margin-top:6px">${esc(s.goal.text)}</div>
          <div style="margin-top:10px;display:flex;gap:18px"><div><div class="mp-l">Designs live</div><b>${done}</b></div><div><div class="mp-l">Nischen aktiv</div><b>${act.length}</b></div><div><div class="mp-l">Designs geplant</div><b>${act.reduce((a, n) => a + (n.designs || 0), 0)}</b></div></div></div>
      </div>
      <div class="mp-card" style="margin-bottom:12px"><div class="mp-l">Fahrplan</div>${timeline(s)}</div>
      <div class="mp-grid2" style="grid-template-columns:1.2fr 1fr;margin-bottom:12px">
        <div class="mp-card"><div class="mp-l">Nischen: Nachfrage gegen Wettbewerb (Amazon.de, Stand ${day(s.updated)})</div>${matrix(s.niches)}
          <div class="muted">Kreisgröße = Anzahl Designs · <span style="color:${PRIO.A}">● A</span> zuerst · <span style="color:${PRIO.B}">● B</span> danach · <span style="color:${PRIO.C}">● C</span> nicht bespielen</div></div>
        <div class="mp-card"><div class="mp-l">Design-Typen</div>
          ${s.designTypes.map((d) => `<div class="mp-step"><div class="mp-pill2">${esc(d.phase)}</div><div><b>${esc(d.type)}</b> <span class="muted">· ${esc(d.cost)} · ${esc(d.status)}</span><div class="muted">${esc(d.note)}</div></div></div>`).join('')}
          <div class="mp-l" style="margin-top:14px">Nischen-Pipeline (wöchentlich 2 prüfen)</div>
          <div>${(s.pipeline || []).map((p) => `<span class="pill">${esc(p.name)}</span>`).join(' ')}</div></div>
      </div>
      <div class="mp-cards">${act.map((n) => `<div class="mp-card"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:15px">${esc(n.name)}</b><span class="mp-prio" style="background:${PRIO[n.prio]}">${n.prio}</span></div>
          <div class="muted" style="margin:4px 0 8px">${esc(n.why)}</div>
          <table><tr><td class="muted">Treffer DE</td><td class="n">${esc(n.results)}</td></tr><tr><td class="muted">BSR &lt;150k / &lt;400k</td><td class="n">${esc(n.bsr)}</td></tr><tr><td class="muted">Designs</td><td class="n">${n.designs}</td></tr></table>
          <div class="mp-l" style="margin-top:8px">Keywords</div><div>${n.keywords.map((k) => `<span class="pill">${esc(k)}</span>`).join(' ')}</div>
          <div class="mp-l" style="margin-top:6px">Insider</div><div>${n.insider.map((k) => `<span class="pill ok">${esc(k)}</span>`).join(' ')}</div>
          ${n.avoid.length ? `<div class="mp-l" style="margin-top:6px">Vermeiden</div><div>${n.avoid.map((k) => `<span class="pill err">${esc(k)}</span>`).join(' ')}</div>` : ''}</div>`).join('')}</div>
      <div class="muted" style="margin-top:10px">${esc(s.parked || '')}</div>`;
  }

  async function pricing(view) {
    view.innerHTML = '<div class="mp-card">Lade Plan …</div>';
    const s = await load(); if (!s) { view.innerHTML = '<div class="mp-card">Plan nicht erreichbar.</div>'; return; }
    const p = s.pricing.tshirt[0], a = s.ads;
    view.innerHTML = `
      <div class="mp-grid2" style="grid-template-columns:1.2fr 1fr;margin-bottom:12px">
        <div class="mp-card"><div class="mp-l">Royalty je Verkaufspreis – T-Shirt Amazon.de</div>${curve(p)}
          <div class="muted">Gemessen im Merch-Formular am ${esc(s.pricing.measured)}. +1 € Preis = +0,63 € Royalty.</div></div>
        <div class="mp-card"><div class="mp-l">Preisregeln</div><ol class="mp-list">${s.pricing.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>
          <table style="margin-top:10px"><tr><th>Preis</th><th class="n">Royalty</th><th class="n">Anteil</th></tr>
          ${p.points.map((q) => `<tr style="${q[0] === p.rec ? 'font-weight:700;background:#eaf6f0' : ''}"><td>${q[0].toFixed(2).replace('.', ',')} €</td><td class="n">${q[1].toFixed(2).replace('.', ',')} €</td><td class="n">${Math.round((q[1] / q[0]) * 100)} %</td></tr>`).join('')}</table></div>
      </div>
      <div class="mp-grid2" style="grid-template-columns:1.2fr 1fr">
        <div class="mp-card"><div class="mp-l">Werbung – Kampagnen</div>
          ${a.campaigns.map((c) => `<div class="mp-camp"><div style="display:flex;justify-content:space-between"><b>${esc(c.name)}</b><span class="pill wait">${esc(c.status)}</span></div>
            <div class="mp-campgrid"><div><div class="mp-l">Markt</div>${esc(c.mkt)}</div><div><div class="mp-l">Typ</div>${esc(c.type)}</div><div><div class="mp-l">Gebot</div>${esc(c.bid)}</div><div><div class="mp-l">Budget</div>${esc(c.budget)}</div><div><div class="mp-l">Zeitraum</div>${esc(c.period)}</div></div>
            <div class="muted">Keywords: ${esc(c.keywords)}</div></div>`).join('')}
          <div class="muted" style="margin-top:8px">Budgetdeckel: ${esc(a.budgetCap)} · Break-even: ${esc(a.breakEven)}</div></div>
        <div class="mp-card"><div class="mp-l">Werberegeln</div><ol class="mp-list">${a.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>
          <div class="mp-l" style="margin-top:12px">Bisherige Werbung (2023–2025)</div>
          <div style="display:flex;gap:18px;margin-top:4px"><div><div class="mp-l">Kosten</div><b>${esc(a.history.spend)}</b></div><div><div class="mp-l">Umsatz</div><b>${esc(a.history.sales)}</b></div><div><div class="mp-l">ROAS</div><b>${esc(a.history.roas)}</b></div><div><div class="mp-l">Ergebnis</div><b style="color:#b3261e">${esc(a.history.result)}</b></div></div></div>
      </div>`;
  }
  window.__MP_PLAN = { strategy, pricing, load };
})();
