
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Mic, MicOff, Volume2, X, Terminal, Loader2, Sparkles } from 'lucide-react';

const AI_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

// Audio Utility Functions as per Guidelines
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const VoiceAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopSession = useCallback(() => {
    setIsActive(false);
    setIsAiSpeaking(false);
    
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }

    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    
    sessionPromiseRef.current?.then(session => session.close());
    sessionPromiseRef.current = null;
  }, []);

  const startSession = async () => {
    setIsConnecting(true);
    setUserTranscript('');
    setAiTranscript('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      const sessionPromise = ai.live.connect({
        model: AI_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: 'You are an expert chemist assistant for ChemLab Pro. You help users understand chemical reactions, elements, and stoichiometry. Keep responses concise and scientific. When asked to balance a reaction, do it step by step.',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Data
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputCtx) {
              setIsAiSpeaking(true);
              const startAt = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsAiSpeaking(false);
              };
              source.start(startAt);
              nextStartTimeRef.current = startAt + audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Transcriptions
            if (message.serverContent?.inputTranscription) {
              setUserTranscript(prev => prev + message.serverContent!.inputTranscription!.text);
            }
            if (message.serverContent?.outputTranscription) {
              setAiTranscript(prev => prev + message.serverContent!.outputTranscription!.text);
            }
            if (message.serverContent?.turnComplete) {
              // Reset local transcripts for the next turn if desired, or keep history
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsAiSpeaking(false);
            }
          },
          onerror: (err) => {
            console.error('Gemini Live Error:', err);
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error('Failed to start voice session:', err);
      setIsConnecting(false);
      stopSession();
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      {/* Transcript Overlay */}
      {(isActive || isConnecting) && (
        <div className="w-80 sm:w-96 bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-6 mb-2 animate-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Quantum Link Status</span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
               <span className="text-[10px] font-bold text-slate-500 uppercase">{isConnecting ? 'Syncing...' : 'Active'}</span>
            </div>
          </div>

          <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar py-2">
            {userTranscript && (
              <div className="animate-in fade-in slide-in-from-left-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">Researcher</p>
                <p className="text-sm text-slate-300 font-medium leading-relaxed bg-slate-800/50 p-3 rounded-xl rounded-tl-none border border-slate-700/50">
                  {userTranscript}
                </p>
              </div>
            )}
            {aiTranscript && (
              <div className="animate-in fade-in slide-in-from-right-2">
                <p className="text-[10px] font-black text-cyan-500 uppercase tracking-tighter mb-1 text-right">ChemLab AI</p>
                <p className="text-sm text-cyan-100 font-medium leading-relaxed bg-cyan-900/20 p-3 rounded-xl rounded-tr-none border border-cyan-500/20">
                  {aiTranscript}
                </p>
              </div>
            )}
            {!userTranscript && !aiTranscript && isActive && (
              <div className="text-center py-8">
                <p className="text-xs text-slate-500 italic">"What is the electron configuration of Gold?"</p>
              </div>
            )}
            {isConnecting && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Calibrating Audio Array</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        onClick={isActive ? stopSession : startSession}
        disabled={isConnecting}
        className={`
          group relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl
          ${isActive 
            ? 'bg-red-500/10 border-2 border-red-500/50 text-red-500 scale-110' 
            : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white hover:scale-110 active:scale-95'
          }
          ${isConnecting ? 'opacity-50 cursor-wait' : 'opacity-100'}
        `}
      >
        {/* Animated Orbits when active */}
        {isActive && (
          <>
            <div className="absolute inset-0 rounded-full border border-red-500/30 animate-ping" />
            <div className="absolute -inset-2 rounded-full border border-red-500/20 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
               {[...Array(4)].map((_, i) => (
                 <div 
                   key={i} 
                   className="absolute w-full h-[2px] bg-red-500/40"
                   style={{ transform: `rotate(${i * 45}deg) scaleX(${isAiSpeaking ? 1.5 : 1})`, transition: 'transform 0.2s' }}
                 />
               ))}
            </div>
          </>
        )}

        {/* User Voice Reaction Orbs */}
        {!isActive && !isConnecting && (
          <div className="absolute -inset-1 rounded-full bg-cyan-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
        )}

        {isActive ? <MicOff className="w-7 h-7 relative z-10" /> : <Mic className="w-7 h-7 relative z-10" />}
      </button>
      
      {/* Floating Sparkles Badge */}
      {!isActive && (
        <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl animate-bounce pointer-events-none">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Ask ChemLab</span>
        </div>
      )}
    </div>
  );
};
