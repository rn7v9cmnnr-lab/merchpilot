// MerchPilot-Hülle. Einmal installieren – der eigentliche Code kommt bei jedem Seitenaufruf aus GitHub.
const REPO = 'rn7v9cmnnr-lab/merchpilot';
const AUTO_URL = 'https://merch.amazon.com/designs/new#mp-auto';

// Neueste Version: Commit-Hash über die GitHub-API (max. 1x pro Minute), dann Datei zu genau diesem Commit laden.
// So greift kein CDN-Cache – jede Änderung ist beim nächsten Seitenaufruf aktiv.
async function getCode() {
  const st = await chrome.storage.local.get(['code', 'sha', 'shaAt']);
  try {
    let sha = st.sha;
    if (!sha || Date.now() - (st.shaAt || 0) > 60e3) {
      const r = await fetch(`https://api.github.com/repos/${REPO}/commits/main`, { headers: { Accept: 'application/vnd.github.sha' }, cache: 'no-store' });
      if (r.ok) { sha = (await r.text()).trim(); await chrome.storage.local.set({ shaAt: Date.now() }); }
    }
    if (sha && sha === st.sha && st.code) return st.code;
    const r2 = await fetch(`https://raw.githubusercontent.com/${REPO}/${sha || 'main'}/bundle.js`);
    if (!r2.ok) throw new Error('HTTP ' + r2.status);
    const code = await r2.text();
    await chrome.storage.local.set({ code, sha, codeAt: Date.now() });
    return code;
  } catch (e) {
    console.warn('[MerchPilot] Laden fehlgeschlagen, nutze letzte Version', e);
    return st.code || '';
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status !== 'complete' || !tab.url?.startsWith('https://merch.amazon.com/')) return;
  const code = await getCode();
  if (!code) return;
  chrome.scripting.executeScript({
    target: { tabId }, world: 'MAIN',
    func: (src) => { if (!window.MerchPilot) (0, eval)(src); },
    args: [code],
  });
});

// Täglicher Autopilot: öffnet die Create-Seite, der Code arbeitet die Warteschlange ab
async function schedule() {
  const { autopilot = false } = await chrome.storage.local.get('autopilot');
  await chrome.alarms.clearAll();
  chrome.action.setBadgeText({ text: autopilot ? 'ON' : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#0a7d5a' });
  if (!autopilot) return;
  const next = new Date(); next.setHours(10, Math.floor(Math.random() * 50), 0, 0);
  if (next <= new Date()) next.setDate(next.getDate() + 1);
  chrome.alarms.create('mp-daily', { when: next.getTime(), periodInMinutes: 1440 });
}
chrome.runtime.onInstalled.addListener(schedule);
chrome.runtime.onStartup.addListener(schedule);
chrome.alarms.onAlarm.addListener((a) => a.name === 'mp-daily' && chrome.tabs.create({ url: AUTO_URL, active: false }));
chrome.action.onClicked.addListener(async () => {
  const { autopilot = false } = await chrome.storage.local.get('autopilot');
  await chrome.storage.local.set({ autopilot: !autopilot });
  schedule();
});
