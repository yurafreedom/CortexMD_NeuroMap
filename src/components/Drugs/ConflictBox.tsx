'use client';

import React, { useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { DRUGS } from '../../data/drugs';
import { cypVal, realD } from '../../lib/pharmacology';
import { detectConflicts } from '../../data/conflictRules';
import type { ActiveDrugs } from '../../lib/pharmacology';
import WarningCard, { type WarningSeverity } from '../Warnings/WarningCard';

interface ConflictItem {
  severity: WarningSeverity;
  title: string;
  description: string;
  zones: string[];
}

interface ConflictBoxProps {
  activeDrugs: ActiveDrugs;
  onConflictHover?: (zones: string[]) => void;
  onConflictLeave?: () => void;
}

export default function ConflictBox({ activeDrugs, onConflictHover, onConflictLeave }: ConflictBoxProps) {
  const t = useTranslations('conflicts');

  const { critical, warnings } = useMemo(() => {
    const cr: ConflictItem[] = [];
    const w: ConflictItem[] = [];
    const AD = activeDrugs;

    // Rule-based conflicts
    const ruleConflicts = detectConflicts(AD);
    for (const rule of ruleConflicts) {
      if (rule.severity === 'critical') {
        cr.push({
          severity: 'critical',
          title: rule.title,
          description: rule.description,
          zones: rule.zones,
        });
      } else {
        w.push({
          severity: 'warning',
          title: rule.title,
          description: rule.description,
          zones: rule.zones,
        });
      }
    }

    // Inline-only checks (sigma1, CYP, NET, progesterone)
    const s1inv = Object.keys(AD).some((d) => DRUGS[d]?.s1t === 'inv');
    const s1ag = Object.keys(AD).filter((d) => DRUGS[d]?.s1t === 'ag');
    if (s1inv && s1ag.length > 0) {
      w.push({
        severity: 'warning',
        title: 'σ1',
        description: t('sigma1Conflict'),
        zones: ['dlPFC', 'hippo', 'amygdala'],
      });
    }
    if (AD.progesterone !== undefined && s1ag.length > 0) {
      w.push({
        severity: 'warning',
        title: 'σ1',
        description: t('progesteroneSigma1'),
        zones: ['dlPFC', 'hippo'],
      });
    }
    const netDrugs = [
      'bupropion', 'duloxetine', 'atomoxetine', 'desipramine', 'nortriptyline',
      'protriptyline', 'reboxetine', 'milnacipran', 'levomilnacipran', 'venlafaxine',
    ].filter((d) => AD[d] !== undefined);
    if (netDrugs.length >= 3) {
      w.push({
        severity: 'warning',
        title: 'NET',
        description: t('tripleNet', { count: netDrugs.length }),
        zones: ['lc', 'dlPFC', 'amygdala'],
      });
    }
    const cy = cypVal(AD);
    if (cy > 0) {
      const cyps: string[] = [];
      Object.keys(AD).forEach((id) => {
        const d = DRUGS[id];
        if (d && d.cyp2d6s) {
          const r = realD(id, AD);
          if (r !== AD[id]) cyps.push(`${d.s}→${r.toFixed(0)}${d.u}`);
        }
      });
      if (AD.atomoxetine) cyps.push(`АТОМ→${realD('atomoxetine', AD).toFixed(0)}мг`);
      if (AD.vortioxetine) cyps.push(`ВОРТ→${realD('vortioxetine', AD).toFixed(0)}мг`);
      if (cyps.length) {
        w.push({
          severity: 'warning',
          title: 'CYP2D6',
          description: `${t('cyp2d6Inhibition', { percent: cy })} ${cyps.join(', ')}`,
          zones: ['dlPFC', 'nac'],
        });
      }
    }

    return { critical: cr, warnings: w };
  }, [activeDrugs, t]);

  const handleEnter = useCallback((zones: string[]) => {
    onConflictHover?.(zones);
  }, [onConflictHover]);

  const handleLeave = useCallback(() => {
    onConflictLeave?.();
  }, [onConflictLeave]);

  if (critical.length === 0 && warnings.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {critical.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#ef4444',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontFamily: 'var(--font-mono)',
              marginBottom: 4,
              paddingLeft: 2,
            }}
          >
            {t('criticalTitle')} ({critical.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {critical.map((item, i) => (
              <WarningCard
                key={`cr-${i}`}
                severity="critical"
                title={item.title}
                description={item.description}
                onMouseEnter={() => handleEnter(item.zones)}
                onMouseLeave={handleLeave}
              />
            ))}
          </div>
        </div>
      )}
      {warnings.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#f59e0b',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontFamily: 'var(--font-mono)',
              marginBottom: 4,
              paddingLeft: 2,
            }}
          >
            {t('warningsTitle')} ({warnings.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {warnings.map((item, i) => (
              <WarningCard
                key={`w-${i}`}
                severity="warning"
                title={item.title}
                description={item.description}
                onMouseEnter={() => handleEnter(item.zones)}
                onMouseLeave={handleLeave}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
