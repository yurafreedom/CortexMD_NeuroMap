'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { SYMPTOM_SCALES, getSeverity } from '@/data/symptomScales';
import type { ScaleType, ScaleDefinition } from '@/data/symptomScales';

interface SymptomScaleFormProps {
  existingScores: Record<string, unknown>[];
}

type Phase = 'select' | 'quiz' | 'result';

export default function SymptomScaleForm({ existingScores }: SymptomScaleFormProps) {
  const t = useTranslations('symptomForm');
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedScale, setSelectedScale] = useState<ScaleDefinition | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const startQuiz = useCallback((scale: ScaleDefinition) => {
    setSelectedScale(scale);
    setAnswers(new Array(scale.questionCount).fill(null));
    setCurrentQ(0);
    setPhase('quiz');
    setSaveStatus('idle');
  }, []);

  const selectAnswer = useCallback((value: number) => {
    setAnswers(prev => {
      const next = [...prev];
      next[currentQ] = value;
      return next;
    });
  }, [currentQ]);

  const allAnswered = useMemo(() => answers.every(a => a !== null), [answers]);
  const totalScore = useMemo(() => answers.reduce<number>((sum, a) => sum + (a ?? 0), 0), [answers]);

  const handleSubmit = useCallback(async () => {
    if (!selectedScale || !allAnswered) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/profile/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scale_type: selectedScale.id,
          total_score: totalScore,
          item_scores: answers,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveStatus('success');
      setPhase('result');
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [selectedScale, allAnswered, totalScore, answers]);

  const reset = useCallback(() => {
    setPhase('select');
    setSelectedScale(null);
    setAnswers([]);
    setCurrentQ(0);
    setSaveStatus('idle');
  }, []);

  // Recent scores grouped by scale
  const recentByScale = useMemo(() => {
    const map: Partial<Record<ScaleType, { total_score: number; taken_at: string }[]>> = {};
    for (const s of existingScores) {
      const st = s.scale_type as ScaleType;
      if (!map[st]) map[st] = [];
      map[st]!.push({
        total_score: s.total_score as number,
        taken_at: s.taken_at as string,
      });
    }
    return map;
  }, [existingScores]);

  // === PHASE: Scale selection ===
  if (phase === 'select') {
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
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          {t('description')}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 700 }}>
          {SYMPTOM_SCALES.map(scale => {
            const recent = recentByScale[scale.id];
            const lastScore = recent?.[0];
            const severity = lastScore ? getSeverity(scale, lastScore.total_score) : null;

            return (
              <button
                key={scale.id}
                onClick={() => startQuiz(scale)}
                style={{
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 12,
                  padding: 16,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                  {scale.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {t(`${scale.keyPrefix}_title`)} — {scale.questionCount} {t('questions')}
                </div>
                {lastScore && severity ? (
                  <div style={{ fontSize: 11, color: severity.color, fontFamily: 'var(--font-mono)' }}>
                    {t('lastScore')}: {lastScore.total_score}/{scale.maxScore} — {t(severity.label)}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {t('noData')}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // === PHASE: Quiz ===
  if (phase === 'quiz' && selectedScale) {
    const progress = answers.filter(a => a !== null).length;
    const progressPct = (progress / selectedScale.questionCount) * 100;

    return (
      <div style={{ maxWidth: 600 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={reset} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontFamily: 'var(--font-body)',
          }}>
            <ChevronLeft size={14} /> {t('backToScales')}
          </button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {selectedScale.name}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 4, background: 'rgba(255,255,255,0.06)',
          borderRadius: 2, marginBottom: 24, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${progressPct}%`,
            background: 'linear-gradient(90deg, #60a5fa, #818cf8)',
            borderRadius: 2, transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Question */}
        <div style={{ marginBottom: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {t('question')} {currentQ + 1} / {selectedScale.questionCount}
          </span>
        </div>

        <div style={{
          fontSize: 15, fontWeight: 500, color: 'var(--text-primary)',
          lineHeight: 1.6, marginBottom: 20,
        }}>
          {t(`${selectedScale.keyPrefix}_q${currentQ + 1}`)}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {selectedScale.options.map(opt => {
            const isSelected = answers[currentQ] === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => selectAnswer(opt.value)}
                style={{
                  padding: '12px 16px',
                  background: isSelected ? 'var(--accent-dim)' : 'var(--glass)',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--glass-border)'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 13,
                  color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 600 : 400,
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s ease',
                }}
              >
                {t(opt.labelKey)}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
            disabled={currentQ === 0}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--glass-border)',
              background: 'var(--glass)', cursor: currentQ === 0 ? 'default' : 'pointer',
              opacity: currentQ === 0 ? 0.3 : 1, color: 'var(--text-secondary)',
              fontSize: 12, fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <ChevronLeft size={14} /> {t('prev')}
          </button>

          {currentQ < selectedScale.questionCount - 1 ? (
            <button
              onClick={() => setCurrentQ(q => Math.min(selectedScale.questionCount - 1, q + 1))}
              disabled={answers[currentQ] === null}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: answers[currentQ] !== null
                  ? 'linear-gradient(135deg, #60a5fa, #818cf8)' : 'var(--glass)',
                cursor: answers[currentQ] === null ? 'default' : 'pointer',
                opacity: answers[currentQ] === null ? 0.4 : 1,
                color: answers[currentQ] !== null ? '#fff' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {t('next')} <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || saving}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: allAnswered
                  ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'var(--glass)',
                cursor: !allAnswered || saving ? 'default' : 'pointer',
                opacity: !allAnswered ? 0.4 : 1,
                color: allAnswered ? '#fff' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
              }}
            >
              {saving ? t('saving') : t('submit')}
            </button>
          )}

          {/* Question dots */}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: selectedScale.questionCount }, (_, i) => (
              <div
                key={i}
                onClick={() => setCurrentQ(i)}
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  cursor: 'pointer',
                  background: i === currentQ
                    ? '#60a5fa'
                    : answers[i] !== null
                      ? 'rgba(96,165,250,0.4)'
                      : 'rgba(255,255,255,0.1)',
                  transition: 'background 0.2s ease',
                }}
              />
            ))}
          </div>
        </div>

        {saveStatus === 'error' && (
          <div style={{ marginTop: 12, fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={14} /> {t('saveError')}
          </div>
        )}
      </div>
    );
  }

  // === PHASE: Result ===
  if (phase === 'result' && selectedScale) {
    const severity = getSeverity(selectedScale, totalScore);

    return (
      <div style={{ maxWidth: 500 }}>
        <div style={{
          background: 'var(--glass)', border: '1px solid var(--glass-border)',
          borderRadius: 16, padding: 32, textAlign: 'center',
        }}>
          <CheckCircle size={40} color="#22c55e" style={{ marginBottom: 16 }} />

          <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 4 }}>
            {selectedScale.name} — {t('completed')}
          </div>

          <div style={{
            fontSize: 48, fontWeight: 700, fontFamily: 'var(--font-mono)',
            color: severity.color, lineHeight: 1, margin: '16px 0 8px',
          }}>
            {totalScore}
            <span style={{ fontSize: 18, color: 'var(--text-muted)' }}>/{selectedScale.maxScore}</span>
          </div>

          <div style={{
            fontSize: 14, fontWeight: 600, color: severity.color, marginBottom: 20,
          }}>
            {t(severity.label)}
          </div>

          {/* Score breakdown bar */}
          <div style={{
            height: 8, background: 'rgba(255,255,255,0.06)',
            borderRadius: 4, overflow: 'hidden', marginBottom: 24,
          }}>
            <div style={{
              height: '100%', width: `${(totalScore / selectedScale.maxScore) * 100}%`,
              background: severity.color, borderRadius: 4,
              transition: 'width 0.5s ease',
            }} />
          </div>

          <button
            onClick={reset}
            style={{
              padding: '10px 24px', borderRadius: 8,
              background: 'var(--glass)', border: '1px solid var(--glass-border)',
              cursor: 'pointer', color: 'var(--text-secondary)',
              fontSize: 13, fontFamily: 'var(--font-body)',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <RotateCcw size={14} /> {t('takeAnother')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
