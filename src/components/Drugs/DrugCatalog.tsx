'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { DRUGS } from '../../data/drugs';
import { DCAT } from '../../data/presets';
import type { ActiveDrugs } from '../../lib/pharmacology';
import { Z } from '@/styles/zIndex';

interface DrugCatalogProps {
  activeDrugs: ActiveDrugs;
  onAdd: (id: string) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export default function DrugCatalog({ activeDrugs, onAdd, isModal, onClose }: DrugCatalogProps) {
  const t = useTranslations('dashboard');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const filteredIds = useMemo(() => {
    let ids = Object.keys(DRUGS);
    if (category !== 'all') {
      const cat = DCAT[category];
      if (cat && cat.d) {
        ids = ids.filter((id) => cat.d!.includes(id));
      }
    }
    if (search) {
      const sq = search.toLowerCase();
      ids = ids.filter((id) => {
        const d = DRUGS[id];
        return (
          d.n.toLowerCase().includes(sq) ||
          d.s.toLowerCase().includes(sq) ||
          id.toLowerCase().includes(sq) ||
          (d.brand && d.brand.toLowerCase().includes(sq))
        );
      });
    }
    return ids;
  }, [search, category]);

  const handleAdd = useCallback(
    (id: string) => {
      if (activeDrugs.hasOwnProperty(id)) return;
      onAdd(id);
      if (isModal && onClose) onClose();
    },
    [activeDrugs, onAdd, isModal, onClose]
  );

  const content = (
    <>
      {/* Search */}
      <div style={{ padding: isModal ? '0 24px' : 0, position: 'sticky', top: 0, zIndex: 2, background: isModal ? 'var(--bg-elevated)' : 'transparent', paddingTop: isModal ? 16 : 0, paddingBottom: 8 }}>
        <input
          className="dsearch"
          type="text"
          placeholder={t('searchDrug')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus={isModal}
          style={isModal ? { fontSize: 14, padding: '10px 14px' } : undefined}
        />
        {/* Category tabs */}
        <div className="dtabs" style={isModal ? { gap: 4 } : undefined}>
          {Object.keys(DCAT).map((k) => (
            <div
              key={k}
              className={`dtab${category === k ? ' act' : ''}`}
              onClick={() => setCategory(k)}
              style={isModal ? { fontSize: 11, padding: '5px 10px' } : undefined}
            >
              {DCAT[k].l}
            </div>
          ))}
        </div>
      </div>

      {/* Drug grid */}
      <div style={isModal ? { padding: '0 24px 24px', flex: 1, overflowY: 'auto' } : undefined}>
        <div style={isModal ? {
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12,
        } : undefined} className={isModal ? undefined : 'dg'}>
          {filteredIds.map((id) => {
            const d = DRUGS[id];
            const inScheme = activeDrugs.hasOwnProperty(id);

            if (isModal) {
              // Modal item: richer card
              const targets = Object.keys(d.ki || {}).slice(0, 4).join(', ');
              return (
                <div
                  key={id}
                  onClick={() => handleAdd(id)}
                  style={{
                    padding: '12px 16px', borderRadius: 10, cursor: inScheme ? 'default' : 'pointer',
                    background: inScheme ? 'rgba(96,165,250,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${inScheme ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    opacity: inScheme ? 0.5 : 1,
                    transition: 'all 200ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: inScheme ? d.c : 'transparent',
                      border: `2px solid ${d.c}`,
                      flexShrink: 0,
                    }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {d.brand || d.s}
                    </span>
                    {inScheme && <span style={{ fontSize: 9, color: '#60a5fa', marginLeft: 'auto' }}>\u2713 {t('added')}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{d.n}</div>
                  {targets && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {targets}
                    </div>
                  )}
                </div>
              );
            }

            // Inline (non-modal) item
            return (
              <div
                key={id}
                className={`di${inScheme ? ' in-scheme' : ''}`}
                style={{ '--c': d.c } as React.CSSProperties}
                onClick={() => handleAdd(id)}
                title={d.n + (inScheme ? ` (${t('added')})` : '')}
              >
                <div
                  className="ddt"
                  style={
                    inScheme
                      ? { background: 'var(--c)', boxShadow: '0 0 8px var(--c)' }
                      : undefined
                  }
                />
                <span>{d.s}</span>
              </div>
            );
          })}
        </div>
        <div className="disclaimer">
          {t('disclaimer')}<br />{t('disclaimerWarning')}
        </div>
      </div>
    </>
  );

  // Modal mode
  if (isModal) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: Z.modal,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
      >
        <div style={{
          width: 'min(960px, 92vw)', height: 'min(720px, 85vh)',
          background: 'var(--bg-elevated)', borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            height: 56, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 600, color: '#f0f2f5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('drugCatalog')}
            </span>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: '#5a6478', fontSize: 22, cursor: 'pointer',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6,
            }}>&times;</button>
          </div>
          {content}
        </div>
      </div>
    );
  }

  // Inline mode (legacy)
  return (
    <div id="catalog-section" className="open">
      {content}
    </div>
  );
}
