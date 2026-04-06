'use client';

import React from 'react';
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
  const ids = Object.keys(activeDrugs);

  if (ids.length === 0) {
    return (
      <div id="active-scheme">
        <div className="empty-scheme">Добавьте препараты из каталога ниже</div>
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
            <div
              className="scheme-card"
              key={id}
              style={{ '--c': d.c } as React.CSSProperties}
            >
              <div className="scheme-header">
                <span className="scheme-dot" style={{ background: d.c }} />
                <span className="scheme-name">{d.s}</span>
                <button
                  className="scheme-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(id);
                  }}
                  title="Убрать"
                >
                  &times;
                </button>
              </div>
              <div className="scheme-dose">
                <span>{dose}</span> {d.u}
              </div>
              {rd && Math.abs(rd - dose) > 1 && (
                <div className="scheme-real-dose">
                  реально ~{Math.round(rd)}
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
                style={{ accentColor: d.c }}
                onChange={(e) => onUpdateDose(id, parseFloat(e.target.value))}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
