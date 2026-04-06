'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { DRUGS } from '../../data/drugs';
import { DCAT } from '../../data/presets';
import type { ActiveDrugs } from '../../lib/pharmacology';

interface DrugCatalogProps {
  activeDrugs: ActiveDrugs;
  onAdd: (id: string) => void;
}

export default function DrugCatalog({ activeDrugs, onAdd }: DrugCatalogProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const filteredIds = useMemo(() => {
    let ids = Object.keys(DRUGS);
    if (category !== 'all') {
      const cat = DCAT[category];
      if (cat && cat.d) {
        ids = ids.filter((id) => cat.d!.includes(id));
      }
    }
    if (search) {
      const sq = search.toLowerCase();
      ids = ids.filter((id) => {
        const d = DRUGS[id];
        return (
          d.n.toLowerCase().includes(sq) ||
          d.s.toLowerCase().includes(sq) ||
          id.toLowerCase().includes(sq)
        );
      });
    }
    return ids;
  }, [search, category]);

  const handleAdd = useCallback(
    (id: string) => {
      if (activeDrugs.hasOwnProperty(id)) return;
      onAdd(id);
    },
    [activeDrugs, onAdd]
  );

  return (
    <div id="catalog-section" className="open">
      <input
        className="dsearch"
        type="text"
        placeholder="Поиск препарата..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="dtabs">
        {Object.keys(DCAT).map((k) => (
          <div
            key={k}
            className={`dtab${category === k ? ' act' : ''}`}
            onClick={() => setCategory(k)}
          >
            {DCAT[k].l}
          </div>
        ))}
      </div>
      <div className="dg">
        {filteredIds.map((id) => {
          const d = DRUGS[id];
          const inScheme = activeDrugs.hasOwnProperty(id);
          return (
            <div
              key={id}
              className={`di${inScheme ? ' in-scheme' : ''}`}
              style={{ '--c': d.c } as React.CSSProperties}
              onClick={() => handleAdd(id)}
              title={d.n + (inScheme ? ' (добавлен)' : '')}
            >
              <div
                className="ddt"
                style={
                  inScheme
                    ? {
                        background: 'var(--c)',
                        boxShadow: '0 0 8px var(--c)',
                      }
                    : undefined
                }
              />
              <span>{d.s}</span>
            </div>
          );
        })}
      </div>
      <div className="disclaimer">
        Образовательный инструмент. НЕ медицинский совет.
      </div>
    </div>
  );
}
