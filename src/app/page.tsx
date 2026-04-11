'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { BrainCanvas } from '@/components/Brain3D';
import CanvasControls from '@/components/Brain3D/CanvasControls';
import LeftPanel from '@/components/Panels/LeftPanel';
import RightPanel from '@/components/Panels/RightPanel';
import BottomBar from '@/components/Panels/BottomBar';
import type { IndicatorKey } from '@/components/Panels/BottomBar';
import ZonePopup from '@/components/Panels/ZonePopup';
import CascadeOverlay from '@/components/Sigma1/CascadeOverlay';
import GlutamateCascadeOverlay from '@/components/GlutamateCascade/GlutamateCascadeOverlay';
import { DopaminePopup, SerotoninPopup, NorepinephrinePopup, GlutamatePopup, CYPPopup } from '@/components/IndicatorPopup';
import { DRUGS_V2 } from '@/data/drugs.v2';
import type { ActiveDrug } from '@/lib/indicators/balance';
import ChatPanel from '@/components/Chat/ChatPanel';
import Topbar from '@/components/Header/Topbar';
import { useScheme } from '@/hooks/useScheme';
import { useDeficits } from '@/hooks/useDeficits';
import DeficitsModal from '@/components/BrainDeficits/DeficitsModal';
import { Z } from '@/styles/zIndex';

const LEFT_PANEL_WIDTH = 280;

