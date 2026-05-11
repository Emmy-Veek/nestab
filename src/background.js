const MS_PER_DAY = 24 * 60 * 60 * 1000;

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const data = await chrome.storage.local.get('tabActivity');
  const tabActivity = data.tabActivity || {};
  tabActivity[tabId] = Date.now();
  await chrome.storage.local.set({ tabActivity });
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status !== 'complete') return;
  const data = await chrome.storage.local.get('tabActivity');
  const tabActivity = data.tabActivity || {};
  tabActivity[tabId] = Date.now();
  await chrome.storage.local.set({ tabActivity });
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const data = await chrome.storage.local.get('tabActivity');
  const tabActivity = data.tabActivity || {};
  delete tabActivity[tabId];
  await chrome.storage.local.set({ tabActivity });
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  chrome.alarms.create('check-idle-tabs', { periodInMinutes: 60 });
  await initializeTabActivity();
  if (reason === 'install') {
    await chrome.storage.local.set({ onboardingComplete: false });
  }
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('check-idle-tabs', { periodInMinutes: 60 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'check-idle-tabs') checkAndSaveTabs();
});

async function initializeTabActivity() {
  const tabs = await chrome.tabs.query({});
  const data = await chrome.storage.local.get('tabActivity');
  const tabActivity = data.tabActivity || {};
  const now = Date.now();
  for (const tab of tabs) {
    if (tabActivity[tab.id] == null) tabActivity[tab.id] = now;
  }
  await chrome.storage.local.set({ tabActivity });
}

async function checkAndSaveTabs() {
  const data = await chrome.storage.local.get(['settings', 'tabActivity', 'savedTabs']);
  const settings = data.settings || {};
  const tabActivity = data.tabActivity || {};
  const savedTabs = data.savedTabs || [];

  const idleDays = settings.idleDays ?? 3;
  const skipPinned = settings.skipPinned !== false;
  const threshold = idleDays * MS_PER_DAY;
  const now = Date.now();

  const tabs = await chrome.tabs.query({});
  const toSave = [];
  const toClose = [];

  for (const tab of tabs) {
    if (skipPinned && tab.pinned) continue;
    if (tab.active) continue;
    if (!tab.url) continue;
    try {
      const url = new URL(tab.url);
      if (url.protocol === 'chrome:' || url.protocol === 'chrome-extension:') continue;
    } catch { continue; }

    const lastActive = tabActivity[tab.id];
    if (lastActive == null) continue;
    if (now - lastActive < threshold) continue;

    const idleMs = now - lastActive;
    const idleDaysCount = Math.floor(idleMs / MS_PER_DAY);
    let savedAt, unit;
    if (idleMs < MS_PER_DAY) {
      savedAt = Math.max(1, Math.floor(idleMs / (60 * 60 * 1000)));
      unit = 'hours';
    } else {
      savedAt = idleDaysCount;
      unit = 'days';
    }

    toSave.push({
      id: `ts-${now}-${tab.id}`,
      title: tab.title || tab.url,
      url: tab.url,
      domain: new URL(tab.url).hostname.replace(/^www\./, ''),
      favicon: tab.favIconUrl || '',
      savedAt,
      unit,
      savedTimestamp: now,
    });
    toClose.push(tab.id);
  }

  if (toSave.length === 0) return;

  const newSavedTabs = [...toSave, ...savedTabs];
  await chrome.storage.local.set({ savedTabs: newSavedTabs });
  await chrome.tabs.remove(toClose);
  updateBadge(newSavedTabs.length);
}

async function updateBadge(count) {
  const text = count > 0 ? String(Math.min(count, 99)) : '';
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color: '#3d7a5e' });
}

chrome.storage.onChanged.addListener((changes) => {
  if (changes.savedTabs) updateBadge(changes.savedTabs.newValue?.length || 0);
});