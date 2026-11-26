// MerchPilot-Hülle. Einmal installieren – der eigentliche Code kommt bei jedem Seitenaufruf aus GitHub.
const CODE_URL = 'https://raw.githubusercontent.com/rn7v9cmnnr-lab/merchpilot/main/bundle.js';
const AUTO_URL = 'https://merch.amazon.com/designs/new#mp-auto';

async function getCode() {
  try {
    const r = await fetch(CODE_URL + '?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const code = await r.text();
    await chrome.storage.local.set({ code, codeAt: Date.now() });
    return code;
  } catch (e) {
    console.warn('[MerchPilot] Laden fehlgeschlagen, nutze letzte Version', e);
    return (await chrome.storage.local.get('code')).code || '';
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
