'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { DRUGS } from '../../data/drugs';
import { RG } from '../../data/brainRegions';
import type { ActiveDrugs } from '../../lib/pharmacology';

interface ZonePopupProps {
  zoneId: string | null;
  position: { x: number; y: number } | null;
  activeDrugs: ActiveDrugs;
  onClose: () => void;
  onOpenDetail: () => void;
}

export default function ZonePopup({
  zoneId,
  position,
  activeDrugs,
  onClose,
  onOpenDetail,
}: ZonePopupProps) {
  const t = useTranslations();

  const effects = useMemo(() => {
    if (!zoneId) return [];
    const result: Array<{
      drugId: string;
      drug: (typeof DRUGS)[string];
      zoneData: (typeof DRUGS)[string]['z'][string];
    }> = [];
    Object.keys(activeDrugs).forEach((did) => {
      const d = DRUGS[did];
      if (!d || !d.z || !d.z[zoneId]) return;
      result.push({ drugId: did, drug: d, zoneData: d.z[zoneId] });
    });
    return result;
  }, [zoneId, activeDrugs]);

  if (!zoneId || !position) return null;

  const zone = RG[zoneId];
  if (!zone) return null;

  // Position adjustment
  let x = position.x + 20;
  let y = position.y - 30;
  if (typeof window !== 'undefined') {
    if (x + 260 > window.innerWidth - 20) x = position.x - 280;
    if (y + 200 > window.innerHeight - 80) y = window.innerHeight - 280;
    if (x < 0) x = 10;
    if (y < 0) y = 10;
  }

  return (
    <div
      className="zone-popup"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <div className="zone-popup-header">
        <div
          className="zone-popup-dot"
          style={{ background: zone.c, boxShadow: `0 0 8px ${zone.c}` }}
        />
        <div style={{ flex: 1 }}>
          <div className="zone-popup-title">{zone.f}</div>
          <div className="zone-popup-subtitle">{zone.fn}</div>
        </div>
        <button className="zone-popup-close" onClick={onClose}>
          &times;
        </button>
      </div>
      <div className="zone-popup-body">
        {effects.length > 0 ? (
          effects.map((e, i) => {
            const isBad = !!e.zoneData.bad;
            const arrow = isBad ? '\u2193' : '\u2191';
            const cls = isBad ? 'down' : 'up';
            return (
              <div key={i} className="popup-effect">
                <span className={`popup-effect-arrow ${cls}`}>{arrow}</span>
                <span className="popup-effect-name" style={{ color: e.drug.c }}>
                  {e.drug.s}
                </span>
                <span className="popup-effect-detail">
                  {e.zoneData.fx[0]}
                </span>
              </div>
            );
          })
        ) : (
          <div
            style={{
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              fontSize: '11px',
            }}
          >
            {t('dashboard.noActiveDrugsShort')}
          </div>
        )}
      </div>
      <button className="zone-popup-more" onClick={onOpenDetail}>
        {t('common.details')} &rarr;
      </button>
    </div>
  );
}
