'use client';

import React, { useState, useCallback } from 'react';
import { PRESETS } from '../../data/presets';
import ActiveScheme from '../Drugs/ActiveScheme';
import DrugCatalog from '../Drugs/DrugCatalog';
import DeficitList from '../Deficits/DeficitList';
import ProfileMenu from '../Header/ProfileMenu';
import type { Deficit, DeficitStatus } from '../../data/defaultDeficits';
import type { ActiveDrugs } from '../../lib/pharmacology';

interface LeftPanelProps {
  activeDrugs: ActiveDrugs;
  onAddDrug: (id: string) => void;
  onRemoveDrug: (id: string) => void;
  onUpdateDose: (id: string, dose: number) => void;
  onApplyPreset: (presetId: string) => void;
  deficits: Deficit[];
  selectedDeficit: string | null;
  onSelectDeficit: (id: string) => void;
  onDeficitStatusChange?: (id: string, status: DeficitStatus) => void;
  onDeficitDelete?: (id: string) => void;
  onOpacityChange: (value: number) => void;
  onZoneClick?: (zoneId: string) => void;
  onZoneHover?: (zoneId: string | null) => void;
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
  deficits,
  selectedDeficit,
  onSelectDeficit,
  onDeficitStatusChange,
  onDeficitDelete,
  onOpacityChange,
  onZoneClick,
  onZoneHover,
}: LeftPanelProps) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const schemeCount = Object.keys(activeDrugs).length;

  const handleOpacity = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onOpacityChange(parseInt(e.target.value, 10));
    },
    [onOpacityChange]
  );

  return (
    <div id="lp">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <div className="logo" style={{ textAlign: 'left', padding: '4px 0 0' }}>CortexMD</div>
          <div className="sub" style={{ textAlign: 'left', marginBottom: 0 }}>{'\u041D\u0435\u0439\u0440\u043E\u0444\u0430\u0440\u043C\u0430\u043A\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043A\u0430\u0440\u0442\u0430 v4'}</div>
        </div>
        <ProfileMenu />
      </div>

      {/* Presets */}
      <Section title="Пресеты">
        <div className="pl">
          {Object.keys(PRESETS).map((id) => (
            <button
              key={id}
              className="pb"
              onClick={() => onApplyPreset(id)}
            >
              {PRESETS[id].l}
            </button>
          ))}
        </div>
      </Section>

      {/* Active scheme */}
      <div className="section">
        <div className="sh">
          <span className="st">Активная схема</span>
          <span
            style={{
              fontSize: '9px',
              color: 'var(--text-muted)',
              marginLeft: 'auto',
            }}
          >
            {schemeCount > 0 ? `${schemeCount} шт` : ''}
          </span>
        </div>
        <div className="sb open" style={{ display: 'block' }}>
          <ActiveScheme
            activeDrugs={activeDrugs}
            onRemove={onRemoveDrug}
            onUpdateDose={onUpdateDose}
          />
        </div>
        <button
          className="catalog-toggle-btn"
          onClick={() => setCatalogOpen(!catalogOpen)}
        >
          Каталог препаратов{' '}
          <span>{catalogOpen ? '\u25B2' : '\u25BC'}</span>
        </button>
        {catalogOpen && (
          <DrugCatalog activeDrugs={activeDrugs} onAdd={onAddDrug} />
        )}
      </div>

      {/* Deficits */}
      <Section title="Мои дефициты">
        <DeficitList
          deficits={deficits}
          activeDrugs={activeDrugs}
          selectedDeficit={selectedDeficit}
          onSelect={onSelectDeficit}
          onStatusChange={onDeficitStatusChange || (() => {})}
          onDelete={onDeficitDelete || (() => {})}
          onZoneClick={onZoneClick}
          onZoneHover={onZoneHover}
        />
      </Section>

      {/* Visualization */}
      <Section title="Визуализация">
        <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '3px' }}>
          Прозрачность коры
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
