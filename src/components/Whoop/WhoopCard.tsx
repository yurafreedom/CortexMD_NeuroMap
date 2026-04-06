'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Activity, Moon, Heart, Zap, Link2, Unlink } from 'lucide-react';
import { useWhoop } from '@/hooks/useWhoop';

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 120;
  const h = 32;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SleepBar({ stages }: { stages: { rem: number; sws: number; light: number; awake: number } }) {
  const total = stages.rem + stages.sws + stages.light + stages.awake || 1;
  const pct = (v: number) => `${((v / total) * 100).toFixed(0)}%`;

  return (
    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
      <div style={{ width: pct(stages.sws), background: '#6366f1' }} title={`SWS ${pct(stages.sws)}`} />
      <div style={{ width: pct(stages.rem), background: '#818cf8' }} title={`REM ${pct(stages.rem)}`} />
      <div style={{ width: pct(stages.light), background: '#a5b4fc' }} title={`Light ${pct(stages.light)}`} />
      <div style={{ width: pct(stages.awake), background: '#334155' }} title={`Awake ${pct(stages.awake)}`} />
    </div>
  );
}

function RecoveryGauge({ score }: { score: number }) {
  const color = score >= 67 ? '#22c55e' : score >= 34 ? '#f59e0b' : '#ef4444';
  const angle = (score / 100) * 180;

  return (
    <div style={{ position: 'relative', width: 64, height: 36 }}>
      <svg width={64} height={36} viewBox="0 0 64 36">
        <path
          d="M 4 32 A 28 28 0 0 1 60 32"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={5}
          strokeLinecap="round"
        />
        <path
          d="M 4 32 A 28 28 0 0 1 60 32"
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${(angle / 180) * 88} 88`}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 14,
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color,
        }}
      >
        {score}
      </div>
    </div>
  );
}

function msToH(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h${m > 0 ? ` ${m}m` : ''}`;
}

export default function WhoopCard() {
  const t = useTranslations('whoop');
  const { connected, loading, recovery, sleep, error, disconnect } = useWhoop();

  if (loading) {
    return (
      <div className="whoop-card">
        <div className="whoop-header">
          <Activity size={14} />
          <span>Whoop</span>
        </div>
        <div className="whoop-loading">{t('loading')}</div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="whoop-card">
        <div className="whoop-header">
          <Activity size={14} />
          <span>Whoop</span>
        </div>
        <div className="whoop-connect-prompt">
          <p>{t('connectPrompt')}</p>
          <a href="/api/whoop/auth" className="whoop-connect-btn">
            <Link2 size={12} />
            {t('connect')}
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="whoop-card">
        <div className="whoop-header">
          <Activity size={14} />
          <span>Whoop</span>
          <button className="whoop-disconnect" onClick={disconnect} title={t('disconnect')}>
            <Unlink size={10} />
          </button>
        </div>
        <div className="whoop-error">{error}</div>
      </div>
    );
  }

  const latest = recovery[0];
  const latestSleep = sleep[0];
  const hrvValues = recovery.map((r) => r.hrv_rmssd_milli).reverse();

  return (
    <div className="whoop-card">
      {/* Header */}
      <div className="whoop-header">
        <Activity size={14} />
        <span>Whoop</span>
        <button className="whoop-disconnect" onClick={disconnect} title={t('disconnect')}>
          <Unlink size={10} />
        </button>
      </div>

      {latest && (
        <div className="whoop-grid">
          {/* Recovery */}
          <div className="whoop-metric">
            <div className="whoop-metric-label">
              <Zap size={10} /> {t('recovery')}
            </div>
            <RecoveryGauge score={latest.recovery_score} />
          </div>

          {/* HRV */}
          <div className="whoop-metric">
            <div className="whoop-metric-label">
              <Heart size={10} /> HRV
            </div>
            <div className="whoop-metric-value">{latest.hrv_rmssd_milli.toFixed(0)}<span className="whoop-unit">ms</span></div>
            <Sparkline values={hrvValues} color="#6ee7b7" />
          </div>

          {/* Resting HR */}
          <div className="whoop-metric">
            <div className="whoop-metric-label">
              <Heart size={10} /> {t('restingHR')}
            </div>
            <div className="whoop-metric-value">{latest.resting_heart_rate}<span className="whoop-unit">bpm</span></div>
          </div>

          {/* Sleep */}
          {latestSleep && (
            <div className="whoop-metric whoop-metric-wide">
              <div className="whoop-metric-label">
                <Moon size={10} /> {t('sleep')} — {latestSleep.sleep_performance_percentage}%
              </div>
              <SleepBar
                stages={{
                  rem: latestSleep.stage_summary.total_rem_sleep_time_milli,
                  sws: latestSleep.stage_summary.total_slow_wave_sleep_time_milli,
                  light: latestSleep.stage_summary.total_light_sleep_time_milli,
                  awake: latestSleep.stage_summary.total_awake_time_milli,
                }}
              />
              <div className="whoop-sleep-legend">
                <span style={{ color: '#6366f1' }}>SWS {msToH(latestSleep.stage_summary.total_slow_wave_sleep_time_milli)}</span>
                <span style={{ color: '#818cf8' }}>REM {msToH(latestSleep.stage_summary.total_rem_sleep_time_milli)}</span>
                <span style={{ color: '#a5b4fc' }}>{t('light')} {msToH(latestSleep.stage_summary.total_light_sleep_time_milli)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
