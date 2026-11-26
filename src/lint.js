/* MerchPilot-Prüfung: verbotene/riskante Wörter und Marken. Läuft vor jedem Einreihen und vor jedem Upload.
   Fehler (error) blockieren den Upload, Hinweise (warn) nur Anzeige. Liste erweiterbar über MerchPilot.config({lintExtra:[...]}) */
(() => {
  const RULES = [
    // Amazon-Merch-Content-Policy und Listing-Regeln (Versand, Werbeaussagen, Produkteigenschaften, Amazon-Bezug)
    { re: /\b(versand\w*|shipping|ships?|lieferung|delivery|prime)\b/i, lvl: 'error', why: 'Versand/Prime-Aussage' },
    { re: /\bamazon\b/i, lvl: 'error', why: 'Bezug auf Amazon' },
    { re: /\b(best ?seller|#\s?1|nr\.? ?1|top ?seller|meistverkauft)\b/i, lvl: 'error', why: 'Verkaufsranking-Aussage' },
    { re: /\b(sale|rabatt\w*|discount\w*|angebot\w*|deal|gratis|kostenlos\w*|free)\b/i, lvl: 'error', why: 'Preis-/Werbeaussage' },
    { re: /\b(garantie|guarantee|guaranteed|zufriedenheit|money back)\b/i, lvl: 'error', why: 'Garantieversprechen' },
    { re: /\b(offiziell|official|lizenziert|licensed|original merch)\b/i, lvl: 'error', why: 'Lizenz-Anspruch' },
    { re: /\b(review|bewertung|rezension|sterne|stars)\b/i, lvl: 'error', why: 'Bewertungsaufforderung' },
    { re: /(https?:\/\/|www\.|@[a-z0-9-]+\.[a-z]{2,}|<\/?[a-z]+>)/i, lvl: 'error', why: 'Link, E-Mail oder HTML' },
    { re: /\b(charity|spende|spenden|donat\w*|erlös)\b/i, lvl: 'error', why: 'Wohltätigkeitsaussage' },
    { re: /\b(qualität|quality|hochwertig|premium[- ]?qualität|100 ?% ?(baumwolle|cotton)|stoff|fabric|material)\b/i, lvl: 'warn', why: 'Produkteigenschaft statt Design' },
    { re: /\b(bequem|comfort\w*|weich|soft)\b/i, lvl: 'warn', why: 'Produkteigenschaft statt Design' },
    { re: /\b(öko|eco[- ]?friendly|nachhaltig|sustainable|bio)\b/i, lvl: 'warn', why: 'Umweltaussage' },
    { re: /\b(neon|glow|leuchtet|im dunkeln)\b/i, lvl: 'warn', why: 'klingt nach Shirt-Eigenschaft' },
    { re: /(geschenk|gift|präsent|schenk)/i, lvl: 'error', why: 'Geschenk-Hinweise im Listing nicht erlaubt (Merch-Richtlinie)' },
    // Grobe Schimpfwörter / heikle Inhalte
    { re: /\b(fuck\w*|shit|bitch|arsch\w*|scheiß\w*|fick\w*|hure|nazi|hitler|drogen|cocaine|kokain|weed|gras rauchen)\b/i, lvl: 'error', why: 'Schimpfwort / unzulässiger Inhalt' },
  ];
  // Marken, die in unseren Nischen naheliegen (Sportgeräte, Sportverbände, Popkultur). Fund = Fehler.
  const BRANDS = ['bullpadel','babolat','wilson','nox','siux','adidas','nike','puma','asics','dunlop','world padel tour','premier padel',
    'petzl','la sportiva','scarpa','black diamond','mammut','edelrid','five ten','ocun','tenaya','red bull',
    'fliteboard','lift foil','duotone','f-one','slingshot','naish','axis foils','cabrinha','north kiteboarding','gopro','strava','garmin',
    'spikeball','ironman','crossfit','peloton','olympia','olympic','fifa','uefa','dfb','bundesliga','nfl','nba','mlb','nhl',
    'disney','marvel','pokemon','pokémon','star wars','harry potter','lego','barbie','minecraft','fortnite','netflix','coca cola','jägermeister','oktoberfest'];
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function lint(item, extra = []) {
    const out = [];
    const fields = { Titel: item.title, Marke: item.brand, 'Bullet 1': item.bullet1, 'Bullet 2': item.bullet2, Beschreibung: item.description,
      Motiv: (item.spec?.lines || []).map((l) => (Array.isArray(l) ? l[0] : l.text)).join(' ') };
    for (const [f, txt] of Object.entries(fields)) {
      if (!txt) continue;
      for (const r of RULES) { const m = txt.match(r.re); if (m) out.push({ lvl: r.lvl, field: f, word: m[0], why: r.why }); }
      for (const b of [...BRANDS, ...extra]) { if (new RegExp(`(^|[^a-zäöü])${esc(b)}([^a-zäöü]|$)`, 'i').test(txt)) out.push({ lvl: 'error', field: f, word: b, why: 'Marke' }); }
    }
    if ((item.title || '').length > 60) out.push({ lvl: 'error', field: 'Titel', word: '', why: 'über 60 Zeichen' });
    if ((item.brand || '').length > 50 || (item.brand || '').length < 3) out.push({ lvl: 'error', field: 'Marke', word: '', why: '3–50 Zeichen' });
    if ((item.description || '').length && (item.description || '').length < 75) out.push({ lvl: 'warn', field: 'Beschreibung', word: '', why: 'unter 75 Zeichen (wird ergänzt)' });
    if (item.tmCheck?.hits?.length) out.push(...item.tmCheck.hits.map((h) => ({ lvl: 'error', field: 'Marke (Register)', word: h, why: 'eingetragene Marke Klasse 25' })));
    return { ok: !out.some((x) => x.lvl === 'error'), issues: out };
  }
  window.__MP_LINT = lint;
})();
