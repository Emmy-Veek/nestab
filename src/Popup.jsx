/* Nestab — popup screens */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { persistSavedTabs, persistSettings, completeOnboarding, reopenTab } from './storage.js';

// ── Icons ────────────────────────────────────────────────────────────────────

export const Icon = {
  Search: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5 14 14" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Stats: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3 5 8l5 5M5 8h9" />
    </svg>
  ),
  ExternalLink: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h4v4M13 3 8 8M11 9.5V13H3V5h3.5" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5h10M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M4.5 4.5l.7 8.2a1 1 0 0 0 1 .8h3.6a1 1 0 0 0 1-.8l.7-8.2" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3.5 8 3 3 6-6.5" />
    </svg>
  ),
  CheckSmall: () => (
    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 5 2 2 4-4.5" />
    </svg>
  ),
  Sparkle: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v3M8 11v3M2 8h3M11 8h3M3.8 3.8l2 2M10.2 10.2l2 2M3.8 12.2l2-2M10.2 5.8l2-2" />
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const IDLE_OPTIONS = [
  { value: 1,   label: '1h' },
  { value: 2,   label: '2h' },
  { value: 5,   label: '5h' },
  { value: 12,  label: '12h' },
  { value: 24,  label: '1d' },
  { value: 48,  label: '2d' },
  { value: 72,  label: '3d' },
  { value: 168, label: '7d' },
  { value: 336, label: '14d' },
];

function idleLabel(hours) {
  if (hours < 1) { const m = Math.round(hours * 60); return m === 1 ? '1 minute' : `${m} minutes`; }
  if (hours < 24) return hours === 1 ? '1 hour' : `${hours} hours`;
  if (hours % 168 === 0) { const w = hours / 168; return w === 1 ? '1 week' : `${w} weeks`; }
  const days = hours / 24;
  return days === 1 ? '1 day' : `${days} days`;
}

function toHours(num, unit) {
  if (unit === 'minutes') return num / 60;
  if (unit === 'weeks') return num * 168;
  if (unit === 'days')  return num * 24;
  return num;
}

function inferUnit(hours) {
  if (hours < 1)         return 'minutes';
  if (hours % 168 === 0) return 'weeks';
  if (hours % 24  === 0) return 'days';
  return 'hours';
}

function IdleDurationPicker({ value, onChange }) {
  const isPreset = IDLE_OPTIONS.some(o => o.value === value);
  const [showCustom, setShowCustom] = useState(!isPreset);
  const [customNum, setCustomNum] = useState(() => {
    if (!isPreset) {
      const unit = inferUnit(value);
      if (unit === 'minutes') return Math.round(value * 60);
      return unit === 'weeks' ? value / 168 : unit === 'days' ? value / 24 : value;
    }
    return 1;
  });
  const [customUnit, setCustomUnit] = useState(() => isPreset ? 'hours' : inferUnit(value));

  function selectPreset(opt) {
    setShowCustom(false);
    onChange(opt.value);
  }

  function openCustom() {
    setShowCustom(true);
    onChange(Math.max(1 / 60, toHours(customNum, customUnit)));
  }

  function applyCustom(num, unit) {
    const hours = Math.max(1 / 60, toHours(num, unit));
    onChange(hours);
  }

  return (
    <>
      <div className="idle-chips">
        {IDLE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={'idle-chip' + (!showCustom && value === opt.value ? ' on' : '')}
            onClick={() => selectPreset(opt)}
          >
            {opt.label}
          </button>
        ))}
        <button
          className={'idle-chip' + (showCustom ? ' on' : '')}
          onClick={openCustom}
        >
          Custom
        </button>
      </div>
      {showCustom && (
        <div className="idle-custom">
          <div className="idle-stepper">
            <button
              className="idle-step-btn"
              onClick={() => {
                const n = Math.max(1, customNum - 1);
                setCustomNum(n);
                applyCustom(n, customUnit);
              }}
            >−</button>
            <input
              type="number"
              min="1"
              value={customNum}
              className="idle-custom-num"
              onChange={e => {
                const n = Math.max(1, parseInt(e.target.value, 10) || 1);
                setCustomNum(n);
                applyCustom(n, customUnit);
              }}
            />
            <button
              className="idle-step-btn"
              onClick={() => {
                const n = customNum + 1;
                setCustomNum(n);
                applyCustom(n, customUnit);
              }}
            >+</button>
          </div>
          <select
            className="idle-unit-select"
            value={customUnit}
            onChange={e => { setCustomUnit(e.target.value); applyCustom(customNum, e.target.value); }}
          >
            <option value="minutes">minutes</option>
            <option value="hours">hours</option>
            <option value="days">days</option>
            <option value="weeks">weeks</option>
          </select>
        </div>
      )}
    </>
  );
}

function faviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

function timeAgo(savedTimestamp) {
  const ms = Date.now() - savedTimestamp;
  const mins  = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days  = Math.floor(ms / 86400000);
  if (mins  < 60) return mins  <= 1 ? '1m ago'  : `${mins}m ago`;
  if (hours < 24) return hours === 1 ? '1h ago'  : `${hours}h ago`;
  return days === 1 ? '1d ago' : `${days}d ago`;
}

function bucketFor(tab) {
  const now   = new Date();
  const saved = new Date(tab.savedTimestamp);
  const todayMidnight = new Date(now.getFullYear(),   now.getMonth(),   now.getDate());
  const savedMidnight = new Date(saved.getFullYear(), saved.getMonth(), saved.getDate());
  const days = Math.round((todayMidnight - savedMidnight) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days <= 3)  return 'earlier';
  if (days <= 7)  return 'thisweek';
  return 'older';
}

const BUCKETS = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'earlier',   label: 'Earlier this week' },
  { key: 'thisweek',  label: 'Last week' },
  { key: 'older',     label: 'Two weeks +' },
];

function rootDomain(d) { return d.replace(/^www\./, ''); }

function freedGb(count) { return ((count * 38) / 1000).toFixed(2); }

function groupBy(tabs, mode) {
  if (mode === 'date') {
    const map = new Map(BUCKETS.map(b => [b.key, []]));
    for (const t of tabs) map.get(bucketFor(t)).push(t);
    return BUCKETS
      .map(b => ({ label: b.label, key: b.key, items: map.get(b.key) }))
      .filter(g => g.items.length);
  }
  const map = new Map();
  for (const t of tabs) {
    const k = rootDomain(t.domain);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(t);
  }
  return [...map.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([k, items]) => ({ label: k, key: k, items }));
}

// ── Favicon ───────────────────────────────────────────────────────────────────

