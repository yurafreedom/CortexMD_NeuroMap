'use client';

import React, { useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { DRUGS } from '../../data/drugs';
import { cypVal, realD } from '../../lib/pharmacology';
import { detectConflicts } from '../../data/conflictRules';
import type { ActiveDrugs } from '../../lib/pharmacology';

interface ConflictItem {
  text: string;
  zones: string[];
  isHtml?: boolean;
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

    // Use rule-based detection for conflicts with zone data
    const ruleConflicts = detectConflicts(AD);
    for (const rule of ruleConflicts) {
      const item: ConflictItem = { text: rule.description, zones: rule.zones };
      if (rule.severity === 'critical') {
        item.text = `<span style="color:#ef4444">⛔ ${rule.title}: ${rule.description}</span>`;
        item.isHtml = true;
        cr.push(item);
      } else if (rule.severity === 'serious') {
        item.text = `⚠️ ${rule.title}: ${rule.description}`;
        w.push(item);
      } else {
        item.text = `${rule.title}: ${rule.description}`;
        w.push(item);
      }
    }

    // Inline-only checks (sigma1, CYP, NET, progesterone) — not in conflictRules.ts
    const s1inv = Object.keys(AD).some((d) => DRUGS[d]?.s1t === 'inv');
    const s1ag = Object.keys(AD).filter((d) => DRUGS[d]?.s1t === 'ag');
    if (s1inv && s1ag.length > 0) {
      w.push({ text: '⚡ ' + t('sigma1Conflict'), zones: ['dlPFC', 'hippo', 'amygdala'] });
    }
    if (AD.progesterone !== undefined && s1ag.length > 0) {
      w.push({ text: '⚠️ ' + t('progesteroneSigma1'), zones: ['dlPFC', 'hippo'] });
    }
    const netDrugs = [
      'bupropion', 'duloxetine', 'atomoxetine', 'desipramine', 'nortriptyline',
      'protriptyline', 'reboxetine', 'milnacipran', 'levomilnacipran', 'venlafaxine',
    ].filter((d) => AD[d] !== undefined);
    if (netDrugs.length >= 3) {
      w.push({ text: `⚠️ ${t('tripleNet', { count: netDrugs.length })}`, zones: ['lc', 'dlPFC', 'amygdala'] });
    }
    const cy = cypVal(AD);
    if (cy > 0) {
      let cs = t('cyp2d6Inhibition', { percent: cy });
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
      if (cyps.length) w.push({ text: cs + cyps.join(', '), zones: ['dlPFC', 'nac'] });
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
    <div id="cfb">
      {critical.length > 0 && (
        <div className="cb">
          <div className="cb-inner">
            <div className="cbt" style={{ color: '#ef4444' }}>
              {t('criticalTitle')} ({critical.length})
            </div>
            {critical.map((item, i) => (
              <div
                key={i}
                className="ci ci-hoverable"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => handleEnter(item.zones)}
                onMouseLeave={handleLeave}
                {...(item.isHtml ? { dangerouslySetInnerHTML: { __html: item.text } } : { children: item.text })}
              />
            ))}
          </div>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="cb" style={{ background: 'linear-gradient(160deg,rgba(245,158,11,0.3),rgba(245,158,11,0.05),rgba(245,158,11,0.18))' }}>
          <div className="cb-inner">
            <div className="cbt">{t('warningsTitle')} ({warnings.length})</div>
            {warnings.map((item, i) => (
              <div
                key={i}
                className="ci ci-hoverable"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => handleEnter(item.zones)}
                onMouseLeave={handleLeave}
              >
                {item.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
