import React, { useMemo } from 'react';
import ElementTile from './ElementTile';
import { PERIODIC_TABLE } from '../constants';

interface PeriodicTableProps {
  searchTerm: string;
  onElementClick: (symbol: string) => void;
  highlightedSymbols: string[];
}

const PeriodicTable: React.FC<PeriodicTableProps> = ({ searchTerm, onElementClick, highlightedSymbols }) => {
  const filteredTable = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return Object.keys(PERIODIC_TABLE).filter(symbol => {
      const el = PERIODIC_TABLE[symbol];
      return symbol.toLowerCase().includes(term) || el.name.toLowerCase().includes(term);
    });
  }, [searchTerm]);

  const allElements = Object.entries(PERIODIC_TABLE);
  
  // Grid coordinates mapping
  const groups = Array.from({ length: 18 }, (_, i) => i + 1);
  const groupLabels = [
    { num: '1', iupac: 'IA', iupacOld: '1A' },
    { num: '2', iupac: 'IIA', iupacOld: '2A' },
    { num: '3', iupac: 'IIIB', iupacOld: '3B' },
    { num: '4', iupac: 'IVB', iupacOld: '4B' },
    { num: '5', iupac: 'VB', iupacOld: '5B' },
    { num: '6', iupac: 'VIB', iupacOld: '6B' },
    { num: '7', iupac: 'VIIB', iupacOld: '7B' },
    { num: '8', iupac: 'VIIIB', iupacOld: '8' },
    { num: '9', iupac: 'VIIIB', iupacOld: '8' },
    { num: '10', iupac: 'VIIIB', iupacOld: '8' },
    { num: '11', iupac: 'IB', iupacOld: '1B' },
    { num: '12', iupac: 'IIB', iupacOld: '2B' },
    { num: '13', iupac: 'IIIA', iupacOld: '3A' },
    { num: '14', iupac: 'IVA', iupacOld: '4A' },
    { num: '15', iupac: 'VA', iupacOld: '5A' },
    { num: '16', iupac: 'VIA', iupacOld: '6A' },
    { num: '17', iupac: 'VIIA', iupacOld: '7A' },
    { num: '18', iupac: 'VIIIA', iupacOld: '8A' },
  ];

  const periods = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl overflow-x-auto shadow-2xl relative">
      <div className="min-w-[1150px] space-y-8">
        {/* Main Table Title */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-slate-100 uppercase tracking-[0.2em]">Periodic Table of the Elements</h2>
        </div>

        {/* Main Body Grid */}
        <div className="grid grid-cols-[40px_repeat(18,minmax(0,1fr))] gap-1 auto-rows-min">
          
          {/* Group Column Headers */}
          <div className="col-start-1" /> {/* Period col placeholder */}
          {groupLabels.map((g, idx) => (
            <div key={`g-${idx}`} className="flex flex-col items-center justify-end pb-2">
              <span className="text-[10px] font-bold text-slate-100">{g.num}</span>
              <span className="text-[8px] font-medium text-slate-500">{g.iupac}</span>
              <span className="text-[8px] font-medium text-slate-500">{g.iupacOld}</span>
            </div>
          ))}

          {/* Period Row Headers */}
          {periods.map((p) => (
            <div 
              key={`p-${p}`} 
              className="flex items-center justify-center text-[12px] font-black text-slate-400 pr-3"
              style={{ gridRow: p + 1, gridColumn: 1 }}
            >
              {p}
            </div>
          ))}

          {/* Element Tiles */}
          {allElements.map(([symbol, data]) => (
            <div
              key={symbol}
              style={{
                gridRow: data.position[0] + 1,
                gridColumn: data.position[1] + 1
              }}
              className="z-10"
            >
              {filteredTable.includes(symbol) ? (
                <ElementTile
                  symbol={symbol}
                  data={data}
                  onClick={onElementClick}
                  highlighted={highlightedSymbols.includes(symbol)}
                />
              ) : (
                <div className="aspect-square opacity-5 bg-slate-800 rounded-sm border border-slate-700/20" />
              )}
            </div>
          ))}
          
          {/* Series Placeholders in Group 3 */}
          <div 
            className="flex items-center justify-center text-[9px] font-black text-slate-500 border-2 border-slate-800/30 rounded-sm bg-slate-900/50 p-1 aspect-square"
            style={{ gridRow: 6 + 1, gridColumn: 3 + 1 }}
          >
            57-71
          </div>
          <div 
            className="flex items-center justify-center text-[9px] font-black text-slate-500 border-2 border-slate-800/30 rounded-sm bg-slate-900/50 p-1 aspect-square"
            style={{ gridRow: 7 + 1, gridColumn: 3 + 1 }}
          >
            89-103
          </div>

          {/* Spacer between main table and F-Block */}
          <div style={{ gridRow: 8 + 1, gridColumn: '1 / span 19' }} className="h-10" />

          {/* F-Block Series Labels (Left of bottom rows) */}
          <div 
            className="flex flex-col justify-center items-end text-[9px] font-black text-slate-500 pr-3 leading-none text-right uppercase tracking-tighter"
            style={{ gridRow: 9 + 1, gridColumn: 1, gridColumnEnd: 4 }}
          >
            Lanthanide Series
          </div>
          <div 
            className="flex flex-col justify-center items-end text-[9px] font-black text-slate-500 pr-3 leading-none text-right uppercase tracking-tighter"
            style={{ gridRow: 10 + 1, gridColumn: 1, gridColumnEnd: 4 }}
          >
            Actinide Series
          </div>
        </div>
      </div>

      {/* Decorative corner indicators */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-slate-700" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-slate-700" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-slate-700" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-slate-700" />

      <style>{`
        .grid-cols-18 { 
          display: grid;
          grid-template-columns: repeat(18, minmax(0, 1fr)); 
        }
      `}</style>
    </div>
  );
};

export default PeriodicTable;