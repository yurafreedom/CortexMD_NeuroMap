'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { DRUGS } from '../../data/drugs';
import { DCAT } from '../../data/presets';
import type { Preset } from '../../data/presets';
import type { ActiveDrugs } from '../../lib/pharmacology';
import { realD } from '../../lib/pharmacology';
import { Z } from '@/styles/zIndex';
import PresetComparisonModal from '../Presets/PresetComparisonModal';

interface DrugCatalogProps {
  activeDrugs: ActiveDrugs;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateDose: (id: string, dose: number) => void;
  onApplyPreset: (drugs: ActiveDrugs) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export default function DrugCatalog({
  activeDrugs,
  onAdd,
  onRemove,
  onUpdateDose,
  onApplyPreset,
  isModal,
  onClose,
}: DrugCatalogProps) {
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  // Load presets from API
  useEffect(() => {
    if (!isModal) return;
    setPresetsLoading(true);
    fetch('/api/profile/presets')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setPresets(res.data);
      })
      .catch(() => {})
      .finally(() => setPresetsLoading(false));
  }, [isModal]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const filteredIds = useMemo(() => {
    let ids = Object.keys(DRUGS);
    if (category !== 'all') {
      const cat = DCAT[category];
      if (cat && cat.d) {
        ids = ids.filter((id) => cat.d!.includes(id));
      }
    }
    if (search) {
      const sq = search.toLowerCase();
      ids = ids.filter((id) => {
        const d = DRUGS[id];
        return (
          d.n.toLowerCase().includes(sq) ||
          d.s.toLowerCase().includes(sq) ||
          id.toLowerCase().includes(sq) ||
          (d.brand && d.brand.toLowerCase().includes(sq))
        );
      });
    }
    return ids;
  }, [search, category]);

  const handleAdd = useCallback(
    (id: string) => {
      if (activeDrugs.hasOwnProperty(id)) return;
      onAdd(id);
    },
    [activeDrugs, onAdd],
  );

  const schemeCount = Object.keys(activeDrugs).length;

  // Save preset
  const handleSavePreset = useCallback(async () => {
    if (!newPresetName.trim() || schemeCount === 0) return;
    try {
      const res = await fetch('/api/profile/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPresetName.trim(), drugs: activeDrugs }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setPresets((prev) => [json.data, ...prev]);
        setNewPresetName('');
        setShowPresetInput(false);
        showToast(t('presetSaved'));
      }
    } catch {
      // network error — silent
    }
  }, [newPresetName, schemeCount, activeDrugs, showToast, t]);

