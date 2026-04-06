'use client';

import React from 'react';
import { DRUGS } from '../../data/drugs';
import { realD, cypVal } from '../../lib/pharmacology';
import type { ActiveDrugs } from '../../lib/pharmacology';

interface DoseSliderProps {
  drugId: string;
  currentDose: number;
  color: string;
  activeDrugs: ActiveDrugs;
  onChange: (dose: number) => void;
}

export default function DoseSlider({
  drugId,
  currentDose,
  color,
  activeDrugs,
  onChange,
}: DoseSliderProps) {
  const drug = DRUGS[drugId];
  if (!drug) return null;

  const mn = drug.doses[0];
  const mx = drug.doses[drug.doses.length - 1];
  const step = drug.doses.length > 1 ? drug.doses[1] - drug.doses[0] : 1;
  const rd = realD(drugId, activeDrugs);
  const hasWarn = drug.warnDose !== undefined && currentDose >= drug.warnDose;
  const isDanger = drug.maxDose !== undefined && currentDose >= drug.maxDose;

  return (
    <div className="dr show" style={{ '--c': color } as React.CSSProperties}>
      <div className="dval">
        {currentDose} {drug.u}
      </div>
      <input
        type="range"
        min={mn}
        max={mx}
        step={step}
        value={currentDose}
        style={{ accentColor: color }}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <div className="dinfo">
        <span>
          {mn}–{mx} {drug.u}
        </span>
        {rd && Math.abs(rd - currentDose) > 1 && (
          <span style={{ color: 'var(--accent)' }}>
            реально ~{Math.round(rd)}
            {drug.u}
          </span>
        )}
      </div>
      {hasWarn && drug.warnText && (
        <div className={`dwarn show${isDanger ? ' danger' : ''}`}>
          {drug.warnText}
        </div>
      )}
    </div>
  );
}
