'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import DrugCatalog from '../Drugs/DrugCatalog';
import type { ActiveDrugs } from '../../lib/pharmacology';

interface LeftPanelProps {
  activeDrugs: ActiveDrugs;
  onAddDrug: (id: string) => void;
  onRemoveDrug: (id: string) => void;
  onUpdateDose: (id: string, dose: number) => void;
  onApplyPreset: (drugs: ActiveDrugs) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function LeftPanel({
  activeDrugs,
  onAddDrug,
  onRemoveDrug,
  onUpdateDose,
  onApplyPreset,
  collapsed,
  onToggleCollapsed,
}: LeftPanelProps) {
  const t = useTranslations();
  const [catalogOpen, setCatalogOpen] = useState(false);

  const schemeCount = Object.keys(activeDrugs).length;

  if (collapsed) {
    return (
      <div
        id="lp"
        style={{
          padding: '10px 6px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <button
          onClick={onToggleCollapsed}
          title={t('dashboard.expandPanel')}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1px solid var(--glass-border)',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
          }}
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => setCatalogOpen(true)}
          title={t('dashboard.drugCatalog')}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1px solid var(--glass-border)',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            position: 'relative',
          }}
        >
          <LayoutGrid size={16} />
          {schemeCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 8,
                background: '#60a5fa',
                color: '#080b12',
                fontSize: 9,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              {schemeCount}
            </span>
          )}
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
      </div>
    );
  }

  return (
    <div id="lp">
      <div
        style={{
          marginBottom: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div className="logo" style={{ textAlign: 'left', padding: '4px 0 0' }}>CortexMD</div>
        <button
          onClick={onToggleCollapsed}
          title={t('dashboard.collapsePanel')}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: '1px solid var(--glass-border)',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={14} />
        </button>
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
