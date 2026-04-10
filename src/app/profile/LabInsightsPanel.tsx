'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Activity, Brain, Flame, AlertTriangle } from 'lucide-react';
import { LAB_REFERENCES, flagLabResult, FLAG_COLORS, FLAG_LABELS } from '@/data/labReferenceRanges';
import type { LabFlag } from '@/data/labReferenceRanges';
import { calculateInflammatoryLoad } from '@/lib/indicators/inflammatoryLoad';
import type { InflammatoryMarker } from '@/lib/indicators/inflammatoryLoad';
import { calculateHPAStatus } from '@/lib/indicators/hpaAxis';

interface LabInsightsPanelProps {
  labResults: Record<string, unknown>[];
}

export default function LabInsightsPanel({ labResults }: LabInsightsPanelProps) {
  const t = useTranslations('labInsights');

  // Parse and flag all results
  const flaggedResults = useMemo(() => {
    return labResults.map(r => {
      const name = r.test_name as string;
      const value = Number(r.value);
      const flag = flagLabResult(name, value);
      const ref = LAB_REFERENCES[name];
      return { name, value, unit: r.unit as string, flag, ref, taken_at: r.taken_at as string };
    });
  }, [labResults]);

  // Inflammatory load
  const inflammatoryLoad = useMemo(() => {
    const markers: InflammatoryMarker[] = [];
    for (const r of labResults) {
      const name = r.test_name as string;
      const ref = LAB_REFERENCES[name];
      if (ref?.inflammatory) {
        markers.push({ name, value: Number(r.value) });
      }
    }
    return calculateInflammatoryLoad(markers);
  }, [labResults]);

  // HPA axis
  const hpaResult = useMemo(() => {
    let cortisol_am: number | undefined;
    let dhea_s: number | undefined;
    for (const r of labResults) {
      if (r.test_name === 'Cortisol (AM)') cortisol_am = Number(r.value);
      if (r.test_name === 'DHEA-S') dhea_s = Number(r.value);
    }
    return calculateHPAStatus({ cortisol_am, dhea_s });
  }, [labResults]);

  // Abnormal results
  const abnormal = useMemo(() =>
    flaggedResults.filter(r => r.flag !== 'normal' && r.flag !== 'optimal'),
    [flaggedResults]
  );

  if (labResults.length === 0) {
    return (
      <div style={{
        background: 'var(--glass)', border: '1px dashed var(--glass-border)',
        borderRadius: 12, padding: '32px 24px', textAlign: 'center',
        color: 'var(--text-muted)', fontSize: 13,
      }}>
        {t('noData')}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {/* Inflammatory Load */}
        <div style={{
          background: 'var(--glass)', border: '1px solid var(--glass-border)',
          borderRadius: 12, padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Flame size={16} color={inflammatoryLoad.zone.color} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('inflammatoryLoad')}
            </span>
          </div>
          <div style={{
            fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-mono)',
            color: inflammatoryLoad.zone.color, lineHeight: 1,
          }}>
            {inflammatoryLoad.score.toFixed(0)}
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: inflammatoryLoad.zone.color, marginTop: 4 }}>
            {t(`inflam_${inflammatoryLoad.zone.label.toLowerCase()}`)}
          </div>
          {/* Progress bar */}
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${inflammatoryLoad.score}%`,
              background: inflammatoryLoad.zone.color, borderRadius: 2,
            }} />
          </div>
          {inflammatoryLoad.missingMarkers.length > 0 && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
              {t('missing')}: {inflammatoryLoad.missingMarkers.join(', ')}
            </div>
          )}
        </div>

        {/* HPA Axis */}
        <div style={{
          background: 'var(--glass)', border: '1px solid var(--glass-border)',
          borderRadius: 12, padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Brain size={16} color={hpaResult.color} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('hpaAxis')}
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: hpaResult.color, marginBottom: 4 }}>
            {t(`hpa_${hpaResult.status}`)}
          </div>
          {hpaResult.ratio != null && (
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Cortisol/DHEA-S: {hpaResult.ratio.toFixed(3)}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {hpaResult.ratioInterpretation}
          </div>
        </div>

        {/* Abnormal Count */}
        <div style={{
          background: 'var(--glass)', border: '1px solid var(--glass-border)',
          borderRadius: 12, padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Activity size={16} color={abnormal.length > 3 ? '#ef4444' : abnormal.length > 0 ? '#f59e0b' : '#22c55e'} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('flaggedResults')}
            </span>
          </div>
          <div style={{
            fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-mono)',
            color: abnormal.length > 3 ? '#ef4444' : abnormal.length > 0 ? '#f59e0b' : '#22c55e',
            lineHeight: 1,
          }}>
            {abnormal.length}
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/{flaggedResults.length}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {t('outOfRange')}
          </div>
        </div>
      </div>

      {/* Inflammatory marker detail */}
      {inflammatoryLoad.markers.length > 0 && (
        <div style={{
          background: 'var(--glass)', border: '1px solid var(--glass-border)',
          borderRadius: 12, padding: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            {t('inflammatoryMarkers')}
          </div>
          {inflammatoryLoad.markers.map(m => (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 100 }}>{m.name}</span>
              <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${m.score}%`,
                  background: m.score > 50 ? '#ef4444' : m.score > 20 ? '#f59e0b' : '#22c55e',
                  borderRadius: 2,
                }} />
              </div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: 40, textAlign: 'right' }}>
                {m.score.toFixed(0)}%
              </span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
            {inflammatoryLoad.zone.recommendation}
          </div>
        </div>
      )}

      {/* Abnormal results with psych notes */}
      {abnormal.length > 0 && (
        <div style={{
          background: 'var(--glass)', border: '1px solid var(--glass-border)',
          borderRadius: 12, padding: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            {t('abnormalFindings')}
          </div>
          {abnormal.map((r, i) => (
            <div key={i} style={{
              padding: '8px 12px', marginBottom: 6,
              background: `${FLAG_COLORS[r.flag]}10`,
              border: `1px solid ${FLAG_COLORS[r.flag]}30`,
              borderRadius: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {r.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: FLAG_COLORS[r.flag], fontWeight: 600 }}>
                    {r.value} {r.unit}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 600, padding: '2px 6px',
                    borderRadius: 4, color: FLAG_COLORS[r.flag],
                    background: `${FLAG_COLORS[r.flag]}20`,
                    textTransform: 'uppercase',
                  }}>
                    {FLAG_LABELS[r.flag]}
                  </span>
                </div>
              </div>
              {r.ref && (
                <>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {t('refRange')}: {r.ref.ref_low ?? '—'}–{r.ref.ref_high ?? '—'} {r.unit}
                    {r.ref.optimal_low != null && ` (${t('optimal')}: ${r.ref.optimal_low}–${r.ref.optimal_high})`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                    {r.ref.psych_note}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* All results flagged table */}
      <div style={{
        background: 'var(--glass)', border: '1px solid var(--glass-border)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('allResults')} ({flaggedResults.length})
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              {[t('test'), t('result'), t('range'), t('status')].map(h => (
                <th key={h} style={{
                  padding: '6px 12px', textAlign: 'left', fontSize: 10,
                  fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flaggedResults.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '6px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {r.name}
                </td>
                <td style={{ padding: '6px 12px', fontFamily: 'var(--font-mono)', color: FLAG_COLORS[r.flag] }}>
                  {r.value} {r.unit}
                </td>
                <td style={{ padding: '6px 12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {r.ref ? `${r.ref.ref_low ?? ''}–${r.ref.ref_high ?? ''}` : '—'}
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <span style={{
                    fontSize: 9, fontWeight: 600, padding: '2px 6px',
                    borderRadius: 4, color: FLAG_COLORS[r.flag],
                    background: `${FLAG_COLORS[r.flag]}15`,
                    textTransform: 'uppercase',
                  }}>
                    {FLAG_LABELS[r.flag]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
