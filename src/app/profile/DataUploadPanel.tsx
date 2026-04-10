'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, FileText, Heart, CheckCircle, AlertCircle, X } from 'lucide-react';

type UploadType = 'apple_health' | 'lab_pdf';

interface UploadState {
  file: File | null;
  type: UploadType;
  uploading: boolean;
  status: 'idle' | 'success' | 'error';
  message: string;
}

export default function DataUploadPanel() {
  const t = useTranslations('uploadForm');
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({
    file: null,
    type: 'apple_health',
    uploading: false,
    status: 'idle',
    message: '',
  });

  const selectFile = useCallback((type: UploadType) => {
    setState(prev => ({ ...prev, type, file: null, status: 'idle', message: '' }));
    if (fileRef.current) {
      fileRef.current.accept = type === 'apple_health' ? '.xml' : '.pdf';
      fileRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setState(prev => ({ ...prev, file, status: 'idle', message: '' }));
  }, []);

  const clearFile = useCallback(() => {
    setState(prev => ({ ...prev, file: null, status: 'idle', message: '' }));
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  const handleUpload = useCallback(async () => {
    if (!state.file) return;
    setState(prev => ({ ...prev, uploading: true, status: 'idle' }));
    try {
      const formData = new FormData();
      formData.append('file', state.file);
      formData.append('fileType', state.type);

      const res = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setState(prev => ({
        ...prev,
        uploading: false,
        status: 'success',
        message: data.message || t('uploadSuccess'),
        file: null,
      }));
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setState(prev => ({
        ...prev,
        uploading: false,
        status: 'error',
        message: err instanceof Error ? err.message : t('uploadError'),
      }));
    }
  }, [state.file, state.type, t]);

  const cardStyle: React.CSSProperties = {
    background: 'var(--glass)',
    border: '1px solid var(--glass-border)',
    borderRadius: 12,
    padding: 24,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
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
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
        {t('description')}
      </p>

      <input
        ref={fileRef}
        type="file"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Upload type cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 500, marginBottom: 24 }}>
        <div onClick={() => selectFile('apple_health')} style={cardStyle}>
          <Heart size={32} color="#ef4444" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            {t('appleHealth')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {t('appleHealthDesc')}
          </div>
        </div>
        <div onClick={() => selectFile('lab_pdf')} style={cardStyle}>
          <FileText size={32} color="#60a5fa" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            {t('labPdf')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {t('labPdfDesc')}
          </div>
        </div>
      </div>

      {/* Selected file */}
      {state.file && (
        <div style={{
          background: 'var(--glass)', border: '1px solid var(--glass-border)',
          borderRadius: 10, padding: '12px 16px', maxWidth: 500,
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
        }}>
          <Upload size={16} color="var(--accent)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {state.file.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {(state.file.size / 1024).toFixed(1)} KB — {state.type === 'apple_health' ? 'Apple Health XML' : 'Lab PDF'}
            </div>
          </div>
          <button onClick={clearFile} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
          }}>
            <X size={14} />
          </button>
        </div>
      )}

      {state.file && (
        <button
          onClick={handleUpload}
          disabled={state.uploading}
          style={{
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #60a5fa, #818cf8)',
            border: 'none', borderRadius: 8,
            cursor: state.uploading ? 'wait' : 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
            color: '#fff', display: 'flex', alignItems: 'center', gap: 8,
            opacity: state.uploading ? 0.6 : 1,
            marginBottom: 16,
          }}
        >
          <Upload size={14} />
          {state.uploading ? t('uploading') : t('uploadButton')}
        </button>
      )}

      {/* Status */}
      {state.status === 'success' && (
        <div style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <CheckCircle size={14} /> {state.message}
        </div>
      )}
      {state.status === 'error' && (
        <div style={{ fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <AlertCircle size={14} /> {state.message}
        </div>
      )}

      {/* Info box */}
      <div style={{
        background: 'var(--glass)', border: '1px solid var(--glass-border)',
        borderRadius: 10, padding: 16, maxWidth: 500, marginTop: 24,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('supportedFormats')}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <div style={{ marginBottom: 4 }}>
            <strong>Apple Health:</strong> {t('appleHealthFormat')}
          </div>
          <div>
            <strong>Lab PDF:</strong> {t('labPdfFormat')}
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
          {t('maxSize')}
        </div>
      </div>
    </div>
  );
}
