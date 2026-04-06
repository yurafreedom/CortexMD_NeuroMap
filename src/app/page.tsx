'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { BrainCanvas } from '@/components/Brain3D';
import LeftPanel from '@/components/Panels/LeftPanel';
import RightPanel from '@/components/Panels/RightPanel';
import BottomBar from '@/components/Panels/BottomBar';
import ZonePopup from '@/components/Panels/ZonePopup';
import CascadeOverlay from '@/components/Sigma1/CascadeOverlay';
import ChatPanel from '@/components/Chat/ChatPanel';
import { useScheme } from '@/hooks/useScheme';
import { useDeficits } from '@/hooks/useDeficits';

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
  const [zonePopup, setZonePopup] = useState<{
    position: { x: number; y: number };
    zoneId: string;
  } | null>(null);
  const [brainOpacity, setBrainOpacity] = useState(0.15);
  const [chatOpen, setChatOpen] = useState(false);
  const [conflictZones, setConflictZones] = useState<string[]>([]);
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // БЛОК D: Auto-hide right panel after 6s of inactivity
  useEffect(() => {
    if (!rightPanelOpen) return;

    let timer = setTimeout(() => setRightPanelOpen(false), 6000);

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setRightPanelOpen(false), 6000);
    };

    const panel = rightPanelRef.current;
    if (panel) {
      panel.addEventListener('mousemove', reset);
      panel.addEventListener('click', reset);
    }

    return () => {
      clearTimeout(timer);
      if (panel) {
        panel.removeEventListener('mousemove', reset);
        panel.removeEventListener('click', reset);
      }
    };
  }, [rightPanelOpen]);

  const handleRegionClick = useCallback(
    (id: string | null, screenPos?: { x: number; y: number }) => {
      setSelectedRegion(id);
      if (id && screenPos) {
        setZonePopup({ position: screenPos, zoneId: id });
      } else {
        setZonePopup(null);
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
            bottom: 48,
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

      {/* Left Panel */}
      <div
        className="absolute top-0 left-0 h-full z-20"
        style={{ width: LEFT_PANEL_WIDTH }}
      >
        <LeftPanel
          activeDrugs={scheme}
          onAddDrug={addDrug}
          onRemoveDrug={removeDrug}
          onUpdateDose={updateDose}
          onApplyPreset={applyPreset}
          deficits={deficits}
          selectedDeficit={selectedDeficit}
          onSelectDeficit={selectDeficit}
          onDeficitStatusChange={changeStatus}
          onDeficitDelete={deleteDeficit}
          onOpacityChange={setBrainOpacity}
          onZoneClick={handleZoneClickFromPanel}
        />
      </div>

      {/* Right Panel — БЛОК C: overlays canvas, no resize */}
      <div ref={rightPanelRef}>
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

      {/* Bottom Bar — always from left panel to right edge */}
      <div
        className="absolute bottom-0 z-20"
        style={{
          left: LEFT_PANEL_WIDTH,
          right: 0,
          height: 48,
        }}
      >
        <BottomBar activeDrugs={scheme} />
      </div>

      {/* Sigma-1 Cascade Overlay */}
      <CascadeOverlay
        isOpen={sigma1Open}
        activeDrugs={scheme}
        onClose={() => setSigma1Open(false)}
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
            position: 'fixed', right: 20, bottom: 64, zIndex: 40,
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
          className="zone-hover-label fixed z-50"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 8,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
