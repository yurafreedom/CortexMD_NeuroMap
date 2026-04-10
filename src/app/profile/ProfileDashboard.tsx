'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Dna,
  ClipboardList,
  FlaskConical,
  History,
  Upload,
} from 'lucide-react';

export interface ProfileUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor' | null;
}

type TabKey = 'genetics' | 'symptoms' | 'labs' | 'treatment' | 'upload';

const TABS: { key: TabKey; icon: React.ReactNode; labelKey: string }[] = [
  { key: 'genetics', icon: <Dna size={16} />, labelKey: 'genetics' },
  { key: 'symptoms', icon: <ClipboardList size={16} />, labelKey: 'symptoms' },
  { key: 'labs', icon: <FlaskConical size={16} />, labelKey: 'labs' },
  { key: 'treatment', icon: <History size={16} />, labelKey: 'treatment' },
  { key: 'upload', icon: <Upload size={16} />, labelKey: 'upload' },
];

interface ProfileDashboardProps {
  user: ProfileUser;
  geneticProfile: Record<string, unknown> | null;
  labResults: Record<string, unknown>[];
  symptomScores: Record<string, unknown>[];
  treatmentHistory: Record<string, unknown>[];
}

export default function ProfileDashboard({
  user,
  geneticProfile,
  labResults,
  symptomScores,
  treatmentHistory,
}: ProfileDashboardProps) {
  const t = useTranslations('profilePage');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('genetics');

  const initials =
    (user.firstName?.[0] || '') + (user.lastName?.[0] || '');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-deep)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Top navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 24px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'rgba(13,17,23,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'var(--glass)',
            border: '1px solid var(--glass-border)',
            borderRadius: 8,
            padding: '6px 12px',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontFamily: 'var(--font-body)',
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowLeft size={14} />
          {t('backToDashboard')}
        </button>

        <div style={{ flex: 1 }} />

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #60a5fa, #818cf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: '#080b12',
            }}
          >
            {initials || '?'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {user.firstName} {user.lastName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {user.email}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
        {/* Sidebar tabs */}
        <div
          style={{
            width: 220,
            borderRight: '1px solid var(--glass-border)',
            background: 'rgba(13,17,23,0.6)',
            padding: '16px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '4px 12px',
              marginBottom: 4,
            }}
          >
            {t('sections')}
          </div>

          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: 'var(--font-body)',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  background: isActive
                    ? 'var(--accent-dim)'
                    : 'transparent',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                {tab.icon}
                {t(tab.labelKey)}
              </button>
            );
          })}

          {/* Stats summary */}
          <div style={{ marginTop: 'auto', padding: '12px' }}>
            <div
              style={{
                background: 'var(--glass)',
                border: '1px solid var(--glass-border)',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                }}
              >
                {t('dataSummary')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <SummaryRow label={t('geneticMarkers')} value={geneticProfile ? '1' : '0'} />
                <SummaryRow label={t('labRecords')} value={String(labResults.length)} />
                <SummaryRow label={t('symptomAssessments')} value={String(symptomScores.length)} />
                <SummaryRow label={t('treatmentEntries')} value={String(treatmentHistory.length)} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div
          style={{
            flex: 1,
            padding: 24,
            overflowY: 'auto',
          }}
        >
          {activeTab === 'genetics' && (
            <TabPlaceholder
              title={t('genetics')}
              description={t('geneticsDesc')}
              hasData={!!geneticProfile}
            />
          )}
          {activeTab === 'symptoms' && (
            <TabPlaceholder
              title={t('symptoms')}
              description={t('symptomsDesc')}
              hasData={symptomScores.length > 0}
            />
          )}
          {activeTab === 'labs' && (
            <TabPlaceholder
              title={t('labs')}
              description={t('labsDesc')}
              hasData={labResults.length > 0}
            />
          )}
          {activeTab === 'treatment' && (
            <TabPlaceholder
              title={t('treatment')}
              description={t('treatmentDesc')}
              hasData={treatmentHistory.length > 0}
            />
          )}
          {activeTab === 'upload' && (
            <TabPlaceholder
              title={t('upload')}
              description={t('uploadDesc')}
              hasData={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        color: 'var(--text-secondary)',
      }}
    >
      <span>{label}</span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          color: value === '0' ? 'var(--text-muted)' : 'var(--accent)',
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function TabPlaceholder({
  title,
  description,
  hasData,
}: {
  title: string;
  description: string;
  hasData: boolean;
}) {
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
        {title}
      </h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginBottom: 24,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>

      {!hasData && (
        <div
          style={{
            background: 'var(--glass)',
            border: '1px dashed var(--glass-border)',
            borderRadius: 12,
            padding: '40px 24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          No data yet. Fill in the form below to get started.
        </div>
      )}
    </div>
  );
}
