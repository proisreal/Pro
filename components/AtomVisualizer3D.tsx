
import React, { useRef, useEffect, useMemo } from 'react';
import { MolecularGeometry } from '../types';
import { PERIODIC_TABLE, ELEMENT_CATEGORIES } from '../constants';

interface AtomVisualizer3DProps {
  geometry: MolecularGeometry | null;
  elementSymbol?: string | null;
}

const AtomVisualizer3D: React.FC<AtomVisualizer3DProps> = ({ geometry, elementSymbol }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowCanvasRef = useRef<HTMLCanvasElement>(null);
  const nucleusParticles = useRef<{ x: number; y: number; z: number; isCyan: boolean; offset: number }[]>([]);

  // Calculate scientific data for the HUD
  const atomicStats = useMemo(() => {
    if (!elementSymbol || !PERIODIC_TABLE[elementSymbol]) return null;
    const data = PERIODIC_TABLE[elementSymbol];
    const protons = data.number;
    const neutrons = Math.max(0, Math.round((data.mass || data.number * 2.1) - data.number));
    const electrons = protons;
    const valence = data.valenceElectrons;

    // Bohr Model shell distribution: 2n^2
    const shells: number[] = [];
    let remaining = electrons;
    let n = 1;
    while (remaining > 0) {
      const capacity = 2 * Math.pow(n, 2);
      const inShell = Math.min(remaining, capacity);
      shells.push(inShell);
      remaining -= inShell;
      n++;
    }

    return { protons, neutrons, electrons, shells, valence };
  }, [elementSymbol]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const glowCanvas = glowCanvasRef.current;
    if (!canvas || !glowCanvas) return;
    const ctx = canvas.getContext('2d');
    const glowCtx = glowCanvas.getContext('2d');
    if (!ctx || !glowCtx) return;

    let animationFrameId: number;
    let time = 0;

    const initNucleus = (symbol: string) => {
      const elData = PERIODIC_TABLE[symbol];
      if (!elData) return;
      
      const numProtons = elData.number;
      const numNeutrons = Math.max(0, Math.round((elData.mass || elData.number * 2.1) - elData.number));
      const totalNucleons = Math.min(120, numProtons + numNeutrons);
      
      const particles: typeof nucleusParticles.current = [];
      const phi = Math.PI * (3 - Math.sqrt(5));

      for (let i = 0; i < totalNucleons; i++) {
        const y = totalNucleons <= 1 ? 0 : 1 - (i / (totalNucleons - 1)) * 2;
        const radiusAtY = totalNucleons <= 1 ? 0 : Math.sqrt(Math.max(0, 1 - y * y));
        const theta = phi * i;
        const dist = Math.pow(Math.random(), 1/3);
        const r = (totalNucleons < 5 ? 14 : Math.sqrt(totalNucleons) * 5.5) * dist;
        
        particles.push({
          x: Math.cos(theta) * radiusAtY * r,
          y: y * r,
          z: Math.sin(theta) * radiusAtY * r,
          isCyan: i % 2 === 0,
          offset: Math.random() * Math.PI * 2
        });
      }
      nucleusParticles.current = particles;
    };

    if (elementSymbol) initNucleus(elementSymbol);

    const project = (x: number, y: number, z: number, rotY: number, rotX: number, w: number, h: number) => {
      const fov = 800;
      let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
      let z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
      let y1 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
      let z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);
      const scale = fov / (fov + z2 + 450);
      return { px: w/2 + x1 * scale, py: h/2 + y1 * scale, pz: z2, scale };
    };

    const render = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      glowCtx.clearRect(0, 0, width, height);
      time += 0.012;

      const rotY = time * 0.5;
      const rotX = Math.sin(time * 0.3) * 0.2;

      glowCtx.filter = 'blur(10px)';
      
      const drawFrame = (c: CanvasRenderingContext2D, isGlow: boolean) => {
        const opacityMult = isGlow ? 0.3 : 1;
        
        if (geometry) {
          const molScale = 140;
          geometry.bonds.forEach(([i, j]) => {
            const p1 = project(geometry.atoms[i].x * molScale, geometry.atoms[i].y * molScale, geometry.atoms[i].z * molScale, rotY, rotX, width, height);
            const p2 = project(geometry.atoms[j].x * molScale, geometry.atoms[j].y * molScale, geometry.atoms[j].z * molScale, rotY, rotX, width, height);
            c.strokeStyle = `rgba(34, 211, 238, ${0.4 * opacityMult})`;
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(p1.px, p1.py);
            c.lineTo(p2.px, p2.py);
            c.stroke();
          });

          geometry.atoms.forEach(atom => {
            const p = project(atom.x * molScale, atom.y * molScale, atom.z * molScale, rotY, rotX, width, height);
            const size = 18 * p.scale;
            const el = PERIODIC_TABLE[atom.symbol];
            const color = ELEMENT_CATEGORIES[el?.category]?.color || '#fff';
            const g = c.createRadialGradient(p.px - size*0.3, p.py - size*0.3, size*0.1, p.px, p.py, size);
            g.addColorStop(0, '#fff');
            g.addColorStop(0.2, color);
            g.addColorStop(1, '#000');
            c.fillStyle = g;
            c.beginPath();
            c.arc(p.px, p.py, size, 0, Math.PI * 2);
            c.fill();
            if (!isGlow) {
              c.fillStyle = '#fff';
              c.font = `bold ${size * 0.7}px "Inter"`;
              c.textAlign = 'center';
              c.fillText(atom.symbol, p.px, p.py + size/3);
            }
          });
        } else if (elementSymbol && atomicStats) {
          // Scientifically distributed electron shells
          atomicStats.shells.forEach((count, shellIdx) => {
            const radius = 100 + shellIdx * 45;
            const tiltY = (shellIdx * Math.PI) / atomicStats.shells.length;
            const tiltX = (shellIdx * Math.PI) / (atomicStats.shells.length * 1.5);

            // 1. Draw Path
            c.beginPath();
            c.strokeStyle = `rgba(255, 255, 255, ${0.4 * opacityMult})`;
            c.lineWidth = 1.2;
            for (let t = 0; t <= Math.PI * 2; t += 0.1) {
              const lx = Math.cos(t) * radius;
              const ly = Math.sin(t) * radius;
              const rx = lx * Math.cos(tiltY) - ly * Math.sin(tiltY) * Math.cos(tiltX);
              const ry = lx * Math.sin(tiltY) + ly * Math.cos(tiltY) * Math.cos(tiltX);
              const rz = ly * Math.sin(tiltX);
              const p = project(rx, ry, rz, rotY, rotX, width, height);
              if (t === 0) c.moveTo(p.px, p.py);
              else c.lineTo(p.px, p.py);
            }
            c.stroke();

            // 2. Draw Electrons for this shell
            for (let e = 0; e < count; e++) {
              const angle = ((time * (1 + shellIdx * 0.2)) + (e * (Math.PI * 2 / count))) % (Math.PI * 2);
              const lx = Math.cos(angle) * radius;
              const ly = Math.sin(angle) * radius;
              const rx = lx * Math.cos(tiltY) - ly * Math.sin(tiltY) * Math.cos(tiltX);
              const ry = lx * Math.sin(tiltY) + ly * Math.cos(tiltY) * Math.cos(tiltX);
              const rz = ly * Math.sin(tiltX);
              const ep = project(rx, ry, rz, rotY, rotX, width, height);
              const eSize = 7 * ep.scale;
              
              const eg = c.createRadialGradient(ep.px - eSize*0.2, ep.py - eSize*0.2, 0, ep.px, ep.py, eSize);
              eg.addColorStop(0, '#ff9999');
              eg.addColorStop(0.3, '#f43f5e');
              eg.addColorStop(1, '#991b1b');
              c.fillStyle = eg;
              c.beginPath();
              c.arc(ep.px, ep.py, eSize, 0, Math.PI * 2);
              c.fill();
            }
          });

          // Nucleus Cluster
          const sortedNucleus = [...nucleusParticles.current].sort((a, b) => {
             const pa = project(a.x, a.y, a.z, rotY, rotX, width, height);
             const pb = project(b.x, b.y, b.z, rotY, rotX, width, height);
             return pb.pz - pa.pz;
          });

          sortedNucleus.forEach(p => {
            const jitter = Math.sin(time * 3 + p.offset) * 0.4;
            const proj = project(p.x, p.y + jitter, p.z, rotY, rotX, width, height);
            const size = 11 * proj.scale;
            const color = p.isCyan ? '#2dd4bf' : '#fbbf24';
            const g = c.createRadialGradient(proj.px - size*0.3, proj.py - size*0.3, size*0.1, proj.px, proj.py, size);
            g.addColorStop(0, '#fff');
            g.addColorStop(0.2, color);
            g.addColorStop(1, '#000');
            c.fillStyle = g;
            c.beginPath();
            c.arc(proj.px, proj.py, size, 0, Math.PI * 2);
            c.fill();
          });
        }
      };

      drawFrame(glowCtx, true);
      drawFrame(ctx, false);
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [geometry, elementSymbol, atomicStats]);

  return (
    <div className="relative w-full aspect-square bg-[#020617] rounded-3xl border border-white/5 overflow-hidden shadow-2xl flex items-center justify-center glow-border">
      <canvas ref={glowCanvasRef} width={600} height={600} className="absolute w-full h-full opacity-60" />
      <canvas ref={canvasRef} width={600} height={600} className="relative w-full h-full z-10" />
      
      {/* Dynamic Atomic Composition Legend */}
      {atomicStats && (
        <div className="absolute top-6 left-6 z-20 flex flex-col gap-2 p-4 bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl min-w-[140px]">
           <div className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Protons</span>
               <span className="text-sm font-mono font-bold text-white">{atomicStats.protons}</span>
             </div>
           </div>
           <div className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Neutrons</span>
               <span className="text-sm font-mono font-bold text-white">{atomicStats.neutrons}</span>
             </div>
           </div>
           <div className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Total Electrons</span>
               <span className="text-sm font-mono font-bold text-rose-400">{atomicStats.electrons}</span>
             </div>
           </div>
           <div className="mt-1 pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Valence</span>
              <span className="text-lg font-mono font-black text-cyan-100">{atomicStats.valence || 'N/A'}</span>
           </div>
           <div className="mt-1">
              <span className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Shell Configuration</span>
              <div className="flex gap-1.5 flex-wrap">
                {atomicStats.shells.map((s, i) => (
                  <div key={i} className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] font-mono text-cyan-200">
                    {s}
                  </div>
                ))}
              </div>
           </div>
        </div>
      )}

      <div className="absolute top-8 right-8 pointer-events-none opacity-20 hidden sm:block">
        <div className="w-12 h-[2px] bg-cyan-400 mb-1" />
        <div className="w-6 h-[1px] bg-cyan-400" />
      </div>

      <div className="absolute bottom-8 right-8 flex flex-col items-end gap-1">
        <span className="text-[10px] font-mono font-bold text-cyan-400/50 uppercase tracking-[0.5em]">Quantum Grid Active</span>
        <div className="flex gap-1">
           <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_5px_#22d3ee]" />
           <div className="w-1 h-1 bg-cyan-500/50 rounded-full" />
           <div className="w-1 h-1 bg-cyan-500/30 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default AtomVisualizer3D;
