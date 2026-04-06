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

  return (
    <div id="active-scheme">
      <div className="scheme-grid">
        {ids.map((id) => {
          const d = DRUGS[id];
          if (!d) return null;
          const dose = activeDrugs[id];
          const rd = realD(id, activeDrugs);
          const hasWarn = d.warnDose !== undefined && dose >= d.warnDose;
          const mn = d.doses[0];
          const mx = d.doses[d.doses.length - 1];
          const step = d.doses.length > 1 ? d.doses[1] - d.doses[0] : 1;

          return (
            <div className="scheme-card-wrap" key={id}>
              <div className="scheme-card">
                <div className="scheme-header">
                  <div style={{ flex: 1 }}>
                    <div className="scheme-brand">
                      {(d as any).brand || d.s}
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
                <div className="scheme-dose">
                  <span>{dose}</span>{' '}
                  <span className="scheme-unit">{d.u}</span>
                </div>
                {rd && Math.abs(rd - dose) > 1 && (
                  <div className="scheme-real-dose">
                    {t('realDose')}{Math.round(rd)}
                    {d.u}
                  </div>
                )}
                {hasWarn && <div className="scheme-warning">{'\u26A0'}</div>}
                {hasWarn && d.warnText && (
                  <div className="scheme-warn-text">{d.warnText}</div>
                )}
                <input
                  type="range"
                  className="scheme-slider"
                  min={mn}
                  max={mx}
                  step={step}
                  value={dose}
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
