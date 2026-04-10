'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';

interface GeneticData {
  cyp2d6_phenotype: string;
  cyp2c19_phenotype: string;
  mthfr_c677t: string;
  comt_val158met: string;
  bdnf_val66met: string;
  httlpr_5: string;
  hla_b1502: boolean | null;
  hla_b5701: boolean | null;
  source: string;
}

const EMPTY: GeneticData = {
  cyp2d6_phenotype: '',
  cyp2c19_phenotype: '',
  mthfr_c677t: '',
  comt_val158met: '',
  bdnf_val66met: '',
  httlpr_5: '',
  hla_b1502: null,
  hla_b5701: null,
  source: 'manual',
};

const CYP_OPTIONS = ['', 'PM', 'IM', 'EM', 'UM'];
const MTHFR_OPTIONS = ['', 'CC', 'CT', 'TT'];
const COMT_OPTIONS = ['', 'Val/Val', 'Val/Met', 'Met/Met'];
const BDNF_OPTIONS = ['', 'Val/Val', 'Val/Met', 'Met/Met'];
const HTTLPR_OPTIONS = ['', 'L/L', 'L/S', 'S/S'];
const HLA_OPTIONS = ['', 'true', 'false'];
const SOURCE_OPTIONS = ['manual', '23andme', 'atlas'];

function parseInitial(raw: Record<string, unknown> | null): GeneticData {
  if (!raw) return EMPTY;
  return {
    cyp2d6_phenotype: (raw.cyp2d6_phenotype as string) || '',
    cyp2c19_phenotype: (raw.cyp2c19_phenotype as string) || '',
    mthfr_c677t: (raw.mthfr_c677t as string) || '',
    comt_val158met: (raw.comt_val158met as string) || '',
    bdnf_val66met: (raw.bdnf_val66met as string) || '',
    httlpr_5: (raw.httlpr_5 as string) || '',
    hla_b1502: raw.hla_b1502 != null ? (raw.hla_b1502 as boolean) : null,
    hla_b5701: raw.hla_b5701 != null ? (raw.hla_b5701 as boolean) : null,
    source: (raw.source as string) || 'manual',
  };
}

interface GeneticProfileFormProps {
  initialData: Record<string, unknown> | null;
}

