'use client';

import React, { useMemo } from 'react';
import { DRUGS } from '../../data/drugs';
import { cypVal, realD } from '../../lib/pharmacology';
import type { ActiveDrugs } from '../../lib/pharmacology';

interface ConflictBoxProps {
  activeDrugs: ActiveDrugs;
}

export default function ConflictBox({ activeDrugs }: ConflictBoxProps) {
  const { critical, warnings } = useMemo(() => {
    const cr: string[] = [];
    const c: string[] = [];
    const AD = activeDrugs;

    const ssris = ['sertraline', 'escitalopram', 'fluoxetine', 'fluvoxamine'];
    const snris = ['duloxetine', 'venlafaxine', 'desvenlafaxine', 'milnacipran', 'levomilnacipran'];
    const seroAll = [...ssris, ...snris];
    const hasSSRI = ssris.some((d) => AD[d] !== undefined);

    // CRITICAL: DXM + SSRI/SNRI
    if (
      (AD.dextromethorphan !== undefined || AD.auvelity !== undefined) &&
      seroAll.some((d) => AD[d] !== undefined)
    ) {
      cr.push('<span style="color:#ef4444">⛔ DXM НЕЛЬЗЯ с SSRI/SNRI — серотониновый синдром!</span>');
    }
    // CRITICAL: Selegiline + DXM
    if (
      AD.selegiline_oral !== undefined &&
      (AD.dextromethorphan !== undefined || AD.auvelity !== undefined)
    ) {
      cr.push('<span style="color:#ef4444">⛔ Селегилин ПРОТИВОПОКАЗАН с DXM</span>');
    }
    // CRITICAL: Mucuna + MAOI
    if (AD.mucuna !== undefined && AD.selegiline_oral !== undefined) {
      cr.push('<span style="color:#ef4444">⛔ Мукуна (L-DOPA) + ИМАО = опасно</span>');
    }

    // Selegiline + SSRI caution
    if (AD.selegiline_oral !== undefined && hasSSRI) {
      c.push('\u26A0\uFE0F Селегилин: осторожность с SSRI');
    }
    // Sert + Bupropion
    if (AD.sertraline && AD.bupropion) {
      c.push('Серт 5HT2C \u2192 DA VTA вниз 30-42%');
    }
    // sigma1 conflict
    const s1inv = Object.keys(AD).some((d) => DRUGS[d]?.s1t === 'inv');
    const s1ag = Object.keys(AD).filter((d) => DRUGS[d]?.s1t === 'ag');
    if (s1inv && s1ag.length > 0) {
      c.push('\u26A1 \u03C31-конфликт: инверсный агонист подавляет каскад пластичности');
    }
    // Progesterone
    if (AD.progesterone !== undefined && s1ag.length > 0) {
      c.push('\u26A0\uFE0F Прогестерон — \u03C31-АНТАГОНИСТ. Блокирует \u03C31-агонисты');
    }
    // Triple NET
    const netDrugs = [
      'bupropion', 'duloxetine', 'atomoxetine', 'desipramine', 'nortriptyline',
      'protriptyline', 'reboxetine', 'milnacipran', 'levomilnacipran', 'venlafaxine',
    ].filter((d) => AD[d] !== undefined);
    if (netDrugs.length >= 3) {
      c.push(`\u26A0\uFE0F Тройной+ NET (${netDrugs.length} препаратов) \u2192 NA-перегруз`);
    }
    // CYP2D6
    const cy = cypVal(AD);
    if (cy > 0) {
      let cs = `CYP2D6 ингиб. ${cy}%: `;
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
    // Bupropion + DRPA
    if (AD.bupropion && (AD.aripiprazole || AD.brexpiprazole)) {
      c.push('\u26A0\uFE0F С бупропионом: ПОЛОВИННАЯ доза арипипразола/брексипразола');
    }
    // Modafinil CYP3A4
    if (AD.modafinil && AD.cariprazine) {
      c.push('\u26A0\uFE0F Модафинил CYP3A4 индуктор \u2192 снижает карипразин');
    }
    // Fluvoxamine CYP1A2/2C19
    if (AD.fluvoxamine && (AD.lamotrigine || AD.duloxetine)) {
      c.push('\u26A0\uFE0F Флувоксамин CYP1A2/2C19 \u2192 повышает ламотриджин/дулоксетин');
    }
    // SAMe + SSRI
    if (AD.same && hasSSRI) {
      c.push('SAMe+SSRI: редкий риск серотонинового синдрома');
    }
    // Pramipexole + cariprazine
    if (AD.pramipexole !== undefined && AD.cariprazine !== undefined) {
      c.push('Прам+карипразин: конкуренция D3');
    }
    // Fluoxetine long half-life
    if (AD.fluoxetine && Object.keys(AD).length > 2) {
      c.push('Флуоксетин: Т\u00BD очень длинный, мощный CYP2D6 ингибитор');
    }

    return { critical: cr, warnings: c };
  }, [activeDrugs]);

  if (critical.length === 0 && warnings.length === 0) return null;

  return (
    <div id="cfb">
      {critical.length > 0 && (
        <div
          className="cb"
          style={{ borderColor: '#7f1d1d', background: 'rgba(127,29,29,.2)' }}
        >
          <div className="cbt" style={{ color: '#ef4444' }}>
            КРИТИЧЕСКИЕ ({critical.length})
          </div>
          {critical.map((item, i) => (
            <div
              key={i}
              className="ci"
              dangerouslySetInnerHTML={{ __html: item }}
            />
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="cb">
          <div className="cbt">Предупреждения ({warnings.length})</div>
          {warnings.map((item, i) => (
            <div key={i} className="ci">
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