  // Delete preset
  const handleDeletePreset = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/profile/presets/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setPresets((prev) => prev.filter((p) => p.id !== id));
        setSelectedForCompare((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setDeleteConfirm(null);
        showToast(t('presetDeleted'));
      }
    } catch {
      // network error — silent
    }
  }, [showToast, t]);

  // Load preset
  const handleLoadPreset = useCallback(
    (drugs: ActiveDrugs) => {
      onApplyPreset(drugs);
    },
    [onApplyPreset],
  );

  // Toggle compare selection
  const toggleCompare = useCallback((id: string) => {
    setSelectedForCompare((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 2) {
        next.add(id);
      }
      return next;
    });
  }, []);

  if (!isModal) {
    // Inline mode (legacy) — just show catalog grid
    return (
      <div id="catalog-section" className="open">
        <div>
          <input
            className="dsearch"
            type="text"
            placeholder={t('searchDrug')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="dtabs">
            {Object.keys(DCAT).map((k) => (
              <div
                key={k}
                className={`dtab${category === k ? ' act' : ''}`}
                onClick={() => setCategory(k)}
              >
                {DCAT[k].l}
              </div>
            ))}
          </div>
        </div>
        <div className="dg">
          {filteredIds.map((id) => {
            const d = DRUGS[id];
            const inScheme = activeDrugs.hasOwnProperty(id);
            return (
              <div
                key={id}
                className={`di${inScheme ? ' in-scheme' : ''}`}
                style={{ '--c': d.c } as React.CSSProperties}
                onClick={() => handleAdd(id)}
                title={d.n + (inScheme ? ` (${t('added')})` : '')}
              >
                <div
                  className="ddt"
                  style={
                    inScheme
                      ? { background: 'var(--c)', boxShadow: '0 0 8px var(--c)' }
                      : undefined
                  }
                />
                <span>{d.s}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Modal mode — two-column layout
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.modal,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        style={{
          width: 'min(1280px, 90vw)',
          height: 'min(800px, 90vh)',
          background: 'var(--bg-elevated)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            height: 56,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: 16,
              fontWeight: 600,
              color: '#f0f2f5',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {t('schemeSelection')}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#5a6478',
              fontSize: 22,
              cursor: 'pointer',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
            }}
          >
            &times;
          </button>
        </div>

        {/* Two-column body */}
        <div
          className="scheme-modal-content"
          style={{
            display: 'grid',
            gridTemplateColumns: '480px 1fr',
            gap: 24,
            flex: 1,
            overflow: 'hidden',
            padding: '0 24px 24px',
          }}
        >
          {/* LEFT COLUMN — Active Scheme + Presets */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              overflowY: 'auto',
              paddingTop: 16,
              paddingRight: 8,
            }}
          >
            {/* Block 1: Active Scheme */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#f0f2f5',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {t('activeSchemeHeader')}
                </span>
                {schemeCount > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      color: '#94a3b8',
                      background: 'rgba(255,255,255,0.06)',
                      padding: '2px 8px',
                      borderRadius: 10,
                    }}
                  >
                    {schemeCount} {t('drugs')}
                  </span>
                )}
              </div>

              {schemeCount === 0 ? (
                <div
                  style={{
                    padding: '20px 16px',
                    borderRadius: 10,
                    border: '1px dashed rgba(255,255,255,0.12)',
                    color: '#64748b',
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                >
                  {t('selectFromCatalog')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.keys(activeDrugs).map((id) => {
                    const d = DRUGS[id];
                    if (!d) return null;
                    const dose = activeDrugs[id];
                    const rd = realD(id, activeDrugs);
                    const hasWarn = d.warnDose !== undefined && dose >= d.warnDose;
                    const isDanger = d.maxDose !== undefined && dose >= d.maxDose;
                    const mn = d.doses[0];
                    const mx = d.doses[d.doses.length - 1];
                    const step = d.doses.length > 1 ? d.doses[1] - d.doses[0] : 1;
                    const sliderColor = isDanger ? '#ef4444' : hasWarn ? '#f59e0b' : undefined;

                    return (
                      <div
                        key={id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isDanger ? 'rgba(239,68,68,0.3)' : hasWarn ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 6,
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                              }}
                            >
                              {d.brand || d.s}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              {d.n}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              fontFamily: 'var(--font-mono)',
                              color: isDanger ? '#ef4444' : hasWarn ? '#f59e0b' : '#f0f2f5',
                            }}
                          >
                            {dose} {d.u}
                          </span>
                          <button
                            onClick={() => onRemove(id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#5a6478',
                              fontSize: 16,
                              cursor: 'pointer',
                              padding: '0 4px',
                              lineHeight: 1,
                            }}
                          >
                            &times;
                          </button>
                        </div>
                        {rd && Math.abs(rd - dose) > 1 && (
                          <div style={{ fontSize: 10, color: '#f59e0b', marginBottom: 4 }}>
                            {t('realDose')}{Math.round(rd)}{d.u}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="range"
                            min={mn}
                            max={mx}
                            step={step}
                            value={dose}
                            style={{
                              flex: 1,
                              height: 4,
                              accentColor: sliderColor || '#60a5fa',
                            }}
                            onChange={(e) => onUpdateDose(id, parseFloat(e.target.value))}
                          />
                          <input
                            type="number"
                            value={dose}
                            min={mn}
                            max={mx}
                            step={step}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!isNaN(v)) onUpdateDose(id, v);
                            }}
                            style={{
                              width: 56,
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 6,
                              color: '#f0f2f5',
                              fontSize: 12,
                              padding: '4px 6px',
                              textAlign: 'center',
                              fontFamily: 'var(--font-mono)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Save Preset button */}
              {schemeCount > 0 && (
                <div style={{ marginTop: 10 }}>
                  {showPresetInput ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSavePreset();
                          if (e.key === 'Escape') {
                            setShowPresetInput(false);
                            setNewPresetName('');
                          }
                        }}
                        placeholder={t('presetNamePlaceholder')}
                        autoFocus
                        style={{
                          flex: 1,
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 8,
                          color: '#f0f2f5',
                          fontSize: 13,
                          padding: '8px 12px',
                        }}
                      />
                      <button
                        onClick={handleSavePreset}
                        disabled={!newPresetName.trim()}
                        style={{
                          background: 'none',
                          border: '1px solid rgba(96,165,250,0.4)',
                          borderRadius: 8,
                          color: '#60a5fa',
                          fontSize: 13,
                          padding: '8px 14px',
                          cursor: newPresetName.trim() ? 'pointer' : 'default',
                          opacity: newPresetName.trim() ? 1 : 0.4,
                        }}
                      >
                        {tc('save')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowPresetInput(true)}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: '1px solid rgba(255,255,255,0.10)',
                        borderRadius: 8,
                        color: '#94a3b8',
                        fontSize: 13,
                        padding: '8px 14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {t('addPreset')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Separator */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            {/* Block 2: My Presets */}
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#f0f2f5',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 12,
                }}
              >
                {t('myPresets')}
              </div>

              {presetsLoading ? (
                <div style={{ color: '#64748b', fontSize: 12 }}>{tc('loading')}</div>
              ) : presets.length === 0 ? (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 10,
                    border: '1px dashed rgba(255,255,255,0.12)',
                    color: '#64748b',
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                >
                  {t('noPresets')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {presets.map((preset) => {
                    const drugCount = Object.keys(preset.drugs).length;
                    const isSelected = selectedForCompare.has(preset.id);
                    const created = new Date(preset.created_at).toLocaleDateString();

                    return (
                      <div
                        key={preset.id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 10,
                          background: isSelected
                            ? 'rgba(96,165,250,0.06)'
                            : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isSelected ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        {deleteConfirm === preset.id ? (
                          // Delete confirmation inline
                          <div>
                            <div style={{ fontSize: 13, color: '#f0f2f5', marginBottom: 8 }}>
                              {t('deletePresetConfirm').replace('{name}', preset.name)}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                style={{
                                  background: 'none',
                                  border: '1px solid rgba(255,255,255,0.10)',
                                  borderRadius: 6,
                                  color: '#94a3b8',
                                  fontSize: 12,
                                  padding: '6px 12px',
                                  cursor: 'pointer',
                                }}
                              >
                                {tc('cancel')}
                              </button>
                              <button
                                onClick={() => handleDeletePreset(preset.id)}
                                style={{
                                  background: 'rgba(239,68,68,0.1)',
                                  border: '1px solid rgba(239,68,68,0.3)',
                                  borderRadius: 6,
                                  color: '#ef4444',
                                  fontSize: 12,
                                  padding: '6px 12px',
                                  cursor: 'pointer',
                                }}
                              >
                                {tc('delete')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 6,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleCompare(preset.id)}
                                style={{ accentColor: '#60a5fa', cursor: 'pointer' }}
                              />
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: '#f0f2f5',
                                  }}
                                >
                                  {preset.name}
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>
                                  {drugCount} {t('drugs')} · {created}
                                </div>
                              </div>
                              <button
                                onClick={() => handleLoadPreset(preset.drugs as ActiveDrugs)}
                                style={{
                                  background: 'none',
                                  border: '1px solid rgba(96,165,250,0.3)',
                                  borderRadius: 6,
                                  color: '#60a5fa',
                                  fontSize: 11,
                                  padding: '4px 10px',
                                  cursor: 'pointer',
                                }}
                              >
                                {t('loadPreset')}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(preset.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#5a6478',
                                  fontSize: 16,
                                  cursor: 'pointer',
                                  padding: '0 4px',
                                  lineHeight: 1,
                                }}
                              >
                                &times;
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Compare button */}
              {presets.length >= 2 && (
                <button
                  disabled={selectedForCompare.size !== 2}
                  onClick={() => {
                    if (selectedForCompare.size === 2) setComparisonOpen(true);
                  }}
                  style={{
                    width: '100%',
                    marginTop: 10,
                    background:
                      selectedForCompare.size === 2
                        ? 'rgba(96,165,250,0.1)'
                        : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${selectedForCompare.size === 2 ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 8,
                    color: selectedForCompare.size === 2 ? '#60a5fa' : '#475569',
                    fontSize: 13,
                    padding: '8px 14px',
                    cursor: selectedForCompare.size === 2 ? 'pointer' : 'default',
                  }}
                >
                  {t('comparePresets')} ({selectedForCompare.size})
                </button>
              )}

              {/* Comparison modal */}
              {comparisonOpen && selectedForCompare.size === 2 && (() => {
                const ids = [...selectedForCompare];
                const pA = presets.find((p) => p.id === ids[0]);
                const pB = presets.find((p) => p.id === ids[1]);
                if (!pA || !pB) return null;
                return (
                  <PresetComparisonModal
                    presetA={{ id: pA.id, name: pA.name, drugs: pA.drugs as ActiveDrugs }}
                    presetB={{ id: pB.id, name: pB.name, drugs: pB.drugs as ActiveDrugs }}
                    onClose={() => setComparisonOpen(false)}
                  />
                );
              })()}
            </div>
          </div>

          {/* RIGHT COLUMN — Catalog */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              paddingTop: 16,
            }}
          >
            {/* Search */}
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                background: 'var(--bg-elevated)',
                paddingBottom: 8,
              }}
            >
              <input
                className="dsearch"
                type="text"
                placeholder={t('searchDrug')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                style={{ fontSize: 14, padding: '10px 14px', width: '100%' }}
              />
              {/* Category filter chips */}
              <div className="dtabs" style={{ gap: 4, flexWrap: 'wrap' }}>
                {Object.keys(DCAT).map((k) => (
                  <div
                    key={k}
                    className={`dtab${category === k ? ' act' : ''}`}
                    onClick={() => setCategory(k)}
                    style={{ fontSize: 11, padding: '5px 10px' }}
                  >
                    {DCAT[k].l}
                  </div>
                ))}
              </div>
            </div>

            {/* Drug grid — 2 columns */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 12,
                  paddingBottom: 16,
                }}
              >
                {filteredIds.map((id) => {
                  const d = DRUGS[id];
                  const inScheme = activeDrugs.hasOwnProperty(id);
                  const targets = Object.keys(d.ki || {}).slice(0, 4).join(', ');

                  return (
                    <div
                      key={id}
                      onClick={() => handleAdd(id)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 10,
                        cursor: inScheme ? 'default' : 'pointer',
                        background: inScheme
                          ? 'rgba(96,165,250,0.06)'
                          : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${inScheme ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        opacity: inScheme ? 0.5 : 1,
                        transition: 'all 200ms ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: inScheme ? d.c : 'transparent',
                            border: `2px solid ${d.c}`,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {d.brand || d.s}
                        </span>
                        {inScheme && (
                          <span
                            style={{
                              fontSize: 9,
                              color: '#60a5fa',
                              marginLeft: 'auto',
                            }}
                          >
                            ✓ {t('added')}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-secondary)',
                          marginBottom: 4,
                        }}
                      >
                        {d.n}
                      </div>
                      {targets && (
                        <div
                          style={{
                            fontSize: 10,
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {targets}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="disclaimer">
                {t('disclaimer')}
                <br />
                {t('disclaimerWarning')}
              </div>
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 8,
              color: '#22c55e',
              fontSize: 13,
              padding: '8px 16px',
              zIndex: 10,
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
