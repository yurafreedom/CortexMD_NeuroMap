'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DEFICITS, type Deficit, type DeficitStatus } from '@/data/defaultDeficits';

const STORAGE_KEY = 'cortexmd_deficits';

function loadFromStorage(): Deficit[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as Deficit[];
    }
  } catch {
    // corrupted data — ignore
  }
  return null;
}

function saveToStorage(deficits: Deficit[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deficits));
  } catch {
    // quota exceeded or private browsing — ignore
  }
}

export function useDeficits() {
  const [deficits, setDeficits] = useState<Deficit[]>(DEFICITS);
  const [selectedDeficit, setSelectedDeficit] = useState<string | null>(null);
  const initialized = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      setDeficits(saved);
    }
    initialized.current = true;
  }, []);

  // Auto-save to localStorage on every change (skip initial load)
  useEffect(() => {
    if (!initialized.current) return;
    saveToStorage(deficits);
  }, [deficits]);

  const selectDeficit = useCallback((id: string) => {
    setSelectedDeficit((prev) => (prev === id ? null : id));
  }, []);

  const changeStatus = useCallback((id: string, status: DeficitStatus) => {
    setDeficits((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status } : d)),
    );
  }, []);

  const deleteDeficit = useCallback((id: string) => {
    setDeficits((prev) => prev.filter((d) => d.id !== id));
    setSelectedDeficit((prev) => (prev === id ? null : prev));
  }, []);

  return {
    deficits,
    selectedDeficit,
    selectDeficit,
    changeStatus,
    deleteDeficit,
  };
}
