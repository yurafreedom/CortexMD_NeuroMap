'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Save, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

const COMMON_TESTS = [
  { name: 'TSH', unit: 'mIU/L', range: '0.4–4.0' },
  { name: 'Free T4', unit: 'ng/dL', range: '0.8–1.8' },
  { name: 'Free T3', unit: 'pg/mL', range: '2.3–4.2' },
  { name: 'Cortisol (AM)', unit: 'µg/dL', range: '6–23' },
  { name: 'DHEA-S', unit: 'µg/dL', range: '35–430' },
  { name: 'Testosterone', unit: 'ng/dL', range: '300–1000' },
  { name: 'Estradiol', unit: 'pg/mL', range: '10–40' },
  { name: 'Prolactin', unit: 'ng/mL', range: '2–18' },
  { name: 'Vitamin D (25-OH)', unit: 'ng/mL', range: '30–100' },
  { name: 'Vitamin B12', unit: 'pg/mL', range: '200–900' },
  { name: 'Folate', unit: 'ng/mL', range: '3–17' },
  { name: 'Ferritin', unit: 'ng/mL', range: '20–250' },
  { name: 'CRP (hs)', unit: 'mg/L', range: '<1.0' },
  { name: 'ESR', unit: 'mm/hr', range: '0–20' },
  { name: 'IL-6', unit: 'pg/mL', range: '<7' },
  { name: 'TNF-α', unit: 'pg/mL', range: '<8.1' },
  { name: 'Homocysteine', unit: 'µmol/L', range: '5–15' },
  { name: 'Lithium level', unit: 'mEq/L', range: '0.6–1.2' },
  { name: 'Valproate level', unit: 'µg/mL', range: '50–100' },
  { name: 'CBC WBC', unit: '×10³/µL', range: '4.5–11.0' },
  { name: 'CBC RBC', unit: '×10⁶/µL', range: '4.5–5.5' },
  { name: 'Hemoglobin', unit: 'g/dL', range: '12–17' },
  { name: 'Glucose (fasting)', unit: 'mg/dL', range: '70–100' },
  { name: 'HbA1c', unit: '%', range: '<5.7' },
  { name: 'ALT', unit: 'U/L', range: '7–56' },
  { name: 'AST', unit: 'U/L', range: '10–40' },
  { name: 'Creatinine', unit: 'mg/dL', range: '0.7–1.3' },
];

interface LabEntry {
  test_name: string;
  value: string;
  unit: string;
  reference_range: string;
  taken_at: string;
  notes: string;
}

const EMPTY_ENTRY: LabEntry = {
  test_name: '',
  value: '',
  unit: '',
  reference_range: '',
  taken_at: new Date().toISOString().split('T')[0],
  notes: '',
};

interface LabResultsFormProps {
  existingResults: Record<string, unknown>[];
}

export default function LabResultsForm({ existingResults }: LabResultsFormProps) {
  const t = useTranslations('labForm');
  const [entry, setEntry] = useState<LabEntry>({ ...EMPTY_ENTRY });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const set = useCallback(<K extends keyof LabEntry>(key: K, value: LabEntry[K]) => {
    setEntry(prev => ({ ...prev, [key]: value }));
    setStatus('idle');
  }, []);

  const applyTemplate = useCallback((test: typeof COMMON_TESTS[number]) => {
    setEntry(prev => ({
      ...prev,
      test_name: test.name,
      unit: test.unit,
      reference_range: test.range,
    }));
    setStatus('idle');
  }, []);

  const handleSave = useCallback(async () => {
    if (!entry.test_name || !entry.value || !entry.unit || !entry.taken_at) return;
    setSaving(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/profile/labs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...entry,
          value: Number(entry.value),
          source: 'manual',
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

      {/* Quick-pick common tests */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('commonTests')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {COMMON_TESTS.map(test => (
            <button
              key={test.name}
              onClick={() => applyTemplate(test)}
              style={{
                padding: '4px 10px', fontSize: 10, borderRadius: 6,
                border: '1px solid var(--glass-border)', background: 'var(--glass)',
                cursor: 'pointer', color: entry.test_name === test.name ? 'var(--accent)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', transition: 'all 0.15s ease',
              }}
            >
              {test.name}
            </button>
          ))}
        </div>
      </div>

      {/* Entry form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>{t('testName')}</label>
          <input
            value={entry.test_name}
            onChange={e => set('test_name', e.target.value)}
            placeholder="e.g. TSH"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>{t('value')}</label>
          <input
            type="number"
            step="any"
            value={entry.value}
            onChange={e => set('value', e.target.value)}
            placeholder="0.00"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>{t('unit')}</label>
          <input
            value={entry.unit}
            onChange={e => set('unit', e.target.value)}
            placeholder="mIU/L"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>{t('referenceRange')}</label>
          <input
            value={entry.reference_range}
            onChange={e => set('reference_range', e.target.value)}
            placeholder="0.4–4.0"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>{t('dateTaken')}</label>
          <input
            type="date"
            value={entry.taken_at}
            onChange={e => set('taken_at', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>{t('notes')}</label>
          <input
            value={entry.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder={t('notesPlaceholder')}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <button
          onClick={handleSave}
          disabled={saving || !entry.test_name || !entry.value}
          style={{
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #60a5fa, #818cf8)',
            border: 'none', borderRadius: 8,
            cursor: saving ? 'wait' : 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
            color: '#fff', display: 'flex', alignItems: 'center', gap: 8,
            opacity: saving || !entry.test_name || !entry.value ? 0.5 : 1,
          }}
        >
          <Plus size={14} /> {saving ? t('saving') : t('addResult')}
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

      {/* Existing results table */}
      {existingResults.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('recentResults')} ({existingResults.length})
          </div>
          <div style={{
            background: 'var(--glass)', border: '1px solid var(--glass-border)',
            borderRadius: 10, overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  {[t('testName'), t('value'), t('unit'), t('referenceRange'), t('dateTaken')].map(h => (
                    <th key={h} style={{
                      padding: '8px 12px', textAlign: 'left', fontSize: 10,
                      fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {existingResults.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '6px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {r.test_name as string}
                    </td>
                    <td style={{ padding: '6px 12px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                      {String(r.value)}
                    </td>
                    <td style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>
                      {r.unit as string}
                    </td>
                    <td style={{ padding: '6px 12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {(r.reference_range as string) || '—'}
                    </td>
                    <td style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>
                      {r.taken_at ? new Date(r.taken_at as string).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
