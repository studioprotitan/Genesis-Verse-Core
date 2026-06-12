/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useGameStore } from '../store';
import { Sparkles, Moon, Zap, CloudRain, Activity, Sun } from 'lucide-react';

export function EnvironmentTelemetry() {
  const environment = useGameStore(state => state.environment);
  const gameState = useGameStore(state => state.gameState);

  // Render a contextual weather status icon
  const getIcon = () => {
    switch (environment.type) {
      case 'eclipse':
        return <Moon className="w-5 h-5 text-amber-500 drop-shadow-[0_0_6px_#f59e0b]" id="env-icon-eclipse" />;
      case 'overload':
        return <Zap className="w-5 h-5 text-fuchsia-500 drop-shadow-[0_0_6px_#d946ef]" id="env-icon-overload" />;
      case 'nanite_storm':
        return <CloudRain className="w-5 h-5 text-green-400 drop-shadow-[0_0_6px_#4ade80]" id="env-icon-storm" />;
      case 'nebula':
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_6px_#22d3ee]" id="env-icon-nebula" />;
    }
  };

  // Return custom styling colors matching each weather phase
  const getThemeColors = () => {
    switch (environment.type) {
      case 'eclipse':
        return {
          border: 'border-amber-500/25 shadow-[0_0_15px_rgba(245,158,11,0.15)] bg-amber-950/15',
          badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
          text: 'text-amber-400'
        };
      case 'overload':
        return {
          border: 'border-fuchsia-500/25 shadow-[0_0_15px_rgba(217,70,239,0.15)] bg-fuchsia-950/15',
          badge: 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30',
          text: 'text-fuchsia-400'
        };
      case 'nanite_storm':
        return {
          border: 'border-green-500/25 shadow-[0_0_15px_rgba(34,197,94,0.15)] bg-green-950/15',
          badge: 'bg-green-500/10 text-green-400 border border-green-500/30',
          text: 'text-green-400'
        };
      case 'nebula':
      default:
        return {
          border: 'border-cyan-500/25 shadow-[0_0_15px_rgba(34,211,238,0.15)] bg-cyan-950/15',
          badge: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
          text: 'text-cyan-400'
        };
    }
  };

  const colors = getThemeColors();

  return (
    <div 
      id="env-weather-telemetry"
      className={`flex flex-col gap-2 p-3 rounded bg-black/75 border backdrop-blur-md select-none pointer-events-auto w-52 text-xs transition-all duration-500 ${colors.border}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
        <span className="text-[8px] uppercase font-bold tracking-[0.16em] text-cyan-500/60">VECTOR ENGINE [VTR-LT-1.0.0]</span>
        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${colors.badge}`}>
          {environment.type.replace('_', ' ')}
        </span>
      </div>

      {/* Main Condition Info */}
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-slate-900/60 rounded border border-white/5">
          {getIcon()}
        </div>
        <div className="flex flex-col gap-0.5 max-w-[130px]">
          <span className={`font-bold tracking-wide text-xs ${colors.text}`}>
            {environment.name}
          </span>
          <span className="text-[9px] text-slate-400 leading-normal">
            {environment.description}
          </span>
        </div>
      </div>

      {/* Cores Logic Display */}
      <div className="flex items-center justify-between text-[8px] font-mono border-t border-b border-white/5 py-1 text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          GEMINI-A: <strong className="text-white">COGNITIVE</strong>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse"></span>
          GEMINI-B: <strong className="text-white">SYNTHETIC</strong>
        </span>
      </div>

      {/* Dynamic Telemetry Metrics */}
      <div className="grid grid-cols-2 gap-2 mt-0.5 font-mono text-[9px] text-slate-400">
        <div className="flex flex-col gap-0.5 bg-slate-950/40 p-1 rounded border border-white/5">
          <span className="text-[7px] uppercase tracking-wider text-slate-500 font-bold">RIFT DENSITY</span>
          <div className="flex justify-between items-center mt-0.5">
            <span className="font-semibold text-white">{(environment.fogDensity * 1000).toFixed(0)} ppt</span>
            <Activity className="w-2.5 h-2.5 text-cyan-400/40" />
          </div>
        </div>
        <div className="flex flex-col gap-0.5 bg-slate-950/40 p-1 rounded border border-white/5">
          <span className="text-[7px] uppercase tracking-wider text-slate-500 font-bold">LUMINANCE</span>
          <div className="flex justify-between items-center mt-0.5">
            <span className="font-semibold text-white">{(environment.lightIntensity * 100).toFixed(0)}%</span>
            <Sun className="w-2.5 h-2.5 text-amber-400/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
