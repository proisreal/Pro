
import React from 'react';
import { ElementData } from '../types';
import { ELEMENT_CATEGORIES } from '../constants';

interface ElementTileProps {
  symbol: string;
  data: ElementData;
  onClick: (symbol: string) => void;
  highlighted?: boolean;
}

const ElementTile: React.FC<ElementTileProps> = ({ symbol, data, onClick, highlighted }) => {
  const category = ELEMENT_CATEGORIES[data.category] || ELEMENT_CATEGORIES['Unknown'];

  return (
    <button
      onClick={() => onClick(symbol)}
      className={`
        relative group flex flex-col items-center justify-between p-1 rounded-sm border 
        transition-all duration-300 transform hover:scale-125 active:scale-90
        ${category.bg} ${category.border} 
        ${highlighted ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 shadow-xl shadow-cyan-500/50 z-20 scale-110 border-white' : 'hover:z-10 shadow-sm'}
      `}
      style={{ aspectRatio: '1/1', minWidth: '42px' }}
    >
      {/* Atomic Number (Top-Left) */}
      <span className="absolute top-0.5 left-1 text-[0.45rem] font-bold leading-none" style={{ color: category.color }}>
        {data.number}
      </span>

      {/* Valence Electrons (Top-Right) */}
      {data.valenceElectrons !== undefined && (
        <span className="absolute top-0.5 right-1 text-[0.4rem] font-black leading-none opacity-60 flex flex-col items-center">
          <span className="text-[0.3rem] scale-75 leading-[1px] mb-[2px]">VAL</span>
          {data.valenceElectrons}
        </span>
      )}
      
      {/* Symbol (Large Center) */}
      <span className="text-base font-black tracking-tighter mt-1" style={{ color: category.color }}>
        {symbol}
      </span>
      
      {/* Name and Mass (Bottom Area) */}
      <div className="flex flex-col items-center leading-[0.5rem] mb-0.5">
        <span className="text-[0.35rem] font-bold text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
          {data.name}
        </span>
        <span className="text-[0.35rem] font-medium text-slate-500">
          {data.mass.toFixed(2)}
        </span>
      </div>

      {/* Background glow on highlight */}
      {highlighted && (
        <div className="absolute inset-0 bg-white/10 animate-pulse rounded-sm" />
      )}
    </button>
  );
};

export default ElementTile;