export default function GeneticProfileForm({ initialData }: GeneticProfileFormProps) {
  const t = useTranslations('geneticForm');
  const [form, setForm] = useState<GeneticData>(() => parseInitial(initialData));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const set = useCallback(<K extends keyof GeneticData>(key: K, value: GeneticData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setStatus('idle');
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setStatus('idle');
    try {
      const payload = {
        ...form,
        hla_b1502: form.hla_b1502,
        hla_b5701: form.hla_b5701,
      };
      const res = await fetch('/api/profile/genetics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  }, [form]);

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: 12,
    fontFamily: 'var(--font-body)',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 8,
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 4,
    display: 'block',
  };

  const hintStyle: React.CSSProperties = {
    fontSize: 10,
    color: 'var(--text-muted)',
    marginTop: 3,
    lineHeight: 1.4,
  };

  return (
    <div>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 600,
          fontFamily: 'var(--font-display)',
          marginBottom: 8,
          background: 'linear-gradient(135deg, #60a5fa, #818cf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {t('title')}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
        {t('description')}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          maxWidth: 700,
        }}
      >
        {/* CYP2D6 */}
        <div>
          <label style={labelStyle}>CYP2D6</label>
          <select
            value={form.cyp2d6_phenotype}
            onChange={e => set('cyp2d6_phenotype', e.target.value)}
            style={selectStyle}
          >
            {CYP_OPTIONS.map(o => (
              <option key={o} value={o}>{o || t('notSet')}</option>
            ))}
          </select>
          <div style={hintStyle}>{t('cyp2d6Hint')}</div>
        </div>

        {/* CYP2C19 */}
        <div>
          <label style={labelStyle}>CYP2C19</label>
          <select
            value={form.cyp2c19_phenotype}
            onChange={e => set('cyp2c19_phenotype', e.target.value)}
            style={selectStyle}
          >
            {CYP_OPTIONS.map(o => (
              <option key={o} value={o}>{o || t('notSet')}</option>
            ))}
          </select>
          <div style={hintStyle}>{t('cyp2c19Hint')}</div>
        </div>

        {/* MTHFR */}
        <div>
          <label style={labelStyle}>MTHFR C677T</label>
          <select
            value={form.mthfr_c677t}
            onChange={e => set('mthfr_c677t', e.target.value)}
            style={selectStyle}
          >
            {MTHFR_OPTIONS.map(o => (
              <option key={o} value={o}>{o || t('notSet')}</option>
            ))}
          </select>
          <div style={hintStyle}>{t('mthfrHint')}</div>
        </div>

        {/* COMT */}
        <div>
          <label style={labelStyle}>COMT Val158Met</label>
          <select
            value={form.comt_val158met}
            onChange={e => set('comt_val158met', e.target.value)}
            style={selectStyle}
          >
            {COMT_OPTIONS.map(o => (
              <option key={o} value={o}>{o || t('notSet')}</option>
            ))}
          </select>
          <div style={hintStyle}>{t('comtHint')}</div>
        </div>

        {/* BDNF */}
        <div>
          <label style={labelStyle}>BDNF Val66Met</label>
          <select
            value={form.bdnf_val66met}
            onChange={e => set('bdnf_val66met', e.target.value)}
            style={selectStyle}
          >
            {BDNF_OPTIONS.map(o => (
              <option key={o} value={o}>{o || t('notSet')}</option>
            ))}
          </select>
          <div style={hintStyle}>{t('bdnfHint')}</div>
        </div>

        {/* 5-HTTLPR */}
        <div>
          <label style={labelStyle}>5-HTTLPR</label>
          <select
            value={form.httlpr_5}
            onChange={e => set('httlpr_5', e.target.value)}
            style={selectStyle}
          >
            {HTTLPR_OPTIONS.map(o => (
              <option key={o} value={o}>{o || t('notSet')}</option>
            ))}
          </select>
          <div style={hintStyle}>{t('httlprHint')}</div>
        </div>

        {/* HLA-B*15:02 */}
        <div>
          <label style={labelStyle}>HLA-B*15:02</label>
          <select
            value={form.hla_b1502 === null ? '' : String(form.hla_b1502)}
            onChange={e => {
              const v = e.target.value;
              set('hla_b1502', v === '' ? null : v === 'true');
            }}
            style={selectStyle}
          >
            {HLA_OPTIONS.map(o => (
              <option key={o} value={o}>
                {o === '' ? t('notSet') : o === 'true' ? t('positive') : t('negative')}
              </option>
            ))}
          </select>
          <div style={hintStyle}>{t('hlaB1502Hint')}</div>
        </div>

        {/* HLA-B*57:01 */}
        <div>
          <label style={labelStyle}>HLA-B*57:01</label>
          <select
            value={form.hla_b5701 === null ? '' : String(form.hla_b5701)}
            onChange={e => {
              const v = e.target.value;
              set('hla_b5701', v === '' ? null : v === 'true');
            }}
            style={selectStyle}
          >
            {HLA_OPTIONS.map(o => (
              <option key={o} value={o}>
                {o === '' ? t('notSet') : o === 'true' ? t('positive') : t('negative')}
              </option>
            ))}
          </select>
          <div style={hintStyle}>{t('hlaB5701Hint')}</div>
        </div>
      </div>

      {/* Source */}
      <div style={{ marginTop: 20, maxWidth: 340 }}>
        <label style={labelStyle}>{t('dataSource')}</label>
        <select
          value={form.source}
          onChange={e => set('source', e.target.value)}
          style={selectStyle}
        >
          {SOURCE_OPTIONS.map(o => (
            <option key={o} value={o}>{t(`source_${o}`)}</option>
          ))}
        </select>
      </div>

      {/* Save button */}
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #60a5fa, #818cf8)',
            border: 'none',
            borderRadius: 8,
            cursor: saving ? 'wait' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: saving ? 0.6 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          <Save size={14} />
          {saving ? t('saving') : t('save')}
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
    </div>
  );
}
