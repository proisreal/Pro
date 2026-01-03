
import React, { useState, useMemo } from 'react';
import { Atom, Search, Menu, X, Info, Zap, FlaskConical, CircleDot, Microscope, Thermometer, Hash, History, Radiation, Box, Loader2, Beaker, Terminal, Cpu } from 'lucide-react';
import ReactionArea from './components/ReactionArea';
import PeriodicTable from './components/PeriodicTable';
import AtomVisualizer3D from './components/AtomVisualizer3D';
import { VoiceAssistant } from './components/VoiceAssistant';
import { COMMON_REACTIONS, PERIODIC_TABLE, ELEMENT_CATEGORIES } from './constants';
import { getMolecularGeometry } from './services/geminiService';
import { MolecularGeometry, CompoundDetails, BalancedReactionResponse } from './types';

const App: React.FC = () => {
  const [reactants, setReactants] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedCompound, setSelectedCompound] = useState<CompoundDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'physical' | 'atomic' | 'history' | '3d'>('overview');
  
  const [visualSearch, setVisualSearch] = useState('');
  const [visualData, setVisualData] = useState<MolecularGeometry | null>(null);
  const [isVisualLoading, setIsVisualLoading] = useState(false);

  const handleRandomReaction = () => {
    const random = COMMON_REACTIONS[Math.floor(Math.random() * COMMON_REACTIONS.length)];
    setReactants(random.reactants);
  };

  const handleElementClick = (symbol: string) => {
    setSelectedElement(symbol);
    setSelectedCompound(null);
    setVisualData(null); 
    if (activeTab === 'history' || activeTab === 'overview') setActiveTab('overview');
    if (window.innerWidth < 1024) document.getElementById('atomic-inspector')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleProductClick = async (compound: CompoundDetails) => {
    setSelectedCompound(compound);
    setSelectedElement(null);
    setIsVisualLoading(true);
    setActiveTab('overview');
    
    const geometry = await getMolecularGeometry(compound.formula);
    if (geometry) setVisualData(geometry);
    setIsVisualLoading(false);
    
    if (window.innerWidth < 1024) document.getElementById('atomic-inspector')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReactionResult = (result: BalancedReactionResponse) => {
    if (result.productDetails && result.productDetails.length > 0) {
      handleProductClick(result.productDetails[0]);
    }
  };

  const handleVisualSearch = async () => {
    if (!visualSearch.trim()) return;
    setIsVisualLoading(true);
    setActiveTab('3d');
    
    const elementMatch = Object.keys(PERIODIC_TABLE).find(
      s => s.toLowerCase() === visualSearch.toLowerCase() || 
           PERIODIC_TABLE[s].name.toLowerCase() === visualSearch.toLowerCase()
    );

    if (elementMatch) {
      setSelectedElement(elementMatch);
      setSelectedCompound(null);
      setVisualData(null);
    } else {
      const geometry = await getMolecularGeometry(visualSearch);
      if (geometry) {
        setVisualData(geometry);
        setSelectedElement(null);
        setSelectedCompound(null);
      }
    }
    setIsVisualLoading(false);
  };

  const highlightedSymbols = useMemo(() => {
    const symbols = new Set<string>();
    const regex = /[A-Z][a-z]?/g;
    let match;
    while ((match = regex.exec(reactants)) !== null) {
      if (PERIODIC_TABLE[match[0]]) symbols.add(match[0]);
    }
    return Array.from(symbols);
  }, [reactants]);

  const addElementToInput = (symbol: string) => {
    const current = reactants.trim();
    if (!current) setReactants(symbol);
    else if (current.endsWith('+')) setReactants(`${current} ${symbol}`);
    else setReactants(`${current} + ${symbol}`);
  };

  const selectedElementData = selectedElement ? PERIODIC_TABLE[selectedElement] : null;
  const showInspector = !!(selectedElementData || selectedCompound || visualData || isVisualLoading || activeTab === '3d');

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-inter selection:bg-cyan-500/30">
      <nav className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              <Atom className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black italic tracking-tighter uppercase leading-none">Atomic <span className="text-cyan-400">HUD</span></h1>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Quantum Nexus v3.5</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900/50 rounded-full border border-white/5">
               <Cpu className="w-3.5 h-3.5 text-cyan-400" />
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Neural Link Active</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-screen-2xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
        <div className="lg:col-span-8 space-y-8 sm:space-y-12">
          <ReactionArea 
            reactants={reactants} setReactants={setReactants} 
            onRandom={handleRandomReaction} onElementClick={handleElementClick}
            onProductClick={handleProductClick} onReactionResult={handleReactionResult}
          />
          
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-cyan-500" />
                <h2 className="text-base sm:text-lg font-black uppercase tracking-[0.2em] text-slate-400">Atomic Registry</h2>
              </div>
              <div className="relative w-full sm:w-80 group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                   <Terminal className="w-3.5 h-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                </div>
                <input 
                  type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Query Element Registry..."
                  className="w-full bg-slate-900/50 border border-white/5 focus:border-cyan-500/50 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all placeholder:text-slate-700 shadow-inner"
                />
              </div>
            </div>
            <PeriodicTable searchTerm={searchTerm} onElementClick={handleElementClick} highlightedSymbols={highlightedSymbols} />
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <div id="atomic-inspector" className="bg-slate-950/60 border border-white/5 rounded-3xl overflow-hidden sticky lg:top-28 shadow-2xl backdrop-blur-2xl min-h-[500px] lg:min-h-[700px] flex flex-col glow-border">
            <div className="p-4 sm:p-5 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Neural Inspector</span>
              </div>
              {showInspector && (
                <button onClick={() => { setSelectedElement(null); setSelectedCompound(null); setVisualData(null); }} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="p-4 sm:p-8 flex-grow flex flex-col">
              {showInspector ? (
                <div className="animate-in fade-in zoom-in-95 duration-300 flex-grow flex flex-col">
                  {selectedElementData && (
                    <div className="flex items-start justify-between mb-6 sm:mb-8">
                      <div className="flex items-baseline gap-4">
                        <h3 className="text-4xl sm:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">{selectedElement}</h3>
                        <div className="flex flex-col">
                          <span className="text-[10px] sm:text-xs font-black text-cyan-400 uppercase tracking-widest">{selectedElementData.number}</span>
                          <p className="text-lg sm:text-xl text-slate-300 font-bold leading-tight">{selectedElementData.name}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCompound && (
                    <div className="flex items-start justify-between mb-6 sm:mb-8">
                      <div className="flex items-baseline gap-3 sm:gap-4">
                        <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tighter italic">{selectedCompound.formula}</h3>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest leading-none mb-1">
                            Spectral Scan {selectedCompound.commonName ? `• ${selectedCompound.commonName}` : ''}
                          </span>
                          <p className="text-lg sm:text-xl text-slate-300 font-bold leading-tight">{selectedCompound.name}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mb-6 sm:mb-8 border-b border-white/5 overflow-x-auto no-scrollbar pb-3">
                    {[
                      { id: 'overview', label: 'Info', icon: Info },
                      { id: 'physical', label: 'Physics', icon: Thermometer },
                      { id: 'atomic', label: 'Atomic', icon: Zap },
                      { id: '3d', label: 'Visualizer', icon: Box }
                    ].map(tab => (
                      <button 
                        key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                      >
                        <tab.icon className="w-3 h-3" /> {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex-grow flex flex-col">
                    {activeTab === '3d' ? (
                      <div className="animate-in zoom-in-95 duration-500 flex flex-col flex-grow">
                         <div className="mb-4 sm:mb-6 flex items-center gap-3 bg-slate-900/80 p-2 rounded-2xl border border-white/5 group shadow-inner">
                           <div className="p-2 sm:p-2.5 bg-slate-800 rounded-xl group-focus-within:bg-cyan-500 transition-colors">
                             <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 group-focus-within:text-slate-950 transition-colors" />
                           </div>
                           <input 
                             type="text" value={visualSearch} onChange={(e) => setVisualSearch(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && handleVisualSearch()}
                             placeholder="Search Quantum Database..."
                             className="flex-grow bg-transparent text-xs sm:text-sm font-mono text-cyan-100 outline-none placeholder:text-slate-700"
                           />
                           <button onClick={handleVisualSearch} className="p-2 sm:p-2.5 bg-white/5 hover:bg-cyan-600 rounded-xl text-slate-400 hover:text-slate-950 transition-all">
                             <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                           </button>
                         </div>

                         {isVisualLoading ? (
                           <div className="flex flex-col items-center justify-center py-20 sm:py-32 gap-6 flex-grow bg-slate-900/20 rounded-3xl border border-white/5">
                             <div className="relative">
                               <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-500 animate-spin" />
                               <div className="absolute inset-0 blur-xl bg-cyan-500/20 animate-pulse" />
                             </div>
                             <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.4em] animate-pulse">Syncing Molecular Grid</p>
                           </div>
                         ) : (
                           <div className="flex-grow flex flex-col animate-in fade-in duration-700 min-h-[300px]">
                             <AtomVisualizer3D geometry={visualData} elementSymbol={selectedElement} />
                             {(visualData || selectedCompound) && (
                               <div className="mt-4 sm:mt-6 p-4 sm:p-5 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
                                 <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed font-medium">
                                   {visualData?.description || selectedCompound?.description}
                                 </p>
                               </div>
                             )}
                           </div>
                         )}
                      </div>
                    ) : (
                      <div className="animate-in fade-in duration-400 space-y-4 sm:space-y-6">
                        {activeTab === 'overview' && (
                          <div className="p-4 sm:p-6 bg-slate-900/50 rounded-2xl border border-white/5 shadow-inner">
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium italic opacity-80">
                              {selectedElementData 
                                ? (selectedElementData.properties ? `"${selectedElementData.properties}"` : "Physical and chemical properties data pending for this element.") 
                                : (selectedCompound ? `"${selectedCompound.description}"` : "")}
                            </p>
                          </div>
                        )}
                        {activeTab === 'physical' && (
                          <div className="grid grid-cols-2 gap-3 sm:gap-4">
                             {[
                               { label: 'Melting', val: selectedElementData ? `${selectedElementData.meltingPoint || '?'} K` : selectedCompound?.physicalProperties.meltingPoint },
                               { label: 'Boiling', val: selectedElementData ? `${selectedElementData.boilingPoint || '?'} K` : selectedCompound?.physicalProperties.boilingPoint },
                               { label: 'Density', val: selectedElementData ? `${selectedElementData.density || '?'} g/cm³` : selectedCompound?.physicalProperties.density },
                               { label: 'Electroneg.', val: selectedElementData ? selectedElementData.electronegativity : selectedCompound?.physicalProperties.solubility }
                             ].map((prop, i) => (
                               <div key={i} className="p-3 sm:p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-cyan-500/50 transition-colors">
                                 <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase block mb-1 group-hover:text-cyan-400 transition-colors">{prop.label}</span>
                                 <span className="text-sm sm:text-base font-mono font-bold text-slate-200">{prop.val || 'N/A'}</span>
                               </div>
                             ))}
                          </div>
                        )}
                        {activeTab === 'atomic' && (
                          <div className="space-y-4">
                             <div className="p-4 sm:p-5 bg-white/5 rounded-2xl border border-white/5">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Orbital / Shell Config</p>
                               <div className="font-mono text-xs sm:text-sm text-cyan-200 bg-slate-950 p-3 sm:p-4 rounded-xl border border-white/5 break-all">
                                 {selectedElementData?.electronConfig || selectedCompound?.atomicInsights.bondingType}
                               </div>
                             </div>
                             <div className="p-4 sm:p-5 bg-white/5 rounded-2xl border border-white/5">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Geometric State</p>
                               <div className="text-xs sm:text-sm font-bold text-slate-400 bg-slate-950 p-3 sm:p-4 rounded-xl border border-white/5">
                                 {selectedElementData?.oxidationStates || selectedCompound?.atomicInsights.geometry || 'Molecular Geometry Active'}
                               </div>
                             </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedElement && (
                    <button onClick={() => addElementToInput(selectedElement!)} className="w-full mt-6 sm:mt-auto py-3 sm:py-4 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 text-slate-950 font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 group">
                      <Zap className="w-4 h-4 transition-transform group-hover:rotate-12" /> BOND TO PROCESSOR
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-20 sm:py-32 text-center flex-grow flex flex-col items-center justify-center">
                  <div className="relative mb-8 group">
                    <div className="absolute inset-0 blur-3xl bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-all rounded-full" />
                    <div className="relative p-8 sm:p-10 bg-slate-900 rounded-full border border-white/5 shadow-2xl">
                      <FlaskConical className="w-12 h-12 sm:w-16 sm:h-16 text-slate-700" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mb-10">Standby for Deep Scan</p>
                  <button 
                    onClick={() => handleElementClick('H')} 
                    className="flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-3.5 bg-slate-900 hover:bg-white/5 rounded-2xl border border-white/10 text-[10px] sm:text-xs font-black uppercase tracking-widest text-cyan-400 transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                  >
                    <Microscope className="w-4 h-4" /> Initialize Sensor Array
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>
      <VoiceAssistant />
    </div>
  );
};

export default App;
