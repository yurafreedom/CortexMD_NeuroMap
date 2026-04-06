'use client';

import React from 'react';
import DeficitCard from './DeficitCard';
import type { Deficit, DeficitStatus } from '../../data/defaultDeficits';
import type { ActiveDrugs } from '../../lib/pharmacology';

interface DeficitListProps {
  deficits: Deficit[];
  activeDrugs: ActiveDrugs;
  selectedDeficit: string | null;
  onSelect: (id: string) => void;
  onStatusChange: (id: string, status: DeficitStatus) => void;
  onDelete: (id: string) => void;
  onZoneClick?: (zoneId: string) => void;
  onZoneHover?: (zoneId: string | null) => void;
}

export default function DeficitList({
  deficits,
  activeDrugs,
  selectedDeficit,
  onSelect,
  onStatusChange,
  onDelete,
  onZoneClick,
  onZoneHover,
}: DeficitListProps) {
  return (
    <div id="dfc">
      {deficits.map((df) => (
        <DeficitCard
          key={df.id}
          deficit={df}
          activeDrugs={activeDrugs}
          isSelected={selectedDeficit === df.id}
          onSelect={() => onSelect(df.id)}
          onStatusChange={(status) => onStatusChange(df.id, status)}
          onDelete={() => onDelete(df.id)}
          onZoneClick={onZoneClick || (() => {})}
          onZoneHover={onZoneHover || (() => {})}
        />
      ))}
    </div>
  );
}
