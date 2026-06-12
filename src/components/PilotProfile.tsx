import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../store';
import { soundManager } from '../utils/audio';
import { 
  User, 
  Shield, 
  Award, 
  Cpu, 
  RefreshCw, 
  Edit2, 
  Check, 
  Lock, 
  Zap, 
  Clock, 
  Camera, 
  Info
} from 'lucide-react';

const RANDOM_NAMES = [
  'AERO-ZERO',
  'VALKYRIE-09',
  'CYPHER-CORE',
  'SENTRY-X7',
  'PHANTOM-99',
  'CHRONOS-X',
  'HALO-RIDER',
  'ARC-SOLIS',
  'XENON-ALPHA',
  'GHOST-CHASSIS'
];

const PRESET_AVATARS = [
  { 
    id: 'visor-cyan', 
    label: 'Echelon Cyan Visor', 
    url: '/src/assets/images/pilot_avatar_cyber_1781258061439.jpg' 
  },
  { 
    id: 'visor-amber', 
    label: 'Abyssum Amber Visor', 
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=300&auto=format&fit=crop' 
  },
  { 
    id: 'visor-magenta', 
    label: 'Vortex Magenta Visor', 
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop' 
  },
  { 
    id: 'visor-emerald', 
    label: 'Sentry Emerald Visor', 
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300&auto=format&fit=crop' 
  }
];

