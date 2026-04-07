'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { callAI, handleFallbackAction } from '@/lib/aiClient';
import type { FallbackMessage } from '@/lib/aiClient';

interface ChatMessage {
  role: 'user' | 'assistant' | 'error';
  content: string;
  fallback?: FallbackMessage;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeDrugs: Record<string, number>;
  deficits: { title: string }[];
  zoneContext?: string;
  suggestedQuestion?: string;
}

function ErrorCard({ message }: { message: FallbackMessage }) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 12,
      background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
      maxWidth: '100%',
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f2f5', marginBottom: 4 }}>
        {message.title}
      </div>
      <div style={{ fontSize: 12, color: '#9ba3b5', lineHeight: 1.5 }}>
        {message.text}
      </div>
      {message.cta && (
        <button
          onClick={() => handleFallbackAction(message.cta!.action)}
          style={{
            marginTop: 8, padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)',
            color: '#60a5fa', cursor: 'pointer',
          }}
        >
          {message.cta.label}
        </button>
      )}
      {message.details != null && (
        <details style={{ marginTop: 8, fontSize: 10, color: '#5a6478' }}>
          <summary style={{ cursor: 'pointer' }}>Технические подробности</summary>
          <pre style={{
            marginTop: 4, padding: 8, borderRadius: 6,
            background: 'rgba(0,0,0,0.3)', overflowX: 'auto',
            fontSize: 9, lineHeight: 1.4, color: '#9ba3b5',
          }}>
            {typeof message.details === 'string' ? message.details : JSON.stringify(message.details, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

const DB_BUTTONS = [
  { label: '\uD83D\uDD2C PubMed', prefix: 'Найди в PubMed: ' },
  { label: '\uD83D\uDCCA Ki (ChEMBL)', prefix: 'Ki-значения для: ' },
  { label: '\uD83D\uDCCB Cochrane', prefix: 'Cochrane обзоры: ' },
  { label: '\uD83D\uDC8A FDA', prefix: 'FDA побочные эффекты: ' },
];

export default function ChatPanel({ isOpen, onClose, activeDrugs, deficits, zoneContext, suggestedQuestion }: ChatPanelProps) {
  const t = useTranslations('chat');
  const td = useTranslations('dashboard');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (suggestedQuestion) setInput(suggestedQuestion);
  }, [suggestedQuestion]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    const result = await callAI(text, { activeScheme: activeDrugs, deficits, zoneContext });

    if (result.ok) {
      setMessages(prev => [...prev, { role: 'assistant', content: result.data.response }]);
    } else {
      setMessages(prev => [...prev, { role: 'error', content: '', fallback: result.fallback }]);
    }
    setLoading(false);
  }, [input, loading, activeDrugs, deficits, zoneContext]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 'min(720px, 90vw)', height: 'min(640px, 80vh)',
        background: 'var(--bg-elevated)', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          height: 56, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 600, color: '#f0f2f5' }}>
              {t('aiAssistant')}
            </span>
            <span style={{
              fontSize: 11, padding: '2px 6px', borderRadius: 4,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)',
            }}>
              {isMac ? '\u2318K' : 'Ctrl K'}
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#5a6478', fontSize: 22, cursor: 'pointer',
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6,
          }}>&times;</button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#5a6478', fontSize: 13, padding: 40 }}>
              {t('emptyPrompt')}
            </div>
          )}
          {messages.map((m, i) => {
            if (m.role === 'error' && m.fallback) {
              return <ErrorCard key={i} message={m.fallback} />;
            }
            return (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: m.role === 'user' ? '75%' : '100%',
                padding: '10px 14px', borderRadius: 12,
                background: m.role === 'user' ? 'rgba(110,231,183,0.15)' : 'rgba(255,255,255,0.04)',
                color: '#f0f2f5', fontSize: 13, lineHeight: 1.6,
                whiteSpace: 'pre-wrap', wordWrap: 'break-word', overflowWrap: 'anywhere',
                border: `1px solid ${m.role === 'user' ? 'rgba(110,231,183,0.2)' : 'rgba(255,255,255,0.06)'}`,
              }}>
                {m.content}
              </div>
            );
          })}
          {loading && (
            <div style={{
              alignSelf: 'flex-start', padding: '10px 14px', borderRadius: 12,
              background: 'rgba(255,255,255,0.04)', color: '#5a6478', fontSize: 13,
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              {t('thinking')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px 12px', flexShrink: 0 }}>
          {/* Source buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {DB_BUTTONS.map(btn => (
              <button key={btn.label} onClick={() => { setInput(btn.prefix); inputRef.current?.focus(); }} style={{
                fontSize: 10, padding: '4px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                color: '#9ba3b5', cursor: 'pointer',
              }}>{btn.label}</button>
            ))}
          </div>

          {/* Input row */}
          <form onSubmit={e => { e.preventDefault(); send(); }} style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={input} onChange={e => setInput(e.target.value)}
              placeholder={t('askAboutDrugs')}
              disabled={loading}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)', background: 'var(--bg-surface)',
                color: '#f0f2f5', fontSize: 13, outline: 'none',
                fontFamily: 'var(--font-body)',
              }}
            />
            <button type="submit" disabled={loading || !input.trim()} style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: loading ? '#334155' : 'linear-gradient(135deg,#6ee7b7,#818cf8)',
              color: '#080b12', fontSize: 13, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
            }}>
              \u2191
            </button>
          </form>

          {/* Disclaimer */}
          <div style={{ padding: '6px 0 0', fontSize: 9, color: '#334155', textAlign: 'center' }}>
            {td('disclaimer')}<br />{td('disclaimerWarning')}
          </div>
        </div>
      </div>
    </div>
  );
}