export default function Home() {
  const t = useTranslations('dashboard');
  const {
    scheme,
    addDrug,
    removeDrug,
    updateDose,
    applyPreset,
    clearScheme,
  } = useScheme();

  const {
    deficits,
    selectedDeficit,
    selectDeficit,
    changeStatus,
    deleteDeficit,
  } = useDeficits();

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [sigma1Open, setSigma1Open] = useState(false);
  const [indicatorPopup, setIndicatorPopup] = useState<IndicatorKey | null>(null);
  const [gluCascadeOpen, setGluCascadeOpen] = useState(false);
  const [zonePopup, setZonePopup] = useState<{
    position: { x: number; y: number };
    zoneId: string;
  } | null>(null);
  const [brainOpacity, setBrainOpacity] = useState(0.15);
  const [chatOpen, setChatOpen] = useState(false);
  const [deficitsModalOpen, setDeficitsModalOpen] = useState(false);
  const [conflictZones, setConflictZones] = useState<string[]>([]);
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Convert scheme to ActiveDrug[] for detail popups
  const activeDrugList = useMemo((): ActiveDrug[] => {
    const result: ActiveDrug[] = [];
    for (const [id, dose] of Object.entries(scheme)) {
      const drug = DRUGS_V2[id];
      if (drug) result.push({ drug, dose_mg: dose });
    }
    return result;
  }, [scheme]);

  const handleIndicatorClick = useCallback((key: IndicatorKey) => {
    if (key === 's1') {
      setSigma1Open(true);
    } else {
      setIndicatorPopup(key);
    }
  }, []);

  // Cmd+K / Ctrl+K hotkey for AI chat + Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setChatOpen(true);
      }
      if (e.key === 'Escape' && chatOpen) {
        setChatOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [chatOpen]);


  const handleRegionClick = useCallback(
    (id: string | null, screenPos?: { x: number; y: number }) => {
      // Clicking empty canvas (null) — do nothing, keep panel open
      if (!id) return;

      setSelectedRegion(id);
      if (screenPos) {
        setZonePopup({ position: screenPos, zoneId: id });
      }
    },
    [],
  );

  const handleRegionHover = useCallback(
    (id: string | null, event?: MouseEvent) => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      if (id && event) {
        if (zonePopup?.zoneId === id) {
          setTooltip(null);
          return;
        }
        const x = event.clientX;
        const y = event.clientY;
        hoverTimerRef.current = setTimeout(() => {
          setTooltip({ text: id, x, y });
        }, 300);
      } else {
        setTooltip(null);
      }
    },
    [zonePopup],
  );

  const toggleRightPanel = useCallback(() => {
    setRightPanelOpen((prev) => !prev);
  }, []);

  const showSigma1 = useCallback(() => {
    setSigma1Open(true);
  }, []);

  const closeZonePopup = useCallback(() => {
    setZonePopup(null);
  }, []);

  const openRegionDetail = useCallback(() => {
    setRightPanelOpen(true);
    setZonePopup(null);
  }, []);

  const handleConflictHover = useCallback((zones: string[]) => {
    setConflictZones(zones);
  }, []);

  const handleConflictLeave = useCallback(() => {
    setConflictZones([]);
  }, []);

  const handleZoneClickFromPanel = useCallback(
    (zoneId: string) => {
      setSelectedRegion(zoneId);
      if (!rightPanelOpen) setRightPanelOpen(true);
    },
    [rightPanelOpen],
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a12]">
      {/* Background animated blobs */}
      <div id="cv" className="absolute inset-0">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.08] blur-[120px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(180,200,230,0.8) 0%, transparent 70%)',
            top: '10%',
            left: '20%',
            animationDuration: '8s',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.08] blur-[100px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(140,160,200,0.8) 0%, transparent 70%)',
            top: '40%',
            right: '15%',
            animationDuration: '12s',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.08] blur-[80px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(80,100,140,0.8) 0%, transparent 70%)',
            bottom: '10%',
            left: '40%',
            animationDuration: '10s',
          }}
        />

        {/* 3D Brain Canvas — БЛОК C: always left:280px to right:0, right panel overlays */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: LEFT_PANEL_WIDTH,
            right: 0,
            bottom: 0,
          }}
        >
          <BrainCanvas
            activeDrugs={scheme}
            selectedRegion={selectedRegion}
            selectedDeficit={selectedDeficit}
            conflictZones={conflictZones}
            onRegionClick={handleRegionClick}
            onRegionHover={handleRegionHover}
            opacity={brainOpacity}
            rightPanelOpen={false}
            leftPanelWidth={LEFT_PANEL_WIDTH}
            rightPanelWidth={0}
          />
          <CanvasControls
            opacity={Math.round(brainOpacity * 100)}
            onOpacityChange={(v) => setBrainOpacity(v / 100)}
          />
        </div>
      </div>

      {/* Zone Popup */}
      {zonePopup && (
        <ZonePopup
          zoneId={zonePopup.zoneId}
          position={zonePopup.position}
          activeDrugs={scheme}
          onClose={closeZonePopup}
          onOpenDetail={openRegionDetail}
        />
      )}

      {/* Topbar */}
      <Topbar />

      {/* Left Panel */}
      <div
        className="absolute top-0 left-0 h-full"
        style={{ width: LEFT_PANEL_WIDTH, zIndex: Z.leftPanel }}
      >
        <LeftPanel
          activeDrugs={scheme}
          onAddDrug={addDrug}
          onRemoveDrug={removeDrug}
          onUpdateDose={updateDose}
          onApplyPreset={applyPreset}
        />
      </div>

      {/* Right Panel — БЛОК C: overlays canvas, no resize */}
      <div>
        <RightPanel
          isOpen={rightPanelOpen}
          selectedRegion={selectedRegion}
          activeDrugs={scheme}
          deficits={deficits}
          onClose={() => setRightPanelOpen(false)}
          onToggle={toggleRightPanel}
          onShowSigma1={showSigma1}
          onSelectDeficit={selectDeficit}
          onConflictHover={handleConflictHover}
          onConflictLeave={handleConflictLeave}
        />
      </div>

      {/* Bottom Bar — glass pill */}
      <BottomBar
        activeDrugs={scheme}
        onIndicatorClick={handleIndicatorClick}
        deficitCount={deficits.length}
        onDeficitsClick={() => setDeficitsModalOpen(true)}
      />

      {/* Brain Deficits Modal */}
      <DeficitsModal
        isOpen={deficitsModalOpen}
        onClose={() => setDeficitsModalOpen(false)}
        deficits={deficits}
        activeDrugs={scheme}
        selectedDeficit={selectedDeficit}
        onSelectDeficit={selectDeficit}
        onDeficitStatusChange={changeStatus}
        onDeficitDelete={deleteDeficit}
        onZoneClick={handleZoneClickFromPanel}
      />

      {/* Sigma-1 Cascade Overlay */}
      <CascadeOverlay
        isOpen={sigma1Open}
        activeDrugs={scheme}
        onClose={() => setSigma1Open(false)}
      />

      {/* Indicator detail popups */}
      <DopaminePopup
        isOpen={indicatorPopup === 'da'}
        onClose={() => setIndicatorPopup(null)}
        activeDrugs={activeDrugList}
      />
      <NorepinephrinePopup
        isOpen={indicatorPopup === 'na'}
        onClose={() => setIndicatorPopup(null)}
        activeDrugs={activeDrugList}
      />
      <SerotoninPopup
        isOpen={indicatorPopup === '5ht'}
        onClose={() => setIndicatorPopup(null)}
        activeDrugs={activeDrugList}
      />
      <GlutamatePopup
        isOpen={indicatorPopup === 'glu'}
        onClose={() => setIndicatorPopup(null)}
        activeDrugs={activeDrugList}
        onShowCascade={() => setGluCascadeOpen(true)}
      />
      <GlutamateCascadeOverlay
        isOpen={gluCascadeOpen}
        activeDrugs={activeDrugList}
        onClose={() => setGluCascadeOpen(false)}
      />
      <CYPPopup
        isOpen={indicatorPopup === 'cyp'}
        onClose={() => setIndicatorPopup(null)}
        activeDrugs={activeDrugList}
      />

      {/* AI Chat */}
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        activeDrugs={scheme}
        deficits={deficits}
        zoneContext={selectedRegion || undefined}
      />
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            position: 'fixed', right: 16, bottom: 16, zIndex: Z.chatFab,
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg,#60a5fa,#818cf8)',
            border: 'none', cursor: 'pointer', fontSize: 20,
            boxShadow: '0 4px 20px rgba(96,165,250,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#080b12', fontWeight: 700,
          }}
          title={t('aiAssistant')}
        >
          AI
        </button>
      )}

      {/* Tooltip (follows mouse on region hover) — E5 with background */}
      {tooltip && !zonePopup && (
        <div
          className="zone-hover-label fixed"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 8,
            zIndex: Z.hoverLabel,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
