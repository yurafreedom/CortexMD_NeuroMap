'use client';

import React, { useState, useCallback } from 'react';
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
const RIGHT_PANEL_WIDTH = 340;

export default function Home() {
  // Hooks
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

  // Local UI state
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [sigma1Open, setSigma1Open] = useState(false);
  const [zonePopup, setZonePopup] = useState<{
    position: { x: number; y: number };
    zoneId: string;
  } | null>(null);
  const [brainOpacity, setBrainOpacity] = useState(0.15);
  const [chatOpen, setChatOpen] = useState(false);
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  // Event handlers
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
      if (id && event) {
        setTooltip({ text: id, x: event.clientX, y: event.clientY });
      } else {
        setTooltip(null);
      }
    },
    [],
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
          className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-[120px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)',
            top: '10%',
            left: '20%',
            animationDuration: '8s',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[100px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, #f472b6 0%, transparent 70%)',
            top: '40%',
            right: '15%',
            animationDuration: '12s',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-25 blur-[80px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)',
            bottom: '10%',
            left: '40%',
            animationDuration: '10s',
          }}
        />

        {/* 3D Brain Canvas */}
        <BrainCanvas
          activeDrugs={scheme}
          selectedRegion={selectedRegion}
          selectedDeficit={selectedDeficit}
          onRegionClick={handleRegionClick}
          onRegionHover={handleRegionHover}
          opacity={brainOpacity}
          rightPanelOpen={rightPanelOpen}
          leftPanelWidth={LEFT_PANEL_WIDTH}
          rightPanelWidth={RIGHT_PANEL_WIDTH}
        />
      </div>

      {/* Zone Popup (conditional, positioned) */}
      {zonePopup && (
        <ZonePopup
          zoneId={zonePopup.zoneId}
          position={zonePopup.position}
          activeDrugs={scheme}
          onClose={closeZonePopup}
          onOpenDetail={openRegionDetail}
        />
      )}

      {/* Left Panel (always visible, fixed 280px) */}
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

      {/* Right Panel (slide-in) */}
      <RightPanel
        isOpen={rightPanelOpen}
        selectedRegion={selectedRegion}
        activeDrugs={scheme}
        deficits={deficits}
        onClose={() => setRightPanelOpen(false)}
        onToggle={toggleRightPanel}
        onShowSigma1={showSigma1}
        onSelectDeficit={selectDeficit}
      />

      {/* Bottom Bar (fixed bottom) */}
      <div
        className="absolute bottom-0 z-20"
        style={{
          left: LEFT_PANEL_WIDTH,
          right: rightPanelOpen ? RIGHT_PANEL_WIDTH : 0,
          height: 48,
          transition: 'right 0.3s ease',
        }}
      >
        <BottomBar activeDrugs={scheme} />
      </div>

      {/* Sigma-1 Cascade Overlay (conditional) */}
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
            background: 'linear-gradient(135deg,#6ee7b7,#818cf8)',
            border: 'none', cursor: 'pointer', fontSize: 20,
            boxShadow: '0 4px 20px rgba(110,231,183,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#080b12', fontWeight: 700,
          }}
          title="AI Ассистент"
        >
          💬
        </button>
      )}

      {/* Tooltip (follows mouse on region hover) */}
      {tooltip && (
        <div
          className="fixed z-50 px-2 py-1 text-xs text-white bg-black/80 rounded pointer-events-none whitespace-nowrap"
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
