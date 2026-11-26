/* MerchPilot – Regelwerk: Plan je Design und je Nische (kurz / mittel / lang).
   Liest Designs (FindDesigns), Verkäufe (purchases/records) und die Warteschlange und leitet
   für jedes Design und jede Nische Phase, Kennzahlen und die nächste Aktion ab.
   Aktionen sind markiert: auto = darf MerchPilot selbst ausführen, ok = braucht Davids Freigabe. */
(() => {
  const DAY = 864e5;
  const GATE1 = '2027-01-04', GATE2 = '2027-01-24', XMAS_CUT = '2026-12-21';

  // ---------- Regeln (Quelle der Wahrheit, auch für die Anzeige) ----------
  const DESIGN_RULES = [
    { phase: 'Live-Check', tage: '0–3', regel: 'Status muss auf „live“ wechseln.', aktion: 'Hängt > 3 Tage in Review/abgelehnt → prüfen, ggf. ersetzen', art: 'ok' },
    { phase: 'Indexierung', tage: '4–14', regel: 'Amazon indexiert; keine Änderungen.', aktion: 'In Auto-Discovery-Kampagne aufnehmen (sobald Werbung frei)', art: 'auto' },
    { phase: 'Test', tage: '15–45', regel: '≥ 1 Verkauf → Kandidat.', aktion: 'Kandidat: exakte Werbung mit eigenen Suchbegriffen; 0 Verkäufe + ≥ 15 Werbeklicks → Anzeige pausieren', art: 'auto' },
    { phase: 'Bewertung', tage: '46–90', regel: '≥ 3 Verkäufe → Gewinner · 1–2 → Halten · 0 → Schläfer.', aktion: 'Gewinner: Preis 21,99 €, 2 Stil-Varianten + Hoodie/Sweatshirt DE · Schläfer: aus Werbung', art: 'ok' },
    { phase: 'Ausbau', tage: '91–180', regel: 'Gewinner mit ≥ 3 Verkäufen / 30 Tage.', aktion: 'Übersetzt auf UK/FR/IT/ES ausrollen, Werbebudget +50 %', art: 'ok' },
    { phase: 'Bereinigung', tage: '> 180', regel: '0 Verkäufe seit Upload.', aktion: 'Löschkandidat – nur wenn Slots > 80 % belegt', art: 'ok' },
  ];
  const NICHE_RULES = {
    kurz: { bis: XMAS_CUT, titel: 'Kurzfristig – bis Weihnachten', regeln: [
      'Ziel: ≥ 1 Verkauf je Nische bis 21.12.',
      'Werbung Mo + Do auswerten: Suchbegriff mit Verkauf → exakt ernten; ≥ 10 Klicks ohne Verkauf → negativ',
      'Keine neuen Designs in einer Nische, bevor ihre ersten 14 Tage Daten vorliegen',
      'Neue Uploads gehen in Pipeline-Nischen (max. 12 pro Nische als Test)',
      'Produkttest: 25 der 50 Designs zusätzlich als Pullover-Hoodie DE (36,99 € ≈ 5,03 €) – gleiche Motive, sauberer Vergleich; kostet keine Design-Slots'] },
    mittel: { bis: GATE1, titel: 'Mittelfristig – Gate 1 (4.1.2027)', regeln: [
      'Score = Verkäufe ÷ Designs der Nische',
      '≥ 2 Verkäufe → Ausbauen: +12 Designs in den Formaten der Gewinner',
      '1 Verkauf → Halten: +6 Designs, Werbung nur exakt',
      '0 Verkäufe und ≥ 30 Werbeklicks → Stoppen: keine neuen Designs, Platz für Pipeline-Nische',
      'Produkttest auswerten: Verkäufe je Design Hoodie vs. T-Shirt; Hoodie ≥ T-Shirt → Hoodie auf alle Designs der Nische, sonst nur Gewinner'] },
    lang: { bis: GATE2, titel: 'Langfristig – Gate 2 (24.1.) und dann quartalsweise', regeln: [
      '≥ 15 Verkäufe / Quartal → Kernnische: Hoodie/Sweatshirt + UK/FR/IT/ES',
      '3–14 Verkäufe / Quartal → Halten, 10 neue Designs / Quartal',
      '< 3 Verkäufe / Quartal → Einfrieren (Designs bleiben, keine Uploads, keine Werbung)',
      'Konto-Ziel: ≥ 15 Verkäufe aus neuen Designs bis 24.1. bei ≥ 3,90 € Tantieme'] },
  };

  const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9äöüß ]/g, ' ').replace(/\s+/g, ' ').trim();
  const today = () => new Date().toISOString().slice(0, 10);
  const addDays = (d, n) => new Date(new Date(d).getTime() + n * DAY).toISOString().slice(0, 10);
  const LIVE = /PUBLISHED|LIVE|PROPAGATED/i, BAD = /DECLINED|REJECTED|TIMED_OUT|REMOVED|LOCKED/i;
  const statusOf = (d) => { const s = JSON.stringify(d?.status || ''); return BAD.test(s) ? 'Problem' : LIVE.test(s) ? 'live' : /REVIEW/.test(s) ? 'Review' : /PUBLISHING|TRANSLATING/.test(s) ? 'wird veröffentlicht' : 'unbekannt'; };

  function designPlan(x) {
    const age = x.age, units = x.units;
    if (x.state === 'Problem') return { phase: 'Live-Check', next: 'Ablehnung prüfen, Design ersetzen', art: 'ok', due: today() };
    if (age <= 3 || x.state !== 'live') return { phase: 'Live-Check', next: age > 3 ? 'Hängt > 3 Tage – prüfen' : 'Warten bis live', art: age > 3 ? 'ok' : 'auto', due: addDays(x.uploaded, 3) };
    if (age <= 14) return { phase: 'Indexierung', next: 'Auto-Discovery (ab Werbestart)', art: 'auto', due: addDays(x.uploaded, 15) };
    if (age <= 45) return units >= 1 ? { phase: 'Test', tag: 'Kandidat', next: 'Exakte Werbung mit eigenen Suchbegriffen', art: 'auto', due: addDays(x.uploaded, 46) }
      : { phase: 'Test', next: 'Weiter beobachten; ≥ 15 Klicks ohne Verkauf → Anzeige pausieren', art: 'auto', due: addDays(x.uploaded, 46) };
    if (age <= 90) return units >= 3 ? { phase: 'Bewertung', tag: 'Gewinner', next: 'Preis 21,99 € · 2 Varianten · Hoodie/Sweatshirt DE', art: 'ok', due: today() }
      : units >= 1 ? { phase: 'Bewertung', tag: 'Halten', next: 'Werbung nur exakt, Preis 19,99 €', art: 'auto', due: addDays(x.uploaded, 91) }
      : { phase: 'Bewertung', tag: 'Schläfer', next: 'Aus Werbung nehmen', art: 'auto', due: today() };
    if (age <= 180) return x.units30 >= 3 ? { phase: 'Ausbau', tag: 'Gewinner', next: 'UK/FR/IT/ES übersetzt ausrollen, Werbung +50 %', art: 'ok', due: today() }
      : { phase: 'Ausbau', tag: units ? 'Halten' : 'Schläfer', next: units ? 'Halten' : 'Keine Aktion', art: 'auto', due: addDays(x.uploaded, 181) };
    return units ? { phase: 'Bereinigung', tag: 'Halten', next: 'Halten', art: 'auto', due: addDays(today(), 90) } : { phase: 'Bereinigung', tag: 'Löschkandidat', next: 'Löschen, falls Slots > 80 %', art: 'ok', due: today() };
  }

  function nichePlan(n) {
    const t = today();
    const horizon = t < XMAS_CUT ? 'kurz' : t < GATE2 ? 'mittel' : 'lang';
    let verdict, next;
    if (t < GATE1) {
      verdict = n.units ? 'auf Kurs' : n.live < n.designs ? 'startet' : 'wartet auf ersten Verkauf';
      next = n.units ? `Gewinner-Formate merken; Gate 1 am 4.1.` : 'Werbung auswerten (Mo + Do)';
    } else if (t < GATE2) {
      verdict = n.units >= 2 ? 'Ausbauen' : n.units === 1 ? 'Halten' : 'Stoppen prüfen';
      next = n.units >= 2 ? '+12 Designs in Gewinner-Formaten' : n.units === 1 ? '+6 Designs, Werbung exakt' : 'Keine neuen Designs; Platz für Pipeline-Nische';
    } else {
      verdict = n.units90 >= 15 ? 'Kernnische' : n.units90 >= 3 ? 'Halten' : 'Einfrieren';
      next = n.units90 >= 15 ? 'Hoodie/Sweatshirt + UK/FR/IT/ES' : n.units90 >= 3 ? '10 neue Designs / Quartal' : 'Keine Uploads, keine Werbung';
    }
    return { horizon, verdict, next, score: n.designs ? n.units / n.designs : 0 };
  }

  async function evaluate(MP) {
    const q = MP.queue().filter((x) => x.status === 'done');
    const since = Math.min(...q.map((x) => new Date(x.published || x.added).getTime()), Date.now()) - DAY;
    const [ds, rows] = await Promise.all([MP.designs(), MP.sales(since)]);
    const byTitle = new Map(ds.map((d) => [norm(d.title), d]));
    const now = Date.now();
    const designs = q.map((x) => {
      const d = byTitle.get(norm(x.title));
      const key = norm(x.title).slice(0, 40);
      const mine = rows.filter((r) => norm(r.name).startsWith(key) || key.startsWith(norm(r.name).slice(0, 40)));
      const units = mine.reduce((s, r) => s + (r.units || 0) - (r.returned || 0), 0);
      const units30 = mine.filter((r) => r.to > now - 30 * DAY).reduce((s, r) => s + (r.units || 0), 0);
      const royalty = mine.reduce((s, r) => s + (r.royaltyEUR || 0), 0);
      const uploaded = (x.published || x.added || '').slice(0, 10);
      const o = { id: x.id, niche: x.niche || '–', title: x.title, imageKey: x.imageKey, ads: /Kandidat ab Gate/.test(x.brief?.werbung || ''), uploaded, age: Math.floor((now - new Date(uploaded).getTime()) / DAY), state: statusOf(d), units, units30, royalty };
      return { ...o, plan: designPlan(o) };
    });
    const niches = [...new Set(designs.map((d) => d.niche))].map((name) => {
      const ds_ = designs.filter((d) => d.niche === name);
      const n = { name, designs: ds_.length, live: ds_.filter((d) => d.state === 'live').length, units: ds_.reduce((s, d) => s + d.units, 0), units90: ds_.reduce((s, d) => s + d.units, 0), royalty: ds_.reduce((s, d) => s + d.royalty, 0), winners: ds_.filter((d) => d.plan.tag === 'Gewinner').length };
      return { ...n, plan: nichePlan(n) };
    });
    const actions = designs.filter((d) => d.plan.art === 'ok' && d.plan.due <= today()).map((d) => ({ id: d.id, title: d.title, what: d.plan.next }));
    const snap = { at: new Date().toISOString(), niches: niches.map((n) => ({ name: n.name, units: n.units, live: n.live, verdict: n.plan.verdict })) };
    try { const log = JSON.parse(localStorage.getItem('mp.rulesLog') || '[]'); if (!log.length || log[log.length - 1].at.slice(0, 10) !== snap.at.slice(0, 10)) { log.push(snap); localStorage.setItem('mp.rulesLog', JSON.stringify(log.slice(-120))); } } catch (e) {}
    return { designs, niches, actions, at: snap.at };
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  async function view(el, MP) {
    el.innerHTML = '<div class="mp-card">Werte Designs, Verkäufe und Status aus …</div>';
    let r;
    try { r = await evaluate(MP); } catch (e) { el.innerHTML = `<div class="mp-card">Fehler: ${esc(e.message)}</div>`; return; }
    const t = today(); const hz = t < XMAS_CUT ? 'kurz' : t < GATE2 ? 'mittel' : 'lang';
    const phaseCount = (n) => r.designs.filter((d) => d.plan.phase === n).length;
    const col = { 'auf Kurs': '#2a6', Ausbauen: '#2a6', Kernnische: '#2a6', Halten: '#c90', startet: '#889', 'wartet auf ersten Verkauf': '#889', 'Stoppen prüfen': '#c44', Einfrieren: '#c44' };
    el.innerHTML = `<style>
      .rg{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.rn{background:#fff;border:1px solid #e3e6ea;border-radius:10px;padding:12px}
      .rn h3{margin:0 0 6px;font-size:15px}.rk{display:flex;gap:14px;font-size:12px;color:#556}.rk b{display:block;font-size:20px;color:#111}
      .rv{display:inline-block;margin-top:8px;padding:2px 8px;border-radius:10px;color:#fff;font-size:12px}
      .rh{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.rh .on{border:2px solid #1d2330}.rh ul{margin:6px 0 0 16px;padding:0;font-size:12px}
      .rf{display:flex;gap:4px;margin:6px 0}.rf div{flex:1;text-align:center;font-size:11px;padding:6px 2px;background:#eef1f5;border-radius:6px}.rf b{display:block;font-size:16px}
      table.rt{width:100%;border-collapse:collapse;font-size:12px}table.rt td,table.rt th{padding:5px 6px;border-bottom:1px solid #eee;text-align:left}
      .ok{color:#b60;font-weight:600}.au{color:#2a6}</style>
      <div class="mp-card"><div style="display:flex;align-items:center"><b>Plansteuerung</b><span class="muted" style="margin-left:8px">Stand ${new Date(r.at).toLocaleString('de-DE')} · grün = läuft automatisch, orange = braucht deine Freigabe</span><span style="flex:1"></span><button class="btn sec" id="rr">Neu auswerten</button></div>
      <div class="rf">${DESIGN_RULES.map((x) => `<div><b>${phaseCount(x.phase)}</b>${x.phase}<br><span class="muted">Tag ${x.tage}</span></div>`).join('')}</div></div>
      <div class="rg" style="margin-top:10px">${r.niches.map((n) => `<div class="rn"><h3>${esc(n.name)}</h3>
        <div class="rk"><span><b>${n.designs}</b>Designs</span><span><b>${n.live}</b>live</span><span><b>${n.units}</b>Verkäufe</span><span><b>${n.royalty.toFixed(0)} €</b>Tantieme</span></div>
        <span class="rv" style="background:${col[n.plan.verdict] || '#889'}">${esc(n.plan.verdict)}</span><div class="muted" style="margin-top:6px">Nächster Schritt: ${esc(n.plan.next)}</div></div>`).join('')}</div>
      <div class="rh" style="margin-top:10px">${Object.entries(NICHE_RULES).map(([k, v]) => `<div class="rn ${k === hz ? 'on' : ''}"><b>${v.titel}</b>${k === hz ? ' <span class="pill wait">aktiv</span>' : ''}<ul>${v.regeln.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>
      ${r.actions.length ? `<div class="mp-card" style="margin-top:10px"><b>Wartet auf deine Freigabe (${r.actions.length})</b><ul>${r.actions.map((a) => `<li>${esc(a.title)} – ${esc(a.what)}</li>`).join('')}</ul></div>` : ''}
      <div class="mp-card" style="margin-top:10px"><b>Regeln je Design</b><table class="rt"><tr><th>Phase</th><th>Tag</th><th>Regel</th><th>Aktion</th><th></th></tr>
        ${DESIGN_RULES.map((x) => `<tr><td>${x.phase}</td><td>${x.tage}</td><td>${esc(x.regel)}</td><td>${esc(x.aktion)}</td><td class="${x.art === 'ok' ? 'ok' : 'au'}">${x.art === 'ok' ? 'Freigabe' : 'automatisch'}</td></tr>`).join('')}</table></div>
      <div class="mp-card" style="margin-top:10px"><b>Alle Designs</b><table class="rt"><tr><th>ID</th><th>Nische</th><th>Titel</th><th>Tag</th><th>Status</th><th>Verk.</th><th>Phase</th><th>Nächste Aktion</th><th>fällig</th></tr>
        ${r.designs.map((d) => `<tr><td>${d.id}</td><td>${esc(d.niche)}</td><td>${esc(d.title.slice(0, 48))}${d.ads ? ' <span class="pill wait">Werbung</span>' : ''}</td><td>${d.age}</td><td>${d.state}</td><td>${d.units}</td><td>${d.plan.phase}${d.plan.tag ? ' · ' + d.plan.tag : ''}</td><td class="${d.plan.art === 'ok' ? 'ok' : 'au'}">${esc(d.plan.next)}</td><td>${d.plan.due}</td></tr>`).join('')}</table></div>`;
    el.querySelector('#rr').onclick = () => view(el, MP);
  }

  window.__MP_RULES = { DESIGN_RULES, NICHE_RULES, evaluate: () => evaluate(window.MerchPilot), view: (el) => view(el, window.MerchPilot) };
})();
