'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { DRUGS_V2 } from '@/data/drugs.v2';

interface TreatmentEntry {
  drug_id: string;
  dose_mg: string;
  started_at: string;
  ended_at: string;
  reason_for_change: string;
  effectiveness: string;
  side_effects: string;
}

const EMPTY_ENTRY: TreatmentEntry = {
  drug_id: '',
  dose_mg: '',
  started_at: '',
  ended_at: '',
  reason_for_change: '',
  effectiveness: '',
  side_effects: '',
};

interface TreatmentHistoryFormProps {
  existingHistory: Record<string, unknown>[];
}

export default function TreatmentHistoryForm({ existingHistory }: TreatmentHistoryFormProps) {
  const t = useTranslations('treatmentForm');
  const [entry, setEntry] = useState<TreatmentEntry>({ ...EMPTY_ENTRY });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const drugList = useMemo(() =>
    Object.values(DRUGS_V2)
      .map(d => ({ id: d.id, name: d.generic_name, brand: d.brand_name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const set = useCallback(<K extends keyof TreatmentEntry>(key: K, value: TreatmentEntry[K]) => {
    setEntry(prev => ({ ...prev, [key]: value }));
    setStatus('idle');
  }, []);

  const handleSave = useCallback(async () => {
    if (!entry.drug_id || !entry.dose_mg || !entry.started_at) return;
    setSaving(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/profile/treatment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drug_id: entry.drug_id,
          dose_mg: Number(entry.dose_mg),
          started_at: entry.started_at,
          ended_at: entry.ended_at || null,
          reason_for_change: entry.reason_for_change || null,
          effectiveness: entry.effectiveness ? Number(entry.effectiveness) : null,
          side_effects: entry.side_effects
            ? entry.side_effects.split(',').map(s => s.trim()).filter(Boolean)
            : null,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setStatus('success');
      setEntry({ ...EMPTY_ENTRY });
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  }, [entry]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: 12,
    fontFamily: 'var(--font-body)',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 8,
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 4,
    display: 'block',
  };

  return (
    <div>
      <h2 style={{
        fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-display)',
        marginBottom: 8,
        background: 'linear-gradient(135deg, #60a5fa, #818cf8)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        {t('title')}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
        {t('description')}
      </p>

      {/* Entry form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>{t('drug')}</label>
          <select
            value={entry.drug_id}
            onChange={e => set('drug_id', e.target.value)}
            style={selectStyle}
          >
            <option value="">{t('selectDrug')}</option>
            {drugList.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.brand})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>{t('doseMg')}</label>
          <input
            type="number"
            step="any"
            value={entry.dose_mg}
            onChange={e => set('dose_mg', e.target.value)}
            placeholder="50"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>{t('startDate')}</label>
          <input
            type="date"
            value={entry.started_at}
            onChange={e => set('started_at', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>{t('endDate')}</label>
          <input
            type="date"
            value={entry.ended_at}
            onChange={e => set('ended_at', e.target.value)}
            style={inputStyle}
          />
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            {t('endDateHint')}
          </div>
        </div>
        <div>
          <label style={labelStyle}>{t('effectiveness')}</label>
          <select
            value={entry.effectiveness}
            onChange={e => set('effectiveness', e.target.value)}
            style={selectStyle}
          >
            <option value="">{t('notRated')}</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <option key={n} value={n}>{n}/10</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>{t('reasonForChange')}</label>
          <input
            value={entry.reason_for_change}
            onChange={e => set('reason_for_change', e.target.value)}
            placeholder={t('reasonPlaceholder')}
            style={inputStyle}
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>{t('sideEffects')}</label>
          <input
            value={entry.side_effects}
            onChange={e => set('side_effects', e.target.value)}
            placeholder={t('sideEffectsPlaceholder')}
            style={inputStyle}
          />
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            {t('sideEffectsHint')}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <button
          onClick={handleSave}
          disabled={saving || !entry.drug_id || !entry.dose_mg || !entry.started_at}
          style={{
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #60a5fa, #818cf8)',
            border: 'none', borderRadius: 8,
            cursor: saving ? 'wait' : 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
            color: '#fff', display: 'flex', alignItems: 'center', gap: 8,
            opacity: saving || !entry.drug_id || !entry.dose_mg ? 0.5 : 1,
          }}
        >
          <Plus size={14} /> {saving ? t('saving') : t('addEntry')}
        </button>
        {status === 'success' && (
          <span style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={14} /> {t('saved')}
          </span>
        )}
        {status === 'error' && (
          <span style={{ fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={14} /> {t('saveError')}
          </span>
        )}
      </div>

      {/* Timeline */}
      {existingHistory.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('timeline')} ({existingHistory.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {existingHistory.map((h, i) => {
              const drug = DRUGS_V2[h.drug_id as string];
              const eff = h.effectiveness as number | null;
              return (
                <div key={i} style={{
                  background: 'var(--glass)', border: '1px solid var(--glass-border)',
                  borderRadius: 10, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <div style={{
                    width: 4, height: 40, borderRadius: 2,
                    background: drug?.color || 'var(--text-muted)',
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {drug?.generic_name || h.drug_id as string}
                      <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        {h.dose_mg as number}mg
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {h.started_at as string} — {(h.ended_at as string) || t('ongoing')}
                      {typeof h.reason_for_change === 'string' && h.reason_for_change && (
                        <span style={{ marginLeft: 8, color: 'var(--text-secondary)' }}>
                          ({h.reason_for_change})
                        </span>
                      )}
                    </div>
                  </div>
                  {eff != null && (
                    <div style={{
                      fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)',
                      color: eff >= 7 ? '#22c55e' : eff >= 4 ? '#f59e0b' : '#ef4444',
                    }}>
                      {eff}<span style={{ fontSize: 10, color: 'var(--text-muted)' }}>/10</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
