/* Nestab — root app */

import React, { useState, useEffect } from 'react';
import Popup from './Popup.jsx';
import { useTweaks, TweaksPanel, TweakSection, TweakToggle, TweakRadio, TweakColor, TweakButton } from './TweaksPanel.jsx';
import { loadState } from './storage.js';
import TAB_DATA from './tab-data.js';

const TWEAK_DEFAULTS = {
  dark: false,
  density: 'comfy',
  accent: '#3d7a5e',
  showRelief: true,
  screen: 'main',
};

function rgba(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function shade(hex, pct) {
  const h = hex.replace('#', '');
  const f = pct / 100;
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  const r = clamp(parseInt(h.slice(0, 2), 16) * (1 + f));
  const g = clamp(parseInt(h.slice(2, 4), 16) * (1 + f));
  const b = clamp(parseInt(h.slice(4, 6), 16) * (1 + f));
  return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
}

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState(t.screen || 'main');
  const [ready, setReady] = useState(false);

  const [state, setState] = useState({
    tabs: TAB_DATA,
    removed: new Set(),
    leavingIds: new Set(),
    group: 'date',
    query: '',
    selectMode: false,
    selectedIds: new Set(),
    toasts: [],
    showRelief: true,
    settings: { idleHours: 72, skipPinned: true, defaultGroup: 'date' },
  });

  // Load from storage on mount
  useEffect(() => {
    loadState().then(({ savedTabs, settings, onboardingComplete }) => {
      setState(s => ({
        ...s,
        tabs: savedTabs.length ? savedTabs : TAB_DATA,
        settings,
        showRelief: t.showRelief,
      }));
      if (!onboardingComplete) setScreen('onboard-1');
      setReady(true);
    });
  }, []);

  useEffect(() => { setScreen(t.screen); }, [t.screen]);
  useEffect(() => { setState(s => ({ ...s, showRelief: t.showRelief })); }, [t.showRelief]);

  useEffect(() => {
    document.body.classList.toggle('dark', t.dark);
    document.body.classList.toggle('compact', t.density === 'compact');
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--accent-2', shade(t.accent, -16));
    document.documentElement.style.setProperty('--accent-tint', rgba(t.accent, 0.12));
    document.documentElement.style.setProperty('--accent-soft', rgba(t.accent, 0.20));
  }, [t.dark, t.density, t.accent]);

  const goScreen = (s) => { setScreen(s); setTweak('screen', s); };

  // Demo helpers
  const triggerBulkSelect = () => {
    goScreen('main');
    setState(s => ({ ...s, selectMode: true, selectedIds: new Set(['t10', 't11', 't13']) }));
  };
  const triggerReopenToast = () => {
    goScreen('main');
    setState(s => {
      const sample = s.tabs.find(t => !s.removed.has(t.id));
      if (!sample) return s;
      const id = Math.random().toString(36).slice(2);
      const r = new Set(s.removed);
      r.add(sample.id);
      setTimeout(() => setState(prev => ({ ...prev, toasts: prev.toasts.filter(x => x.id !== id) })), 4500);
      return {
        ...s,
        removed: r,
        toasts: [...s.toasts, { id, kind: 'reopen', title: sample.title, domain: sample.domain, ids: [sample.id] }],
      };
    });
  };

  if (!ready) return null;

  return (
    <>
      <Popup
        screen={screen}
        setScreen={goScreen}
        state={state}
        setState={setState}
      />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme">
          <TweakToggle label="Dark mode" value={t.dark} onChange={v => setTweak('dark', v)} />
          <TweakColor label="Accent" value={t.accent}
                      options={['#3d7a5e', '#2a6fdb', '#a85a2b', '#6f4eb0']}
                      onChange={v => setTweak('accent', v)} />
        </TweakSection>
        <TweakSection label="Display">
          <TweakRadio label="Density" value={t.density}
                      options={['comfy', 'compact']}
                      onChange={v => setTweak('density', v)} />
          <TweakToggle label="Show relief message" value={t.showRelief}
                       onChange={v => setTweak('showRelief', v)} />
        </TweakSection>
        <TweakSection label="Prototype">
          <TweakRadio label="Screen" value={t.screen}
                      options={['onboard-1', 'onboard-2', 'main', 'empty', 'settings']}
                      onChange={v => setTweak('screen', v)} />
          <TweakButton label="Bulk select demo" onClick={triggerBulkSelect} secondary />
          <TweakButton label="Reopen toast demo" onClick={triggerReopenToast} secondary />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}
