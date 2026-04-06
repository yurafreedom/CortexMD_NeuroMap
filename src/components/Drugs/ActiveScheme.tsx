'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { DRUGS } from '../../data/drugs';
import { realD } from '../../lib/pharmacology';
import type { ActiveDrugs } from '../../lib/pharmacology';

interface ActiveSchemeProps {
  activeDrugs: ActiveDrugs;
  onRemove: (id: string) => void;
  onUpdateDose: (id: string, dose: number) => void;
}

function getActiveWarning(drug: typeof DRUGS[string], dose: number): string | null {
  if (!drug.warnings) return null;
  const thresholds = Object.keys(drug.warnings)
    .map(Number)
    .sort((a, b) => b - a);
  for (const th of thresholds) {
    if (dose >= th) return drug.warnings[th];
  }
  return null;
}

export default function ActiveScheme({
  activeDrugs,
  onRemove,
  onUpdateDose,
}: ActiveSchemeProps) {
  const t = useTranslations('dashboard');
  const ids = Object.keys(activeDrugs);

  if (ids.length === 0) {
    return (
      <div id="active-scheme">
        <div className="empty-scheme">{t('addFromCatalog')}</div>
      </div>
    );
  }

  // Check for CYP-adjusted real doses exceeding maxDose across all drugs
  const cypAlerts: Array<{ drugId: string; realDose: number; maxDose: number }> = [];
  ids.forEach((id) => {
    const d = DRUGS[id];
    if (!d || !d.maxDose) return;
    const rd = realD(id, activeDrugs);
    if (rd && rd >= d.maxDose && Math.abs(rd - activeDrugs[id]) > 1) {
      cypAlerts.push({ drugId: id, realDose: rd, maxDose: d.maxDose });
    }
  });

  return (
    <div id="active-scheme">
      {/* CYP real-dose alerts */}
      {cypAlerts.length > 0 && (
        <div className="cyp-alerts">
          {cypAlerts.map((a) => {
            const d = DRUGS[a.drugId];
            return (
              <div key={a.drugId} className="cyp-alert">
                ⛔ {t('realDose')}{d.brand || d.s} ~{Math.round(a.realDose)}{d.u} (CYP2D6). {t('realDoseMax')}
              </div>
            );
          })}
        </div>
      )}

      <div className="scheme-grid">
        {ids.map((id) => {
          const d = DRUGS[id];
          if (!d) return null;
          const dose = activeDrugs[id];
          const rd = realD(id, activeDrugs);
          const hasWarn = d.warnDose !== undefined && dose >= d.warnDose;
          const isDanger = d.maxDose !== undefined && dose >= d.maxDose;
          const mn = d.doses[0];
          const mx = d.doses[d.doses.length - 1];
          const step = d.doses.length > 1 ? d.doses[1] - d.doses[0] : 1;
          const sliderColor = isDanger ? '#ef4444' : hasWarn ? '#f59e0b' : undefined;
          const warningMsg = getActiveWarning(d, dose);

          return (
            <div className="scheme-card-wrap" key={id}>
              <div className={`scheme-card${isDanger ? ' scheme-danger' : hasWarn ? ' scheme-warn' : ''}`}>
                <div className="scheme-header">
                  <div style={{ flex: 1 }}>
                    <div className="scheme-brand">
                      {d.brand || d.s}
                    </div>
                    <div className="scheme-generic">{d.n}</div>
                  </div>
                  <button
                    className="scheme-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(id);
                    }}
                    title={t('remove')}
                  >
                    &times;
                  </button>
                </div>
                <div className="scheme-dose" style={isDanger ? { color: '#ef4444' } : hasWarn ? { color: '#f59e0b' } : undefined}>
                  <span>{dose}</span>{' '}
                  <span className="scheme-unit">{d.u}</span>
                </div>
                {rd && Math.abs(rd - dose) > 1 && (
                  <div className="dose-real">
                    {t('realDose')}{Math.round(rd)}{d.u}
                  </div>
                )}
                {warningMsg && (
                  <div className={`scheme-warn-text${isDanger ? ' danger' : ''}`}>
                    {warningMsg}
                  </div>
                )}
                <input
                  type="range"
                  className="scheme-slider"
                  min={mn}
                  max={mx}
                  step={step}
                  value={dose}
                  style={sliderColor ? { accentColor: sliderColor } : undefined}
                  onChange={(e) => onUpdateDose(id, parseFloat(e.target.value))}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
