'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { DRUGS } from '../../data/drugs';
import { RG, NTC } from '../../data/brainRegions';
import { defCov, defTotalCov, covCol } from '../../lib/coverage';
import type { Deficit, DeficitStatus } from '../../data/defaultDeficits';
import type { ActiveDrugs } from '../../lib/pharmacology';

interface DeficitCardProps {
  deficit: Deficit;
  activeDrugs: ActiveDrugs;
  isSelected: boolean;
  onSelect: () => void;
  onStatusChange: (status: DeficitStatus) => void;
  onDelete: () => void;
  onZoneClick: (zoneId: string) => void;
  onZoneHover: (zoneId: string | null) => void;
}

export default function DeficitCard({
  deficit,
  activeDrugs,
  isSelected,
  onSelect,
  onStatusChange,
  onDelete,
  onZoneClick,
  onZoneHover,
}: DeficitCardProps) {
  const t = useTranslations();
  const df = deficit;
  const isExp = isSelected;

  const tc = useMemo(() => defTotalCov(df, activeDrugs), [df, activeDrugs]);
  const cc = covCol(tc);
  const covs = useMemo(() => defCov(df, activeDrugs), [df, activeDrugs]);

  // Blockers
  const blockers = useMemo(() => {
    const result: string[] = [];
    df.needs.forEach((n) => {
      (n.blockedBy || []).forEach((bid) => {
        if (activeDrugs[bid] !== undefined && !result.includes(bid)) {
          result.push(bid);
        }
      });
    });
    return result;
  }, [df, activeDrugs]);

  // NT badges
  const ntBadges = useMemo(() => {
    const nts: Record<string, boolean> = {};
    df.defs.forEach((d) => { nts[d.nt] = true; });
    return Object.keys(nts).map((nt) => {
      const col = NTC[nt === 's1' ? 's1' : nt] || '#999';
      return (
        <span
          key={nt}
          style={{
            display: 'inline-block',
            fontSize: '8px',
            padding: '1px 4px',
            borderRadius: '3px',
            background: col + '22',
            color: col,
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {nt}{'\u2193'}
        </span>
      );
    });
  }, [df.defs]);

  return (
    <div
      className={`dc ${df.status}${isSelected ? ' sel' : ''}${isExp ? ' exp' : ''}`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="dc-head">
        <span className="dc-icon">{df.icon}</span>
        <span className="dc-name">{df.st}</span>
        <span className={`dc-status ${df.status}`} />
      </div>

      {/* Zone chips */}
      <div className="dc-zones">
        {df.zones.map((z) => {
          const rg = RG[z];
          if (!rg) return null;
          return (
            <span
              key={z}
              className="zc"
              onMouseEnter={() => onZoneHover(z)}
              onMouseLeave={() => onZoneHover(null)}
              onClick={(e) => {
                e.stopPropagation();
                onZoneClick(z);
              }}
            >
              {rg.n}
            </span>
          );
        })}
      </div>

      {/* Coverage bar */}
      <div className="dc-cov">
        <div className="dc-cbar">
          <div
            className="dc-cfill"
            style={{ width: `${tc}%`, background: cc }}
          />
        </div>
        <span className="dc-cpct" style={{ color: cc }}>
          {tc}%
        </span>
        <span className="dc-cnts">{ntBadges}</span>
      </div>

      {/* Blocking warnings */}
      {blockers.length > 0 && (
        <div className="dc-block">
          {'\u26A0'} {t('dashboard.blocks')}:{' '}
          {blockers.map((id) => DRUGS[id]?.s || id).join(', ')}
        </div>
      )}

      {/* Expanded body */}
      <div className="dc-body">
        <div className="dc-desc">{df.desc}</div>

        {/* Deficits section */}
        <div className="dc-sec">{t('deficits.deficits')}</div>
        {df.defs.map((d, i) => {
          const rg = RG[d.zone];
          const zn = rg ? rg.n : d.zone;
          const ntc = NTC[d.nt === 's1' ? 's1' : d.nt] || '#999';
          return (
            <div key={i} className="dc-def">
              <div className="dc-def-title" style={{ color: ntc }}>
                {d.nt} в {zn}
              </div>
              <div className="dc-def-mech">{d.mech}</div>
              {d.src && <div className="dc-def-src">{d.src}</div>}
            </div>
          );
        })}

        {/* Coverage details */}
        <div className="dc-sec">{t('deficits.schemeCoverage')}</div>
        {covs.map((c, i) => {
          if (c.np) {
            return (
              <div key={i} className="dc-need-np">
                {c.target}: {c.desc}
              </div>
            );
          }
          const cc2 = covCol(c.cov);
          return (
            <div key={i} className="dc-need">
              <div className="dc-need-title">{c.target}</div>
              <div className="dc-need-bar">
                <div className="dc-need-fill">
                  <div style={{ width: `${c.cov}%`, background: cc2 }} />
                </div>
                <span className="dc-need-pct" style={{ color: cc2 }}>
                  {c.cov}%
                </span>
              </div>
              {c.covering.length > 0 && (
                <div className="dc-need-drugs">
                  {c.covering.map((id) => DRUGS[id]?.s || id).join(', ')}
                </div>
              )}
              {c.blocking.length > 0 && (
                <div className="dc-need-block">
                  {'\u26A0'} {t('dashboard.blocks')}:{' '}
                  {c.blocking.map((id) => DRUGS[id]?.s || id).join(', ')}
                </div>
              )}
            </div>
          );
        })}

        {/* AI placeholder */}
        <div className="dc-ai">
          <div className="dc-ai-text">
            {t('deficits.aiAnalysisComingSoon')}
          </div>
        </div>

        {/* Footer */}
        <div className="dc-foot">
          <select
            className="dc-stsel"
            value={df.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onStatusChange(e.target.value as DeficitStatus)}
          >
            <option value="critical">{t('deficits.critical')}</option>
            <option value="working">{t('deficits.working')}</option>
            <option value="resolved">{t('deficits.resolved')}</option>
          </select>
          <span
            className="dc-del"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            {'\u{1F5D1}'} {t('common.delete')}
          </span>
        </div>
      </div>
    </div>
  );
}
