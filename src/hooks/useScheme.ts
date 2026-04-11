'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DRUGS } from '@/data/drugs';
import type { ActiveDrugs } from '@/lib/pharmacology';

const STORAGE_KEY = 'cortexmd_scheme';

function loadFromStorage(): ActiveDrugs {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as ActiveDrugs;
    }
  } catch {
    // corrupted data — ignore
  }
  return {};
}

function saveToStorage(scheme: ActiveDrugs): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scheme));
  } catch {
    // quota exceeded or private browsing — ignore
  }
}

export function useScheme() {
  const [scheme, setScheme] = useState<ActiveDrugs>({});
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadFromStorage();
    setScheme(saved);
    setLoading(false);
    initialized.current = true;
  }, []);

  // Auto-save to localStorage on every change (skip initial load)
  useEffect(() => {
    if (!initialized.current) return;
    saveToStorage(scheme);
    // TODO: sync to Supabase when user is authenticated
  }, [scheme]);

  const addDrug = useCallback((id: string, dose?: number) => {
    const drug = DRUGS[id];
    if (!drug) return;
    const d = dose ?? drug.def;
    setScheme((prev) => ({ ...prev, [id]: d }));
  }, []);

  const removeDrug = useCallback((id: string) => {
    setScheme((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const updateDose = useCallback((id: string, dose: number) => {
    setScheme((prev) => {
      if (!(id in prev)) return prev;
      return { ...prev, [id]: dose };
    });
  }, []);

  const applyPreset = useCallback((drugs: ActiveDrugs) => {
    setScheme({ ...drugs });
  }, []);

  const saveCustomPreset = useCallback(
    (name: string) => {
      // TODO: persist custom presets to localStorage / Supabase
      const key = `cortexmd_preset_${name}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(scheme));
      }
    },
    [scheme],
  );

  const clearScheme = useCallback(() => {
    setScheme({});
  }, []);

  return {
    scheme,
    loading,
    addDrug,
    removeDrug,
    updateDose,
    applyPreset,
    saveCustomPreset,
    clearScheme,
  };
}
