'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import DrugCatalog from '../Drugs/DrugCatalog';
import type { ActiveDrugs } from '../../lib/pharmacology';

interface LeftPanelProps {
  activeDrugs: ActiveDrugs;
  onAddDrug: (id: string) => void;
  onRemoveDrug: (id: string) => void;
  onUpdateDose: (id: string, dose: number) => void;
  onApplyPreset: (drugs: ActiveDrugs) => void;
}

export default function LeftPanel({
  activeDrugs,
  onAddDrug,
  onRemoveDrug,
  onUpdateDose,
  onApplyPreset,
}: LeftPanelProps) {
  const t = useTranslations();
  const [catalogOpen, setCatalogOpen] = useState(false);

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
        <span>{'▼'}</span>
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
