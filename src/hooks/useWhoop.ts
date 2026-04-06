'use client';

import { useState, useEffect, useCallback } from 'react';

interface WhoopRecovery {
  recovery_score: number;
  hrv_rmssd_milli: number;
  resting_heart_rate: number;
  spo2_percentage?: number;
  skin_temp_celsius?: number;
}

interface WhoopSleepStages {
  total_rem_sleep_time_milli: number;
  total_slow_wave_sleep_time_milli: number;
  total_light_sleep_time_milli: number;
  total_awake_time_milli: number;
  disturbance_count: number;
}

interface WhoopSleep {
  sleep_performance_percentage: number;
  sleep_efficiency_percentage: number;
  stage_summary: WhoopSleepStages;
}

export interface WhoopData {
  connected: boolean;
  loading: boolean;
  recovery: WhoopRecovery[];
  sleep: WhoopSleep[];
  error: string | null;
}

async function fetchWhoop(type: string) {
  const res = await fetch(`/api/whoop/data?type=${type}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (data.connected === false) throw new Error('NOT_CONNECTED');
    throw new Error(data.error || `Failed to fetch ${type}`);
  }
  return res.json();
}

export function useWhoop() {
  const [data, setData] = useState<WhoopData>({
    connected: false,
    loading: true,
    recovery: [],
    sleep: [],
    error: null,
  });

  const load = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Check connection status first
      const status = await fetchWhoop('status');
      if (!status.connected) {
        setData({ connected: false, loading: false, recovery: [], sleep: [], error: null });
        return;
      }

      // Fetch recovery and sleep in parallel
      const [recoveryRes, sleepRes] = await Promise.all([
        fetchWhoop('recovery'),
        fetchWhoop('sleep'),
      ]);

      setData({
        connected: true,
        loading: false,
        recovery: recoveryRes.records || [],
        sleep: sleepRes.records || [],
        error: null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      if (msg === 'NOT_CONNECTED') {
        setData({ connected: false, loading: false, recovery: [], sleep: [], error: null });
      } else {
        setData((prev) => ({ ...prev, loading: false, error: msg }));
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const disconnect = useCallback(async () => {
    await fetch('/api/whoop/disconnect', { method: 'POST' });
    setData({ connected: false, loading: false, recovery: [], sleep: [], error: null });
  }, []);

  return { ...data, refresh: load, disconnect };
}
