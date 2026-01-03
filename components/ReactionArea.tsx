
import React, { useState, useMemo } from 'react';
import { Beaker, Play, RotateCcw, Sparkles, Loader2, Info, CheckCircle2, AlertCircle, Scale, Flame, Zap, Atom, ThermometerSnowflake, Waves, MousePointer2, Database, X, Eraser } from 'lucide-react';
import { BalancedReactionResponse, CompoundDetails } from '../types';
import { balanceReaction } from '../services/geminiService';
import { PERIODIC_TABLE, ELEMENT_CATEGORIES, COMMON_REACTIONS } from '../constants';

interface ReactionAreaProps {
  reactants: string;
  setReactants: React.Dispatch<React.SetStateAction<string>>;
  onRandom: () => void;
  onElementClick: (symbol: string) => void;
  onProductClick: (compound: CompoundDetails) => void;
  onReactionResult?: (result: BalancedReactionResponse) => void;
}

const ReactionArea: React.FC<ReactionAreaProps> = ({ reactants, setReactants, onRandom, onElementClick, onProductClick, onReactionResult }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BalancedReactionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocal, setIsLocal] = useState(false);

  const handleStart = async () => {
    const input = reactants.trim();
    if (!input) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setIsLocal(false);

    // 1. Search Local First
    const normalizedInput = input.toLowerCase().replace(/\s+/g, '');
    const localMatch = COMMON_REACTIONS.find(r => 
      r.reactants.toLowerCase().replace(/\s+/g, '') === normalizedInput
    );

    if (localMatch) {
      setIsLocal(true);
    }

    try {
      const response = await balanceReaction(input);
      setLoading(false);
      if (response.error) {
        setError(response.error);
      } else {
        setResult(response);
        if (onReactionResult) onReactionResult(response);
      }
    } catch (e) {
      setError("Analysis failed. The neural node encountered an unexpected molecular state.");
      setLoading(false);
    }
  };

  const handleReset = () => {
    setReactants("");
    setResult(null);
    setError(null);
  };

  const clearInputOnly = () => {
    setReactants("");
  };

  // Helper to suggest common fixes for chemical input errors
  const getSuggestions = () => {
    if (!error) return null;
    return [
      "Ensure proper capitalization (e.g., 'NaCl' not 'nacl').",
      "Check for typos in element symbols (e.g., 'Fe' for Iron).",
      "Use '+' to separate different reactants.",
      "Verify that the elements exist in the registry below."
    ];
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-4 sm:p-6 rounded-2xl shadow-xl relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-slate-900/60 z-10 flex items-center justify-center backdrop-blur-[2px]">
             <div className="flex flex-col items-center gap-4">
               <div className="relative">
                 <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-400 animate-spin" />
                 {isLocal && <Database className="w-4 h-4 text-cyan-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
               </div>
               <div className="text-center">
                 <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] block">
                   {isLocal ? 'Retreiving from Cache...' : 'Quantum Balancing...'}
                 </span>
               </div>
             </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Beaker className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white uppercase tracking-wider">Molecular Processor</h2>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
             <Database className="w-3 h-3 text-slate-500" />
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{COMMON_REACTIONS.length} Cached Reactions</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow group">
            <input
              type="text"
              value={reactants}
              onChange={(e) => setReactants(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              placeholder="e.g. N2 + H2"
              className="w-full bg-slate-900 border-2 border-slate-700 text-cyan-100 font-mono text-lg sm:text-xl p-3 sm:p-4 pr-12 rounded-xl focus:border-cyan-500 transition-all placeholder:text-slate-600 shadow-inner"
              disabled={loading}
            />
            {reactants && !loading && (
              <button 
                onClick={clearInputOnly}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                title="Clear input"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
          <button
            onClick={handleStart}
            disabled={loading || !reactants.trim()}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold text-white hover:from-cyan-500 transition-all shadow-lg active:scale-95 sm:min-w-[160px]"
          >
            <div className="flex items-center justify-center gap-2">
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base tracking-widest uppercase">PROCESS</span>
            </div>
          </button>
        </div>

        <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
          <button onClick={onRandom} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs sm:text-sm transition-colors border border-slate-600">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> Quick Example
          </button>
          <button onClick={clearInputOnly} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs sm:text-sm transition-colors border border-slate-600">
            <Eraser className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" /> Clear
          </button>
          <button onClick={handleReset} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs sm:text-sm transition-colors border border-slate-600">
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" /> Full Reset
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 sm:p-6 bg-red-500/10 border border-red-500/30 rounded-xl space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 shrink-0" />
              <div>
                <h4 className="font-bold text-red-200 mb-1 uppercase tracking-wider text-[10px] sm:text-xs">Processing Error</h4>
                <p className="text-red-200/80 text-xs sm:text-sm leading-relaxed">{error}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-red-500/20">
               <div className="flex items-center gap-2 mb-2">
                 <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400/60" />
                 <span className="text-[9px] sm:text-[10px] font-black text-red-400/60 uppercase tracking-widest">Corrective Actions</span>
               </div>
               <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                 {getSuggestions()?.map((s, i) => (
                   <li key={i} className="text-[10px] sm:text-[11px] text-red-300/60 flex items-center gap-1.5">
                     <div className="w-1 h-1 bg-red-400/40 rounded-full" /> {s}
                   </li>
                 ))}
               </ul>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="bg-slate-800/80 backdrop-blur-xl border border-cyan-500/30 p-4 sm:p-8 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 space-y-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
               {isLocal && <Database className="w-3 h-3 text-cyan-400" />}
               <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.3em]">
                 {isLocal ? 'Cached Equation Match' : 'Neural Node Calculation'}
               </p>
            </div>
            <h3 className="text-2xl sm:text-5xl font-mono font-bold text-white break-words px-2 leading-relaxed">
              {result.balancedEquation}
            </h3>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-cyan-500/10 rounded-full border border-cyan-500/20 text-[10px] font-bold text-cyan-300 uppercase tracking-widest">{result.reactionType}</div>
              {result.thermodynamics && (
                <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border ${result.thermodynamics.isExothermic ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                  {result.thermodynamics.isExothermic ? <Flame className="w-3 h-3" /> : <ThermometerSnowflake className="w-3 h-3" />}
                  <span className="text-[10px] font-bold uppercase tracking-widest">{result.thermodynamics.isExothermic ? 'Exothermic' : 'Endothermic'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-700 p-4 sm:p-5 rounded-xl text-center">
            <div className="flex items-center justify-center gap-2 mb-4 text-slate-500">
               <MousePointer2 className="w-3 h-3" />
               <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Products: Click for Deep Scan</span>
            </div>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {result.productDetails?.map((compound, i) => (
                <button
                  key={i}
                  onClick={() => onProductClick(compound)}
                  className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-cyan-500/50 rounded-xl transition-all group flex flex-col items-center shadow-lg min-w-[120px] sm:min-w-[140px]"
                >
                  <span className="text-xl sm:text-2xl font-mono font-black text-cyan-400 group-hover:scale-110 transition-transform">{compound.formula}</span>
                  <div className="mt-1 flex flex-col">
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-200 uppercase tracking-tighter">{compound.name}</span>
                    {compound.commonName && (
                      <span className="text-[8px] sm:text-[9px] font-black text-amber-500/80 uppercase tracking-widest leading-none mt-1">({compound.commonName})</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {result.thermodynamics && (
              <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-4 sm:p-6 relative">
                 <div className="flex items-center gap-2 mb-4">
                    <Waves className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Enthalpy Heatmap</span>
                 </div>
                 <div className="relative h-24 sm:h-32 w-full rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
                    <div className={`absolute inset-0 transition-opacity duration-1000 ${result.thermodynamics.isExothermic ? 'bg-gradient-to-r from-transparent via-orange-600/20 to-red-600/40' : 'bg-gradient-to-r from-blue-600/40 via-cyan-600/20 to-transparent'}`} style={{ opacity: 0.3 + result.thermodynamics.energyIntensity * 0.7 }} />
                    <div className="relative z-10 text-center">
                       <p className={`text-3xl sm:text-4xl font-black font-mono tracking-tighter ${result.thermodynamics.isExothermic ? 'text-orange-400' : 'text-cyan-400'}`}>
                         {result.thermodynamics.enthalpyChange ? `${result.thermodynamics.enthalpyChange > 0 ? '+' : ''}${result.thermodynamics.enthalpyChange}` : '??'}
                         <span className="text-sm sm:text-lg ml-1 opacity-60">kJ/mol</span>
                       </p>
                    </div>
                 </div>
                 <p className="text-[11px] text-slate-400 leading-relaxed italic border-l-2 border-slate-700 pl-3 mt-4">{result.thermodynamics.description}</p>
              </div>
            )}

            <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-3 bg-slate-700/50 flex items-center gap-2 border-b border-slate-700 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Stoichiometry Check</div>
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="p-3 text-[9px] font-bold text-slate-500 uppercase">Element</th>
                      <th className="p-3 text-[9px] font-bold text-slate-500 uppercase text-center">In</th>
                      <th className="p-3 text-[9px] font-bold text-slate-500 uppercase text-center">Out</th>
                      <th className="p-3 text-[9px] font-bold text-slate-500 uppercase text-right">Bal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.elementCounts.map((el) => {
                      const elData = PERIODIC_TABLE[el.symbol];
                      return (
                        <tr key={el.symbol} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                          <td className="p-3">
                            <button onClick={() => onElementClick(el.symbol)} className="flex items-center gap-2 hover:bg-slate-700/50 p-1 rounded transition-all group">
                              <span className="font-mono font-bold group-hover:underline text-xs" style={{ color: ELEMENT_CATEGORIES[elData?.category]?.color || '#fff' }}>{el.symbol}</span>
                            </button>
                          </td>
                          <td className="p-3 text-center font-mono text-slate-300 text-xs">{el.before}</td>
                          <td className="p-3 text-center font-mono text-slate-300 text-xs">{el.after}</td>
                          <td className="p-3 text-right">
                            {el.isBalanced ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 ml-auto" /> : <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 ml-auto" />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReactionArea;
