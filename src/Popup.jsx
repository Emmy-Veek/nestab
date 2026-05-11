/* Tab Saver — popup screens */

import React, { useState, useMemo, useCallback } from 'react';
import { persistSavedTabs, persistSettings, completeOnboarding, reopenTab } from './storage.js';

// ── Icons ────────────────────────────────────────────────────────────────────

export const Icon = {
  Search: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5 14 14" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.1" />
      <path d="M13.1 9.6a5.6 5.6 0 0 0 0-3.2l1.3-1-1.4-2.4-1.5.6a5.6 5.6 0 0 0-2.8-1.6l-.2-1.6H6.5l-.2 1.6a5.6 5.6 0 0 0-2.8 1.6l-1.5-.6L.6 3.4l1.3 1a5.6 5.6 0 0 0 0 3.2l-1.3 1 1.4 2.4 1.5-.6a5.6 5.6 0 0 0 2.8 1.6l.2 1.6h2.9l.2-1.6a5.6 5.6 0 0 0 2.8-1.6l1.5.6 1.4-2.4z" />
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
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function faviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

function timeAgo(savedAt, unit) {
  if (unit === 'hours') return savedAt === 1 ? '1h ago' : `${savedAt}h ago`;
  if (savedAt === 1) return '1d ago';
  return `${savedAt}d ago`;
}

function bucketFor(tab) {
  if (tab.unit === 'hours') return 'today';
  if (tab.savedAt === 1) return 'yesterday';
  if (tab.savedAt <= 3) return 'earlier';
  if (tab.savedAt <= 7) return 'thisweek';
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
          <span className="time">{timeAgo(tab.savedAt, tab.unit)}</span>
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

// ── Popup ─────────────────────────────────────────────────────────────────────

export default function Popup({ screen, setScreen, state, setState }) {
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
    setState(s => ({ ...s, toasts: [...s.toasts, { id, ...toast }] }));
    setTimeout(() => {
      setState(s => ({ ...s, toasts: s.toasts.filter(x => x.id !== id) }));
    }, 4500);
  }, [setState]);

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
            <h2 className="ob-headline">Tab Saver is watching quietly.</h2>
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
                  {state.settings.idleDays} day{state.settings.idleDays === 1 ? '' : 's'} idle
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
            <div className="brand"><div className="brand-mark">T</div>Tab Saver</div>
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
            <span className="tag-inline">{state.settings.idleDays} days</span>{' '}
            of sitting idle, any tab quietly lands here. No buttons to press.
          </p>
        </div>
      </div>
    );
  }

  // ── Settings ─────────────────────────────────────────────────────────────────

  if (screen === 'settings') {
    const updateSetting = (key, val) => {
      setState(s => {
        const settings = { ...s.settings, [key]: val };
        persistSettings(settings);
        return { ...s, settings };
      });
    };
    return (
      <div className="popup settings">
        <div className="p-header">
          <div className="p-header-row">
            <button className="icon-btn" onClick={() => setScreen('main')} title="Back"><Icon.ArrowLeft /></button>
            <div className="brand" style={{ flex: 1 }}>Settings</div>
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
                <div className="set-slider">
                  <input type="range" min="1" max="14" step="1"
                         value={state.settings.idleDays}
                         onChange={(e) => updateSetting('idleDays', +e.target.value)} />
                  <span className="value-pill">
                    {state.settings.idleDays} day{state.settings.idleDays === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
              <div className="set-row">
                <div className="set-body">
                  <div className="set-key">Skip pinned tabs</div>
                  <div className="set-help">Never collect tabs you've pinned in Chrome.</div>
                </div>
                <div className={'switch ' + (state.settings.skipPinned ? 'on' : '')}
                     onClick={() => updateSetting('skipPinned', !state.settings.skipPinned)} />
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
                  <button className={state.settings.defaultGroup === 'date' ? 'on' : ''}
                          onClick={() => updateSetting('defaultGroup', 'date')}>By date</button>
                  <button className={state.settings.defaultGroup === 'domain' ? 'on' : ''}
                          onClick={() => updateSetting('defaultGroup', 'domain')}>By domain</button>
                </div>
              </div>
              <div className="set-row">
                <div className="set-body">
                  <div className="set-key">Reassurance line</div>
                  <div className="set-help">Show the "running freer" message in the footer.</div>
                </div>
                <div className={'switch ' + (showRelief ? 'on' : '')}
                     onClick={() => setS({ showRelief: !showRelief })} />
              </div>
            </div>
          </div>

          <div className="set-group">
            <div className="set-group-label">Stats</div>
            <div className="set-card">
              <div className="set-row">
                <div className="set-body">
                  <div className="set-key">Saved all-time</div>
                  <div className="set-help">Across this device, since you installed Tab Saver.</div>
                </div>
                <div style={{ fontFamily: 'var(--geist-mono)', fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>
                  {tabs.length + removed.size} tabs
                </div>
              </div>
              <div className="set-row">
                <div className="set-body">
                  <div className="set-key">Memory recovered</div>
                  <div className="set-help">Estimated, based on average tab footprint.</div>
                </div>
                <div style={{ fontFamily: 'var(--geist-mono)', fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>
                  {freedGb(tabs.length + removed.size)} GB
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main (+ search) ──────────────────────────────────────────────────────────

  return (
    <div className="popup">
      <div className="p-header">
        <div className="p-header-row">
          <div className="brand">
            <div className="brand-mark">T</div>
            Tab Saver
          </div>
          <span className="count-tag"><b>{totalLive}</b> resting</span>
          <button
            className={'icon-btn ' + (selectMode ? 'is-active' : '')}
            onClick={() => setS({ selectMode: !selectMode, selectedIds: new Set() })}
            title={selectMode ? 'Exit select' : 'Multi-select'}
          >
            <Icon.Check />
          </button>
          <button className="icon-btn" onClick={() => setScreen('settings')} title="Settings">
            <Icon.Settings />
          </button>
        </div>
        {showRelief && (
          <div className="relief-line">
            <span className="pulse" />
            <span><b>{totalLive} tabs</b> safe — freed <span className="freed">{freedGb(totalLive)} GB</span> of memory.</span>
          </div>
        )}
      </div>

      <div className="p-subbar">
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
          <button className="link-btn" onClick={() => setScreen('settings')}>Settings</button>
        </div>
      )}

      {!selectMode && toasts.length > 0 && (
        <div className="toast-stack">
          {toasts.map(toast => (
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