function Favicon({ domain }) {
  const [err, setErr] = useState(false);
  if (err) {
    return <div className="favicon" aria-hidden="true">{rootDomain(domain)[0].toUpperCase()}</div>;
  }
  return (
    <div className="favicon" aria-hidden="true">
      <img src={faviconUrl(domain)} alt="" onError={() => setErr(true)} />
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function Row({ tab, selected, selectMode, leaving, onReopen, onDismiss, onClick }) {
  return (
    <div
      className={['row', selected && 'is-selected', leaving && 'is-leaving'].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      {selectMode && (
        <div className="row-check" aria-checked={selected} role="checkbox">
          <Icon.CheckSmall />
        </div>
      )}
      <Favicon domain={tab.domain} />
      <div className="row-body">
        <div className="row-title">{tab.title}</div>
        <div className="row-meta">
          <span>{rootDomain(tab.domain)}</span>
          <span className="dot" />
          <span className="time">{timeAgo(tab.savedTimestamp)}</span>
        </div>
      </div>
      {!selectMode && (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <button className="row-action-btn is-danger" title="Dismiss" onClick={onDismiss}>
            <Icon.Trash />
          </button>
          <button className="row-action-btn is-primary" title="Reopen" onClick={onReopen}>
            <Icon.ExternalLink />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Settings screen ──────────────────────────────────────────────────────────

function SettingsScreen({ settings, showRelief, onSave, onBack, onStats, onToggleRelief }) {
  const [draft, setDraft] = useState({ ...settings });

  function updateDraft(key, val) {
    setDraft(d => ({ ...d, [key]: val }));
  }

  return (
    <div className="popup settings">
      <div className="p-header">
        <div className="p-header-row">
          <button className="icon-btn" onClick={onBack} title="Back"><Icon.ArrowLeft /></button>
          <div className="brand" style={{ flex: 1 }}>Settings</div>
          <button className="btn-save" onClick={() => onSave(draft)}>Save</button>
        </div>
      </div>
      <div className="settings-list">
        <div className="set-group">
          <div className="set-group-label">Auto-collection</div>
          <div className="set-card">
            <div className="set-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%' }}>
                <div className="set-body">
                  <div className="set-key">Save tabs after</div>
                  <div className="set-help">A tab is collected once it's been idle this long.</div>
                </div>
              </div>
              <IdleDurationPicker
                value={draft.idleHours}
                onChange={val => updateDraft('idleHours', val)}
              />
            </div>
            <div className="set-row">
              <div className="set-body">
                <div className="set-key">Skip pinned tabs</div>
                <div className="set-help">Never collect tabs you've pinned in Chrome.</div>
              </div>
              <div className={'switch ' + (draft.skipPinned ? 'on' : '')}
                   onClick={() => updateDraft('skipPinned', !draft.skipPinned)} />
            </div>
          </div>
        </div>

        <div className="set-group">
          <div className="set-group-label">Display</div>
          <div className="set-card">
            <div className="set-row">
              <div className="set-body">
                <div className="set-key">Default grouping</div>
                <div className="set-help">How the list opens. You can toggle anytime.</div>
              </div>
              <div className="seg">
                <button className={draft.defaultGroup === 'date' ? 'on' : ''}
                        onClick={() => updateDraft('defaultGroup', 'date')}>By date</button>
                <button className={draft.defaultGroup === 'domain' ? 'on' : ''}
                        onClick={() => updateDraft('defaultGroup', 'domain')}>By domain</button>
              </div>
            </div>
            <div className="set-row">
              <div className="set-body">
                <div className="set-key">Reassurance line</div>
                <div className="set-help">Show the "running freer" message in the footer.</div>
              </div>
              <div className={'switch ' + (showRelief ? 'on' : '')}
                   onClick={onToggleRelief} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Stats screen ──────────────────────────────────────────────────────────────

function StatsScreen({ totalTabs, onBack }) {
  return (
    <div className="popup settings">
      <div className="p-header">
        <div className="p-header-row">
          <button className="icon-btn" onClick={onBack} title="Back"><Icon.ArrowLeft /></button>
          <div className="brand" style={{ flex: 1 }}>Stats</div>
        </div>
      </div>
      <div className="settings-list">
        <div className="set-group">
          <div className="set-group-label">Usage</div>
          <div className="set-card">
            <div className="set-row">
              <div className="set-body">
                <div className="set-key">Saved all-time</div>
                <div className="set-help">Across this device, since you installed Nestab.</div>
              </div>
              <div style={{ fontFamily: 'var(--geist-mono)', fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>
                {totalTabs} tabs
              </div>
            </div>
            <div className="set-row">
              <div className="set-body">
                <div className="set-key">Memory recovered</div>
                <div className="set-help">Estimated, based on average tab footprint.</div>
              </div>
              <div style={{ fontFamily: 'var(--geist-mono)', fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>
                {freedGb(totalTabs)} GB
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Popup ─────────────────────────────────────────────────────────────────────

export default function Popup({ screen, setScreen, state, setState, onRefresh }) {
  const { tabs, removed, group, query, selectMode, selectedIds, leavingIds, toasts, showRelief } = state;

  const visibleTabs = useMemo(() => {
    const live = tabs.filter(t => !removed.has(t.id));
    if (!query.trim()) return live;
    const q = query.toLowerCase();
    return live.filter(t =>
      t.title.toLowerCase().includes(q) || t.domain.toLowerCase().includes(q)
    );
  }, [tabs, removed, query]);

  const groups = useMemo(() => groupBy(visibleTabs, group), [visibleTabs, group]);
  const totalLive = tabs.length - removed.size;

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const [refreshing, setRefreshing] = useState(false);

  const setS = useCallback((patch) => setState(s => ({ ...s, ...patch })), [setState]);

  const beginLeave = useCallback((ids, after) => {
    setS({ leavingIds: new Set([...state.leavingIds, ...ids]) });
    setTimeout(() => {
      setState(s => {
        const r = new Set(s.removed);
        ids.forEach(id => r.add(id));
        const l = new Set(s.leavingIds);
        ids.forEach(id => l.delete(id));
        const liveTabs = s.tabs.filter(t => !r.has(t.id));
        persistSavedTabs(liveTabs);
        return { ...s, removed: r, leavingIds: l, selectedIds: new Set() };
      });
      after?.();
    }, 220);
  }, [state.leavingIds, setState, setS]);

  const pushToast = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    setState(s => ({ ...s, toasts: [{ id, ...toast }] }));
    setTimeout(() => {
      setState(s => ({ ...s, toasts: s.toasts.filter(x => x.id !== id) }));
    }, 4500);
  }, [setState]);

  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    onRefresh().then(() => {
      setRefreshing(false);
      pushToast({ kind: 'saved', title: 'List refreshed' });
    });
  }, [refreshing, onRefresh, pushToast]);

  const handleReopen = useCallback((tab) => {
    beginLeave([tab.id]);
    pushToast({ kind: 'reopen', title: tab.title, domain: tab.domain, ids: [tab.id] });
    reopenTab(tab.url);
  }, [beginLeave, pushToast]);

  const handleDismiss = useCallback((tab) => {
    beginLeave([tab.id]);
    pushToast({ kind: 'dismiss', title: tab.title, domain: tab.domain, ids: [tab.id] });
  }, [beginLeave, pushToast]);

  const undoToast = useCallback((toast) => {
    setState(s => {
      const r = new Set(s.removed);
      toast.ids.forEach(id => r.delete(id));
      const liveTabs = s.tabs.filter(t => !r.has(t.id));
      persistSavedTabs(liveTabs);
      return { ...s, removed: r, toasts: s.toasts.filter(t => t.id !== toast.id) };
    });
  }, [setState]);

  const toggleSelect = useCallback((tab) => {
    setState(s => {
      const sel = new Set(s.selectedIds);
      if (sel.has(tab.id)) sel.delete(tab.id); else sel.add(tab.id);
      return { ...s, selectedIds: sel };
    });
  }, [setState]);

  const exitSelect = () => setS({ selectMode: false, selectedIds: new Set() });

  const bulkReopen = () => {
    const ids = [...state.selectedIds];
    if (!ids.length) return;
    const selected = tabs.filter(t => ids.includes(t.id));
    beginLeave(ids, () => setS({ selectMode: false }));
    const domains = [...new Set(selected.map(t => rootDomain(t.domain)))].slice(0, 2).join(', ');
    pushToast({ kind: 'reopen', title: `${ids.length} tabs reopened`, domain: `${domains}…`, ids });
    selected.forEach(t => reopenTab(t.url));
  };

  const bulkDismiss = () => {
    const ids = [...state.selectedIds];
    if (!ids.length) return;
    beginLeave(ids, () => setS({ selectMode: false }));
    pushToast({ kind: 'dismiss', title: `${ids.length} tabs dismissed`, domain: 'moved to trash', ids });
  };

  // ── Onboarding 1 ────────────────────────────────────────────────────────────

  if (screen === 'onboard-1') {
    return (
      <div className="popup">
        <div className="onboard">
          <div className="ob-hero">
            <div className="ob-mark">T</div>
            <h2 className="ob-headline">Nestab is watching quietly.</h2>
            <p className="ob-sub">
              We'll tuck away tabs you've ignored for a few days — so your
              computer breathes and you never lose what mattered.
            </p>
            <div className="ob-illust">
              <div className="o-row fade d1"><div className="o-fav" /><div className="o-line" style={{ width: '60%' }} /></div>
              <div className="o-row fade d2"><div className="o-fav" /><div className="o-line" style={{ width: '75%' }} /></div>
              <div className="o-row fade d3"><div className="o-fav" /><div className="o-line" style={{ width: '45%' }} /></div>
              <div className="o-row"><div className="o-fav" /><div className="o-line" style={{ width: '55%' }} /></div>
            </div>
          </div>
          <div className="ob-footer">
            <div className="ob-dots"><span className="on" /><span /></div>
            <button className="btn ghost" onClick={() => { completeOnboarding(); setScreen('main'); }}>Skip</button>
            <button className="btn accent" onClick={() => setScreen('onboard-2')}>Continue</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Onboarding 2 ────────────────────────────────────────────────────────────

  if (screen === 'onboard-2') {
    return (
      <div className="popup ob-step2">
        <div className="onboard">
          <div className="ob-hero" style={{ gap: 14 }}>
            <div className="ob-mark" style={{ width: 52, height: 52, fontSize: 20 }}>⚙</div>
            <h2 className="ob-headline">A couple of quick choices.</h2>
            <p className="ob-sub">You can change these anytime in Settings.</p>
            <div className="quick-set">
              <div className="quick-set-row">
                <span className="k">Save tabs after</span>
                <span style={{ fontFamily: 'var(--geist-mono)', fontSize: 12, color: 'var(--text-1)', fontWeight: 500 }}>
                  {idleLabel(state.settings.idleHours)} idle
                </span>
              </div>
              <div className="quick-set-row">
                <span className="k">Default grouping</span>
                <div className="seg" style={{ height: 24 }}>
                  <button
                    className={state.settings.defaultGroup === 'date' ? 'on' : ''}
                    onClick={() => setState(s => ({ ...s, settings: { ...s.settings, defaultGroup: 'date' } }))}>
                    By date
                  </button>
                  <button
                    className={state.settings.defaultGroup === 'domain' ? 'on' : ''}
                    onClick={() => setState(s => ({ ...s, settings: { ...s.settings, defaultGroup: 'domain' } }))}>
                    By domain
                  </button>
                </div>
              </div>
              <div className="quick-set-row">
                <span className="k">Reassurance line</span>
                <div className={'switch ' + (showRelief ? 'on' : '')}
                     onClick={() => setS({ showRelief: !showRelief })} />
              </div>
            </div>
          </div>
          <div className="ob-footer">
            <div className="ob-dots"><span /><span className="on" /></div>
            <button className="btn ghost" onClick={() => setScreen('onboard-1')}>Back</button>
            <button className="btn accent" onClick={() => { completeOnboarding(); setScreen('main'); }}>Get started</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────

  if (screen === 'empty') {
    return (
      <div className="popup">
        <div className="p-header">
          <div className="p-header-row">
            <div className="brand"><div className="brand-mark">N</div>Nestab</div>
            <span className="count-tag"><b>0</b> saved</span>
            <button className="icon-btn" onClick={() => setScreen('settings')} title="Settings"><Icon.Settings /></button>
          </div>
          <div className="relief-line">
            <span className="pulse" />
            Watching quietly in the background.
          </div>
        </div>
        <div className="empty">
          <div className="empty-mark">
            <div className="ripple" />
            <Icon.Sparkle />
          </div>
          <h2>All clear.</h2>
          <p>
            Keep browsing normally. After{' '}
            <span className="tag-inline">{idleLabel(state.settings.idleHours)}</span>{' '}
            of sitting idle, any tab quietly lands here. No buttons to press.
          </p>
        </div>
      </div>
    );
  }

  // ── Settings ─────────────────────────────────────────────────────────────────

  if (screen === 'settings') {
    return (
      <SettingsScreen
        settings={state.settings}
        showRelief={showRelief}
        onSave={(draft) => {
          setState(s => ({ ...s, settings: draft }));
          persistSettings(draft);
          pushToast({ kind: 'saved', title: 'Settings saved' });
          setScreen('main');
        }}
        onBack={() => setScreen('main')}
        onStats={() => setScreen('stats')}
        onToggleRelief={() => setS({ showRelief: !showRelief })}
      />
    );
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────

  if (screen === 'stats') {
    return (
      <StatsScreen
        totalTabs={tabs.length + removed.size}
        onBack={() => setScreen('main')}
      />
    );
  }

  // ── Main (+ search) ──────────────────────────────────────────────────────────

  return (
    <div className="popup">
      <div className="p-header">
        <div className="p-header-row">
          <div className="brand">
            <div className="brand-mark">N</div>
            Nestab
          </div>
          <button className="icon-btn" onClick={() => setScreen('settings')} title="Settings">
            <Icon.Settings />
          </button>
        </div>
      </div>

      <div className="p-subbar">
        <div className="p-subbar-row">
          <div className="search-input">
            <Icon.Search />
            <input
              value={query}
              onChange={(e) => setS({ query: e.target.value })}
              placeholder="Search saved tabs…"
            />
            {query
              ? <button className="row-action-btn" style={{ width: 18, height: 18 }} onClick={() => setS({ query: '' })}><Icon.Close /></button>
              : <span className="kbd">⌘K</span>
            }
          </div>
          <div className="seg">
            <button className={group === 'date' ? 'on' : ''} onClick={() => setS({ group: 'date' })}>Date</button>
            <button className={group === 'domain' ? 'on' : ''} onClick={() => setS({ group: 'domain' })}>Domain</button>
          </div>
        </div>
        <div className="sub-actions">
          <button
            className={'icon-btn ' + (selectMode ? 'is-active' : '')}
            onClick={() => setS({ selectMode: !selectMode, selectedIds: new Set() })}
            title={selectMode ? 'Exit select' : 'Multi-select'}
          >
            <Icon.Check />
          </button>
          <button className={'icon-btn' + (refreshing ? ' spinning' : '')} onClick={handleRefresh} title="Refresh">
            <Icon.Refresh />
          </button>
          {showRelief && (
            <div className="relief-line">
              <span className="pulse" />
              <span><b>{totalLive} tabs</b> safe — freed <span className="freed">{freedGb(totalLive)} GB</span> of memory.</span>
            </div>
          )}
        </div>
      </div>

      <div className="scroller">
        {groups.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12.5 }}>
            <div style={{ fontWeight: 500, color: 'var(--text-1)', fontSize: 13.5, marginBottom: 6 }}>
              No matches for "{query}"
            </div>
            <div>Try a different word, or a domain like "github.com".</div>
          </div>
        ) : groups.map(g => (
          <div key={g.key}>
            <div className="group-head">
              <span className="gh-label">{g.label}</span>
              <span className="gh-rule" />
              <span className="gh-count">{g.items.length}</span>
            </div>
            {g.items.map(t => (
              <Row
                key={t.id}
                tab={t}
                selected={selectedIds.has(t.id)}
                selectMode={selectMode}
                leaving={leavingIds.has(t.id)}
                onClick={() => selectMode ? toggleSelect(t) : handleReopen(t)}
                onReopen={() => handleReopen(t)}
                onDismiss={() => handleDismiss(t)}
              />
            ))}
          </div>
        ))}
      </div>

      {!selectMode && showRelief && (
        <div className="p-footer">
          <span className="pulse" />
          <span>Your computer is running freer.</span>
          <span className="p-footer-spacer" />
          <button className="link-btn" onClick={() => setScreen('stats')}>
            <Icon.Stats />
            Stats
          </button>
        </div>
      )}

      {!selectMode && toasts.length > 0 && (
        <div className="toast-stack">
          {toasts.map(toast => toast.kind === 'saved' ? (
            <div key={toast.id} className="toast toast-saved">
              <div className="toast-saved-icon">
                <Icon.Check />
              </div>
              <div className="grow">
                <div className="tt">{toast.title}</div>
              </div>
            </div>
          ) : (
            <div key={toast.id} className="toast">
              <Favicon domain={toast.domain || 'example.com'} />
              <div className="grow">
                <div className="tt">
                  {toast.kind === 'reopen' ? 'Reopened' : 'Dismissed'}
                  {' · '}
                  {toast.title}
                </div>
                <div className="ts">{toast.domain}</div>
              </div>
              <button onClick={() => undoToast(toast)}>Undo</button>
              <div className="timebar" />
            </div>
          ))}
        </div>
      )}

      {selectMode && (
        <div className="bulk-bar">
          <span className="count">{selectedIds.size} selected</span>
          <span className="grow" />
          <button onClick={exitSelect}>Cancel</button>
          <button onClick={bulkDismiss}><Icon.Trash /> Dismiss</button>
          <button className="primary" onClick={bulkReopen}><Icon.ExternalLink /> Reopen all</button>
        </div>
      )}
    </div>
  );
}