export function PilotProfile() {
  const pilotName = useGameStore(state => state.pilotName);
  const pilotHours = useGameStore(state => state.pilotHours);
  const pilotAvatarUrl = useGameStore(state => state.pilotAvatarUrl);
  const setPilotProfile = useGameStore(state => state.setPilotProfile);

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(pilotName);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Sync state changes to input
  useEffect(() => {
    setNameInput(pilotName);
  }, [pilotName]);

  // Compute Rank based on Hours
  const getRankInfo = (hours: number) => {
    if (hours < 15) {
      return {
        title: 'COGNITIVE CADET',
        nextTitle: 'VECTOR REAVER',
        nextThreshold: 50,
        progress: (hours / 50) * 100,
        color: 'text-cyan-400 border-cyan-500/20 bg-cyan-950/20',
        badgeColor: 'bg-cyan-500'
      };
    } else if (hours < 50) {
      return {
        title: 'VECTOR REAVER',
        nextTitle: 'CHASSIS SPECIALIST',
        nextThreshold: 100,
        progress: ((hours - 15) / 85) * 100,
        color: 'text-amber-400 border-amber-500/20 bg-amber-950/20',
        badgeColor: 'bg-amber-500'
      };
    } else if (hours < 100) {
      return {
        title: 'CHASSIS SPECIALIST',
        nextTitle: 'ECHELON SOVEREIGN',
        nextThreshold: 200,
        progress: ((hours - 50) / 150) * 100,
        color: 'text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-950/20',
        badgeColor: 'bg-fuchsia-500'
      };
    } else {
      return {
        title: 'ECHELON SOVEREIGN ELITE',
        nextTitle: 'MAX LEVEL CORPS',
        nextThreshold: 200,
        progress: 100,
        color: 'text-rose-400 border-rose-500/20 bg-rose-950/20',
        badgeColor: 'bg-rose-500'
      };
    }
  };

  const rank = getRankInfo(pilotHours);

  const handleSaveName = () => {
    const trimmed = nameInput.trim().toUpperCase();
    if (trimmed && trimmed.length <= 16) {
      setPilotProfile({ name: trimmed });
      setIsEditing(false);
      soundManager.playSysAlert('click');
    } else {
      soundManager.playSysAlert('click');
    }
  };

  const handleSynthesizeName = () => {
    const currentNameIndex = RANDOM_NAMES.indexOf(pilotName);
    let nextIndex = Math.floor(Math.random() * RANDOM_NAMES.length);
    if (nextIndex === currentNameIndex) {
      nextIndex = (nextIndex + 1) % RANDOM_NAMES.length;
    }
    const name = RANDOM_NAMES[nextIndex];
    setPilotProfile({ name });
    setNameInput(name);
    soundManager.playSysAlert('click');
  };

  const handleAccrueHours = () => {
    const hoursAdded = 2.5;
    const updatedHours = parseFloat((pilotHours + hoursAdded).toFixed(1));
    setPilotProfile({ hours: updatedHours });
    soundManager.playSysAlert('ping');
  };

  const handleSelectAvatar = (url: string) => {
    setPilotProfile({ avatarUrl: url });
    soundManager.playSysAlert('click');
    setShowAvatarModal(false);
  };

  return (
    <div className="w-full bg-slate-950/90 border border-cyan-500/15 rounded-2xl p-4 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-md text-slate-300 font-mono text-left select-none animate-fade-in mb-6">
      {/* Decorative cyber borders */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-amber-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
      <div className="absolute top-2 right-2 text-[7px] text-cyan-500 opacity-40 font-bold">IDENTITY: REG-VIII</div>

      <div className="flex flex-col md:flex-row gap-6 items-center">
        {/* Left Side: Avatar Panel */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden border border-cyan-500/30 relative shadow-[0_0_20px_rgba(6,182,212,0.15)] group-hover:border-cyan-400 bg-zinc-950 flex items-center justify-center">
            <img 
              src={pilotAvatarUrl} 
              alt="Pilot Cyber Visor" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Scanlines / hologram effects overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(6,182,212,0.1)_50%)] bg-[length:100%_4px] opacity-40 pointer-events-none" />
            
            {/* Camera Switch Hover Overlay */}
            <button 
              onClick={() => {
                soundManager.playSysAlert('click');
                setShowAvatarModal(true);
              }}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center gap-1 text-[8px] text-cyan-300 font-bold cursor-pointer"
            >
              <Camera className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span>SWAP VISOR</span>
            </button>
          </div>

          <div className="absolute -bottom-2 -left-1 text-[7px] bg-cyan-950/90 border border-cyan-500/30 text-cyan-400 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider scale-90">
            VISOR LINKED
          </div>
        </div>

        {/* Right Side: Identity Dossier and Interaction panel */}
        <div className="flex-1 w-full flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-2">
            
            {/* Name/Edit input and display */}
            <div className="flex flex-col">
              <span className="text-[8px] font-black tracking-widest text-zinc-500 uppercase">SYS PILOT IDENTIFIER</span>
              {isEditing ? (
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="text" 
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={14}
                    className="bg-zinc-950 border border-cyan-500/50 rounded px-2.5 py-1 text-sm font-bold text-white uppercase font-mono tracking-wider focus:outline-none focus:border-cyan-400 w-44"
                    placeholder="ENTER SIGN"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <button 
                    onClick={handleSaveName}
                    className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-400 rounded transition cursor-pointer"
                    title="Commit to Echelon records"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 mt-0.5">
                  <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300 tracking-tight uppercase">
                    {pilotName}
                  </span>
                  <button 
                    onClick={() => {
                      soundManager.playSysAlert('click');
                      setIsEditing(true);
                    }}
                    className="p-1 hover:bg-white/5 text-zinc-500 hover:text-cyan-400 rounded transition cursor-pointer"
                    title="Edit pilot sign"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={handleSynthesizeName}
                    className="px-2 py-0.5 border border-cyan-500/25 hover:border-cyan-400 text-cyan-400 hover:text-white bg-cyan-950/10 hover:bg-cyan-900/10 text-[7px] font-black tracking-widest uppercase rounded cursor-pointer transition flex items-center gap-1"
                    title="Synthesize new cyber signet"
                  >
                    <RefreshCw className="w-2.5 h-2.5 animate-[spin_5s_infinite_linear]" />
                    SYNTHESIZE SIGN
                  </button>
                </div>
              )}
            </div>

            {/* Rank badge */}
            <div className={`px-3 py-1.5 rounded-lg border flex flex-col items-end leading-none font-bold ${rank.color}`}>
              <span className="text-[7px] tracking-widest text-zinc-500 uppercase">PILOT LICENSING RANK</span>
              <span className="text-xs font-black tracking-tight mt-1 uppercase flex items-center gap-1">
                <Award className="w-3.5 h-3.5 shrink-0" />
                {rank.title}
              </span>
            </div>
          </div>

          {/* Bottom Grid: Flight Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-1 items-center">
            
            {/* Total Flight Hours Column */}
            <div className="bg-white/[0.02] border border-white/5 p-2 rounded-lg flex justify-between items-center min-h-[46px]">
              <div className="flex flex-col">
                <span className="text-[7.5px] text-zinc-500 font-extrabold tracking-widest uppercase">TRAINING HOURS Accrued</span>
                <span className="text-sm font-black text-white mt-1 font-mono tracking-tight flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  {pilotHours.toFixed(1)} <span className="text-[9px] text-zinc-500 uppercase font-black">HRS</span>
                </span>
              </div>
              <button 
                onClick={handleAccrueHours}
                className="px-2 py-1 bg-cyan-500/15 hover:bg-cyan-500 text-cyan-400 hover:text-black font-black uppercase text-[7.5px] tracking-widest rounded cursor-pointer transition border border-cyan-500/20 hover:border-transparent flex items-center gap-1 shadow-lg"
                title="Accumulate active chassis operating hours"
              >
                <Zap className="w-2.5 h-2.5 animate-bounce" />
                ACCRUE +2.5H
              </button>
            </div>

            {/* Progress to next Rank */}
            <div className="bg-white/[0.02] border border-white/5 p-2 rounded-lg col-span-2 flex flex-col justify-between min-h-[46px]">
              <div className="flex justify-between items-center text-[7.5px] text-zinc-500 font-extrabold tracking-widest uppercase">
                <span>NEXT PROMOTION CLEARANCE</span>
                <span className="text-white font-bold">{rank.nextTitle} ({Math.round(rank.progress)}%)</span>
              </div>
              
              <div className="flex items-center gap-2 mt-1 w-full">
                <div className="flex-1 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5 relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${rank.progress}%` }}
                    className={`h-full ${rank.badgeColor} shadow-[0_0_10px_rgba(6,182,212,0.4)]`}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                  />
                </div>
                <span className="text-[8px] text-zinc-500 font-bold tracking-tight">{pilotHours.toFixed(1)}/{rank.nextThreshold}h</span>
              </div>
            </div>

          </div>

          <div className="text-[7.5px] text-zinc-500 font-mono flex flex-wrap gap-2.5 mt-1 border-t border-white/[0.02] pt-2">
            <span>NEURAL SYNC INDEX: <strong className="text-emerald-400">99.8% NOMINAL</strong></span>
            <span>CLEARANCE STAGE: <strong className="text-fuchsia-400">STAGE VIII (APEX)</strong></span>
            <span>CHASSIS RESIDUAL: <strong className="text-amber-400">0.02% WAVE-FLEX</strong></span>
          </div>
        </div>
      </div>

      {/* Avatar Visor Swapping Modal overlay */}
      <AnimatePresence>
        {showAvatarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md mx-4 bg-slate-950 border border-cyan-500/25 rounded-2xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.9)] rel"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-black tracking-widest text-white uppercase">SYNTHESIZE CYBER VISOR</span>
                </div>
                <button 
                  onClick={() => {
                    soundManager.playSysAlert('click');
                    setShowAvatarModal(false);
                  }}
                  className="text-zinc-500 hover:text-white transition cursor-pointer text-xs"
                >
                  [CLOSE]
                </button>
              </div>

              <p className="text-[9px] text-zinc-400 leading-normal mb-4 font-sans mt-2">
                Recalibrate neural visor wavelength mapping. Swapping credentials shifts visual signal overlays in telemetry.
              </p>

              <div className="grid grid-cols-2 gap-3.5 mb-2">
                {PRESET_AVATARS.map((avatar) => {
                  const isCurrent = pilotAvatarUrl === avatar.url;
                  return (
                    <button
                      key={avatar.id}
                      onClick={() => handleSelectAvatar(avatar.url)}
                      className={`relative rounded-xl overflow-hidden p-1 border text-left flex gap-2 items-center duration-150 transition-all cursor-pointer ${
                        isCurrent 
                          ? 'border-cyan-400 bg-cyan-950/20' 
                          : 'border-white/5 bg-zinc-950 hover:border-cyan-500/30'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative bg-zinc-900 border border-white/5">
                        <img 
                          src={avatar.url} 
                          alt={avatar.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col overflow-hidden leading-none justify-center">
                        <span className={`text-[9px] font-black tracking-tight truncate ${isCurrent ? 'text-cyan-300' : 'text-zinc-300'}`}>
                          {avatar.label.split(' ')[1]} Core
                        </span>
                        <span className="text-[7px] text-zinc-500 uppercase mt-1 leading-none">{isCurrent ? 'LINKED' : 'READY'}</span>
                      </div>
                      {isCurrent && (
                        <div className="absolute right-1 top-1 w-1 h-1 rounded-full bg-cyan-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
