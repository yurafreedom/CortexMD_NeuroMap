'use client';

import React, { useMemo } from 'react';
import { gH, hCol, hSt, cypVal } from '../../lib/pharmacology';
import type { ActiveDrugs } from '../../lib/pharmacology';

interface BottomBarProps {
  activeDrugs: ActiveDrugs;
}

interface BarItem {
  key: string;
  label: string;
  nt?: string;
  isCyp?: boolean;
}

const BARS: BarItem[] = [
  { key: 'da', label: 'Дофамин (DA)', nt: 'DA' },
  { key: 'na', label: 'Норадреналин (NA)', nt: 'NA' },
  { key: '5ht', label: 'Серотонин (5-HT)', nt: '5-HT' },
  { key: 's1', label: 'Пластичность (s1)', nt: 's1' },
  { key: 'cyp', label: 'CYP2D6', isCyp: true },
];

export default function BottomBar({ activeDrugs }: BottomBarProps) {
  const hasActive = Object.keys(activeDrugs).length > 0;

  const barData = useMemo(() => {
    return BARS.map((bar) => {
      if (bar.isCyp) {
        const cy = cypVal(activeDrugs);
        const cc = cy > 60 ? '#ef4444' : cy > 30 ? '#f59e0b' : '#22c55e';
        return { ...bar, value: cy, color: cc, width: cy };
      }
      const v = hasActive ? gH(bar.nt!, activeDrugs) : 65;
      const c = hCol(v);
      return { ...bar, value: v, color: c, width: Math.min(100, v / 2) };
    });
  }, [activeDrugs, hasActive]);

  return (
    <div className="bottom-bar-wrap">
      <div id="bb">
        {barData.map((bar) => (
          <div className="hb" key={bar.key}>
            <div className="hl">{bar.label}</div>
            <div className="hv" style={{ color: bar.color }}>
              {bar.isCyp ? `${bar.value}%` : `${bar.value.toFixed(0)}%`}
            </div>
            <div className="hbar">
              <div
                className="hfill"
                style={{
                  width: `${bar.width}%`,
                  background: bar.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
