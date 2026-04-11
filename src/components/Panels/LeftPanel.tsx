'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import DrugCatalog from '../Drugs/DrugCatalog';
import type { ActiveDrugs } from '../../lib/pharmacology';

interface LeftPanelProps {
  activeDrugs: ActiveDrugs;
  onAddDrug: (id: string) => void;
  onRemoveDrug: (id: string) => void;
  onUpdateDose: (id: string, dose: number) => void;
  onApplyPreset: (drugs: ActiveDrugs) => void;
  onOpacityChange: (value: number) => void;
}

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section">
      <div className="sh" onClick={() => setOpen(!open)}>
        <span className="st">{title}</span>
        <span className={`sa${open ? ' open' : ''}`}>
          <span /><span /><span />
        </span>
      </div>
      <div className={`sb${open ? ' open' : ''}`} style={open ? { display: 'block' } : undefined}>
        {children}
      </div>
    </div>
  );
}

export default function LeftPanel({
  activeDrugs,
  onAddDrug,
  onRemoveDrug,
  onUpdateDose,
  onApplyPreset,
  onOpacityChange,
}: LeftPanelProps) {
  const t = useTranslations();
  const [catalogOpen, setCatalogOpen] = useState(false);

  const handleOpacity = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onOpacityChange(parseInt(e.target.value, 10));
    },
    [onOpacityChange],
  );

  const schemeCount = Object.keys(activeDrugs).length;

  return (
    <div id="lp">
      <div style={{ marginBottom: 4 }}>
        <div className="logo" style={{ textAlign: 'left', padding: '4px 0 0' }}>CortexMD</div>
        <div className="sub" style={{ textAlign: 'left', marginBottom: 0 }}>{t('dashboard.subtitle')}</div>
      </div>

      {/* Scheme Selection — opens as modal */}
      <button
        className="catalog-toggle-btn"
        style={{ borderRadius: 'var(--radius-md)', marginBottom: 8, border: '1px solid var(--glass-border)' }}
        onClick={() => setCatalogOpen(true)}
      >
        {t('dashboard.drugCatalog')}{' '}
        {schemeCount > 0 && (
          <span style={{ opacity: 0.6, fontSize: '0.85em' }}>({schemeCount})</span>
        )}{' '}
        <span>{'\u25BC'}</span>
      </button>
      {catalogOpen && (
        <DrugCatalog
          activeDrugs={activeDrugs}
          onAdd={onAddDrug}
          onRemove={onRemoveDrug}
          onUpdateDose={onUpdateDose}
          onApplyPreset={onApplyPreset}
          isModal
          onClose={() => setCatalogOpen(false)}
        />
      )}

      {/* Visualization */}
      <Section title={t('dashboard.visualization')}>
        <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '3px' }}>
          {t('dashboard.cortexOpacity')}
        </div>
        <input
          type="range"
          style={{ width: '100%', accentColor: '#64748b' }}
          min={0}
          max={100}
          defaultValue={18}
          onChange={handleOpacity}
        />
      </Section>

      <div
        style={{
          marginTop: '6px',
          fontSize: '7px',
          color: '#1e293b',
          textAlign: 'center',
        }}
      >
        Meshy.ai CC BY 4.0
      </div>
    </div>
  );
}
