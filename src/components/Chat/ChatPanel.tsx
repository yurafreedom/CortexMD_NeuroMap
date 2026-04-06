'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeDrugs: Record<string, number>;
  deficits: { title: string }[];
  zoneContext?: string;
  suggestedQuestion?: string;
}

export default function ChatPanel({ isOpen, onClose, activeDrugs, deficits, zoneContext, suggestedQuestion }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (suggestedQuestion) setInput(suggestedQuestion);
  }, [suggestedQuestion]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, activeScheme: activeDrugs, deficits, zoneContext }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.error || 'Ошибка' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка сети' }]);
    }
    setLoading(false);
  }

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', right: 16, bottom: 64, width: 380, height: 520, zIndex: 50,
      background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      backdropFilter: 'blur(30px)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 600, color: '#f0f2f5' }}>
          AI Ассистент
        </span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#5a6478', fontSize: 18, cursor: 'pointer',
        }}>&times;</button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#5a6478', fontSize: 12, padding: 32 }}>
            Задайте вопрос о препаратах, рецепторах или взаимодействиях
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%', padding: '8px 12px', borderRadius: 10,
            background: m.role === 'user' ? 'rgba(110,231,183,0.15)' : 'rgba(255,255,255,0.04)',
            color: '#f0f2f5', fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap',
            border: `1px solid ${m.role === 'user' ? 'rgba(110,231,183,0.2)' : 'rgba(255,255,255,0.06)'}`,
          }}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: 'flex-start', padding: '8px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)', color: '#5a6478', fontSize: 12,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            Думаю...
          </div>
        )}
      </div>

      {/* Quick questions */}
      {messages.length === 0 && (
        <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {[
            'Какие конфликты в моей схеме?',
            'Как улучшить покрытие рабочей памяти?',
            'Объясни серотониновый потолок',
          ].map(q => (
            <button key={q} onClick={() => { setInput(q); }} style={{
              padding: '4px 8px', fontSize: 9, borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
              color: '#9ba3b5', cursor: 'pointer',
            }}>{q}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={e => { e.preventDefault(); send(); }} style={{
        padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', gap: 8,
      }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          placeholder="Спросите о препаратах..."
          disabled={loading}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)', background: '#1a1f2e',
            color: '#f0f2f5', fontSize: 12, outline: 'none',
          }}
        />
        <button type="submit" disabled={loading || !input.trim()} style={{
          padding: '8px 16px', borderRadius: 8, border: 'none',
          background: loading ? '#334155' : 'linear-gradient(135deg,#6ee7b7,#818cf8)',
          color: '#080b12', fontSize: 12, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
        }}>
          ↑
        </button>
      </form>

      {/* Disclaimer */}
      <div style={{ padding: '4px 12px 8px', fontSize: 8, color: '#334155', textAlign: 'center' }}>
        Образовательный инструмент. НЕ медицинский совет.
      </div>
    </div>
  );
}
