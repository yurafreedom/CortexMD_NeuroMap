'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { DRUGS } from '../../data/drugs';
import { RG } from '../../data/brainRegions';
import { defTotalCov, covCol } from '../../lib/coverage';
import ConflictBox from '../Drugs/ConflictBox';
import type { Deficit } from '../../data/defaultDeficits';
import type { ActiveDrugs } from '../../lib/pharmacology';
import RegionalDensityCard from './RegionalDensityCard';

interface RightPanelProps {
  isOpen: boolean;
  selectedRegion: string | null;
  activeDrugs: ActiveDrugs;
  deficits: Deficit[];
  onClose: () => void;
  onToggle: () => void;
  onShowSigma1: () => void;
  onSelectDeficit: (id: string) => void;
  onConflictHover?: (zones: string[]) => void;
  onConflictLeave?: () => void;
}

export default function RightPanel({
  isOpen,
  selectedRegion,
  activeDrugs,
  deficits,
  onClose,
  onToggle,
  onShowSigma1,
  onSelectDeficit,
  onConflictHover,
  onConflictLeave,
}: RightPanelProps) {
  const t = useTranslations();

  const hasConflicts = useMemo(() => {
    const ssris = ['sertraline', 'escitalopram', 'fluoxetine', 'fluvoxamine'];
    const snris = ['duloxetine', 'venlafaxine', 'desvenlafaxine', 'milnacipran', 'levomilnacipran'];
    const seroAll = [...ssris, ...snris];
    const AD = activeDrugs;
    if (
      (AD.dextromethorphan !== undefined || AD.auvelity !== undefined) &&
      seroAll.some((d) => AD[d] !== undefined)
    ) return true;
    if (AD.selegiline_oral !== undefined && (AD.dextromethorphan !== undefined || AD.auvelity !== undefined)) return true;
    if (AD.mucuna !== undefined && AD.selegiline_oral !== undefined) return true;
    if (AD.sertraline && AD.bupropion) return true;
    const s1inv = Object.keys(AD).some((d) => DRUGS[d]?.s1t === 'inv');
    const s1ag = Object.keys(AD).some((d) => DRUGS[d]?.s1t === 'ag');
    if (s1inv && s1ag) return true;
    return false;
  }, [activeDrugs]);

  const zoneEffects = useMemo(() => {
    if (!selectedRegion) return [];
    const result: Array<{
      drugId: string;
      drug: (typeof DRUGS)[string];
      data: (typeof DRUGS)[string]['z'][string];
    }> = [];
    Object.keys(activeDrugs).forEach((d) => {
      const dr = DRUGS[d];
      if (dr && dr.z && dr.z[selectedRegion]) {
        result.push({ drugId: d, drug: dr, data: dr.z[selectedRegion] });
      }
    });
    return result;
  }, [selectedRegion, activeDrugs]);

  const hasS1 = useMemo(() => {
    return Object.keys(activeDrugs).some((d) => DRUGS[d]?.s1t);
  }, [activeDrugs]);

  const relatedDeficits = useMemo(() => {
    if (!selectedRegion) return [];
    return deficits.filter((d) => d.zones.includes(selectedRegion));
  }, [selectedRegion, deficits]);

  const region = selectedRegion ? RG[selectedRegion] : null;

  return (
    <>
      <div id="rp" className={isOpen ? 'open' : ''}>
        <button className="panel-close" onClick={onClose}>
          &times;
        </button>
        <ConflictBox activeDrugs={activeDrugs} onConflictHover={onConflictHover} onConflictLeave={onConflictLeave} />
        <div id="ri">
          {region ? (
            <>
              <div
                className="zone-header-card"
                style={{ background: `${region.c}18` }}
              >
                <div className="zone-header-title">{region.f}</div>
                <div className="zone-header-subtitle">{region.fn}</div>
              </div>

              <RegionalDensityCard
                region={selectedRegion!}
                activeDrugs={activeDrugs}
              />

              {zoneEffects.length > 0 ? (
                <>
                  <div className="panel-section-title">{t('dashboard.activeEffects')}</div>
                  {zoneEffects.map((e, i) => {
                    const isBad = !!e.data.bad;
                    let arrow = isBad ? '↓' : '↑';
                    let cls = isBad ? 'down' : 'up';
                    if (e.data.i <= 1) {
                      arrow = '→';
                      cls = 'neutral';
                    }
                    return (
                      <div key={i} className="panel-effect">
                        <div className={`panel-effect-icon ${cls}`}>
                          {arrow}
                        </div>
                        <span
                          className="panel-effect-drug"
                          style={{ color: e.drug.c }}
                        >
                          {e.drug.s}
                        </span>
                        <span className="panel-effect-desc">
                          {e.data.fx[0]}
                        </span>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    marginTop: '8px',
                    fontStyle: 'italic',
                  }}
                >
                  {t('dashboard.noActiveDrugs')}
                </div>
              )}

              {hasS1 && (
                <div className="cvbtn" onClick={onShowSigma1}>
                  {'σ'}1 {t('dashboard.sigma1Cellular')} {'→'}
                </div>
              )}

              {relatedDeficits.length > 0 && (
                <>
                  <div className="panel-section-title">{t('dashboard.relatedDeficits')}</div>
                  {relatedDeficits.map((d) => {
                    const sc =
                      d.status === 'critical'
                        ? 'var(--status-danger)'
                        : d.status === 'working'
                          ? 'var(--status-warning)'
                          : 'var(--status-optimal)';
                    const tc = defTotalCov(d, activeDrugs);
                    const cc = covCol(tc);
                    return (
                      <div
                        key={d.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 8px',
                          marginBottom: '4px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: 'rgba(255,255,255,0.02)',
                          transition: 'background 0.2s',
                        }}
                        onClick={() => onSelectDeficit(d.id)}
                      >
                        <span style={{ fontSize: '16px' }}>{d.icon}</span>
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-primary)',
                            flex: 1,
                            fontWeight: 500,
                          }}
                        >
                          {d.st}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            color: cc,
                          }}
                        >
                          {tc}%
                        </span>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: sc,
                          }}
                        />
                      </div>
                    );
                  })}
                </>
              )}
            </>
          ) : null}
        </div>
      </div>

      <div
        id="panel-toggle"
        onClick={onToggle}
        style={isOpen ? { right: '340px' } : undefined}
      >
        <span
          className={`badge${hasConflicts ? '' : ' hidden'}`}
          id="panel-badge"
        />
        {t('common.info')}
      </div>
    </>
  );
}
