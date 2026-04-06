'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { DRUGS } from '../../data/drugs';
import { cypVal, realD } from '../../lib/pharmacology';
import type { ActiveDrugs } from '../../lib/pharmacology';

interface ConflictBoxProps {
  activeDrugs: ActiveDrugs;
}

export default function ConflictBox({ activeDrugs }: ConflictBoxProps) {
  const t = useTranslations('conflicts');

  const { critical, warnings } = useMemo(() => {
    const cr: string[] = [];
    const c: string[] = [];
    const AD = activeDrugs;

    const ssris = ['sertraline', 'escitalopram', 'fluoxetine', 'fluvoxamine'];
    const snris = ['duloxetine', 'venlafaxine', 'desvenlafaxine', 'milnacipran', 'levomilnacipran'];
    const seroAll = [...ssris, ...snris];
    const hasSSRI = ssris.some((d) => AD[d] !== undefined);

    if (
      (AD.dextromethorphan !== undefined || AD.auvelity !== undefined) &&
      seroAll.some((d) => AD[d] !== undefined)
    ) {
      cr.push(`<span style="color:#ef4444">${t('dxmSsri')}</span>`);
    }
    if (
      AD.selegiline_oral !== undefined &&
      (AD.dextromethorphan !== undefined || AD.auvelity !== undefined)
    ) {
      cr.push(`<span style="color:#ef4444">${t('selegilineDxm')}</span>`);
    }
    if (AD.mucuna !== undefined && AD.selegiline_oral !== undefined) {
      cr.push(`<span style="color:#ef4444">${t('mucunaMaoi')}</span>`);
    }

    if (AD.selegiline_oral !== undefined && hasSSRI) {
      c.push('\u26A0\uFE0F ' + t('selegilineSsri'));
    }
    if (AD.sertraline && AD.bupropion) {
      c.push(t('sert5ht2c'));
    }
    const s1inv = Object.keys(AD).some((d) => DRUGS[d]?.s1t === 'inv');
    const s1ag = Object.keys(AD).filter((d) => DRUGS[d]?.s1t === 'ag');
    if (s1inv && s1ag.length > 0) {
      c.push('\u26A1 ' + t('sigma1Conflict'));
    }
    if (AD.progesterone !== undefined && s1ag.length > 0) {
      c.push('\u26A0\uFE0F ' + t('progesteroneSigma1'));
    }
    const netDrugs = [
      'bupropion', 'duloxetine', 'atomoxetine', 'desipramine', 'nortriptyline',
      'protriptyline', 'reboxetine', 'milnacipran', 'levomilnacipran', 'venlafaxine',
    ].filter((d) => AD[d] !== undefined);
    if (netDrugs.length >= 3) {
      c.push(`\u26A0\uFE0F ${t('tripleNet', { count: netDrugs.length })}`);
    }
    const cy = cypVal(AD);
    if (cy > 0) {
      let cs = t('cyp2d6Inhibition', { percent: cy });
      const cyps: string[] = [];
      Object.keys(AD).forEach((id) => {
        const d = DRUGS[id];
        if (d && d.cyp2d6s) {
          const r = realD(id, AD);
          if (r !== AD[id]) cyps.push(`${d.s}\u2192${r.toFixed(0)}${d.u}`);
        }
      });
      if (AD.atomoxetine) cyps.push(`АТОМ\u2192${realD('atomoxetine', AD).toFixed(0)}мг`);
      if (AD.vortioxetine) cyps.push(`ВОРТ\u2192${realD('vortioxetine', AD).toFixed(0)}мг`);
      if (cyps.length) c.push(cs + cyps.join(', '));
    }
    if (AD.bupropion && (AD.aripiprazole || AD.brexpiprazole)) {
      c.push('\u26A0\uFE0F ' + t('halfDoseWarning'));
    }
    if (AD.modafinil && AD.cariprazine) {
      c.push('\u26A0\uFE0F ' + t('modafinilCariprazine'));
    }
    if (AD.fluvoxamine && (AD.lamotrigine || AD.duloxetine)) {
      c.push('\u26A0\uFE0F ' + t('fluvoxamineInteraction'));
    }
    if (AD.same && hasSSRI) {
      c.push(t('sameSsri'));
    }
    if (AD.pramipexole !== undefined && AD.cariprazine !== undefined) {
      c.push(t('pramCariprazine'));
    }
    if (AD.fluoxetine && Object.keys(AD).length > 2) {
      c.push(t('fluoxetineWarning'));
    }

    return { critical: cr, warnings: c };
  }, [activeDrugs, t]);

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
                className="ci"
                dangerouslySetInnerHTML={{ __html: item }}
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
              <div key={i} className="ci">
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
