import TAB_DATA from './tab-data.js';

const isExt = typeof chrome !== 'undefined' && !!chrome?.storage?.local;

function get(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}
function set(data) {
  return new Promise(resolve => chrome.storage.local.set(data, resolve));
}

export async function loadState() {
  if (!isExt) {
    return {
      savedTabs: TAB_DATA,
      settings: { idleHours: 72, skipPinned: true, defaultGroup: 'date' },
      onboardingComplete: true,
    };
  }
  const data = await get(['savedTabs', 'settings', 'onboardingComplete', 'totalSaved']);
  return {
    savedTabs: data.savedTabs?.length ? data.savedTabs : [],
    settings: data.settings || { idleHours: 72, skipPinned: true, defaultGroup: 'date' },
    onboardingComplete: data.onboardingComplete ?? false,
    totalSaved: data.totalSaved ?? data.savedTabs?.length ?? 0,
  };
}

export async function persistSavedTabs(tabs) {
  if (!isExt) return;
  await set({ savedTabs: tabs });
}

export async function persistSettings(settings) {
  if (!isExt) return;
  await set({ settings });
}

export async function completeOnboarding() {
  if (!isExt) return;
  await set({ onboardingComplete: true });
}

export async function reopenTab(url) {
  if (!isExt) { console.log('Would open:', url); return; }
  await chrome.tabs.create({ url, active: true });
  window.close();
}