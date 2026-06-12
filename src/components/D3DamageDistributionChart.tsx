import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Sparkles, Activity, Shield, Flame, Target } from 'lucide-react';

interface D3DamageDistributionChartProps {
  damageHistory?: number[];
}

export function D3DamageDistributionChart({ damageHistory = [1200, 850, 1950, 1400, 2100] }: D3DamageDistributionChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 450, height: 220 });
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number; value: number } | null>(null);

  // ResizeObserver to ensure responsive SVG sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 280),
          height: Math.max(height, 180)
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const { width, height } = dimensions;
  const paddingX = 45;
  const paddingY = 32;

  // D3 calculations
  const chartData = useMemo(() => {
    return damageHistory.slice(-5);
  }, [damageHistory]);

  const xTicks = useMemo(() => {
    return chartData.map((_, i) => {
      if (i === chartData.length - 1) return 'CURRENT';
      return `M-${chartData.length - 1 - i}`;
    });
  }, [chartData]);

  // Generators for scales
  const xScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, chartData.length - 1])
      .range([paddingX, width - paddingX]);
  }, [chartData.length, width]);

  const yScale = useMemo(() => {
    const maxVal = d3.max(chartData) || 2500;
    // Add 15% head-room so nodes don't clip at the very top
    return d3.scaleLinear()
      .domain([0, maxVal * 1.15])
      .range([height - paddingY, paddingY]);
  }, [chartData, height]);

  // Generate ticks for Y gridlines
  const yTicks = useMemo(() => {
    const maxVal = d3.max(chartData) || 2500;
    return d3.ticks(0, maxVal * 1.15, 5);
  }, [chartData]);

  // Generators for paths
  const linePath = useMemo(() => {
    const generator = d3.line<number>()
      .x((d, i) => xScale(i))
      .y(d => yScale(d))
      .curve(d3.curveMonotoneX);
    return generator(chartData) || '';
  }, [chartData, xScale, yScale]);

  const areaPath = useMemo(() => {
    const generator = d3.area<number>()
      .x((d, i) => xScale(i))
      .y0(height - paddingY)
      .y1(d => yScale(d))
      .curve(d3.curveMonotoneX);
    return generator(chartData) || '';
  }, [chartData, xScale, yScale, height]);

  // Calculate trends for information display
  const averageDamage = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, v) => acc + v, 0);
    return Math.round(sum / chartData.length);
  }, [chartData]);

  const percentageTrend = useMemo(() => {
    if (chartData.length < 2) return 0;
    const prev = chartData[chartData.length - 2];
    const curr = chartData[chartData.length - 1];
    if (prev === 0) return 100;
    return Math.round(((curr - prev) / prev) * 100);
  }, [chartData]);

  return (
    <div className="w-full bg-white/[0.015] border border-white/5 rounded-xl p-4.5 text-left flex flex-col justify-between h-full min-h-[300px]">
      
      {/* Header telemetry info bar */}
      <div className="flex justify-between items-start border-b border-white/[0.04] pb-3 mb-2.5">
        <div className="flex flex-col">
          <span className="text-[7.5px] text-zinc-500 font-extrabold tracking-widest uppercase flex items-center gap-1">
            <Activity className="w-3 h-3 text-red-500 animate-pulse" />
            REALTIME VECTOR DISTRIBUTION LOGS
          </span>
          <h4 className="text-xs font-black text-white/90 uppercase tracking-wider mt-0.5 select-none">
            Damage Efficiency Trends
          </h4>
        </div>

        {/* Dynamic badge indicating up/down trend */}
        <div className="flex items-center gap-2">
          {percentageTrend >= 0 ? (
            <span className="text-[8px] bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 px-2 py-0.5 rounded font-black tracking-widest uppercase flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" />
              +{percentageTrend}% INCLINE
            </span>
          ) : (
            <span className="text-[8px] bg-rose-500/15 border border-rose-500/35 text-rose-400 px-2 py-0.5 rounded font-black tracking-widest uppercase flex items-center gap-0.5">
              <span className="inline-block transform rotate-180"><TrendingUp className="w-2.5 h-2.5" /></span>
              {percentageTrend}% DECLINE
            </span>
          )}
        </div>
      </div>

      {/* SVG graph container block with full-width capability */}
      <div ref={containerRef} className="flex-1 w-full relative min-h-[170px] select-none">
        
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            {/* Ambient cyber gradient definitions */}
            <linearGradient id="cyberAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.32" />
              <stop offset="50%" stopColor="#d946ef" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="cyberLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>

            {/* Glowing filter overlay to mimic fluorescent telemetry scope */}
            <filter id="scopeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Draw Y axis Grid Lines */}
          {yTicks.map((tick, index) => {
            const h = yScale(tick);
            return (
              <g key={index} className="opacity-40">
                <line
                  x1={paddingX}
                  y1={h}
                  x2={width - paddingX}
                  y2={h}
                  stroke="#ffffff"
                  strokeWidth={0.5}
                  strokeDasharray="2,5"
                  className="stroke-zinc-800"
                />
                <text
                  x={paddingX - 10}
                  y={h + 3.5}
                  textAnchor="end"
                  fontSize="7px"
                  fontFamily="monospace"
                  fill="#71717a"
                  className="font-bold tracking-tight select-none"
                >
                  {tick.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Draw X-axis ticks text */}
          {xTicks.map((label, index) => {
            const x = xScale(index);
            return (
              <g key={index} className="opacity-90">
                <line
                  x1={x}
                  y1={height - paddingY}
                  x2={x}
                  y2={height - paddingY + 3}
                  stroke="#3f3f46"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={height - paddingY + 12}
                  textAnchor="middle"
                  fontSize="7px"
                  fontFamily="monospace"
                  fill={label === 'CURRENT' ? '#22d3ee' : '#71717a'}
                  className="font-bold tracking-widest select-none"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Fill the cyber gradient area */}
          <path
            d={areaPath}
            fill="url(#cyberAreaGrad)"
            className="transition-all duration-300"
          />

          {/* Vibrant glowing boundary line */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#cyberLineGrad)"
            strokeWidth={1.8}
            filter="url(#scopeGlow)"
            className="transition-all duration-300"
          />

          {/* Interactive node dot overlay */}
          {chartData.map((val, i) => {
            const cx = xScale(i);
            const cy = yScale(val);
            const isHovered = hoveredPoint?.index === i;

            return (
              <g key={i} className="cursor-pointer">
                {/* Large transparent hit target for easy hovering */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={12}
                  fill="transparent"
                  onMouseEnter={() => setHoveredPoint({ index: i, x: cx, y: cy, value: val })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* Outer halo highlight */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  className="transition-all duration-200 fill-zinc-950 stroke-[1.5]"
                  stroke={i === chartData.length - 1 ? '#06b6d4' : '#ec4899'}
                />

                {/* Inner core particle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 2.5 : 1.5}
                  className="transition-all duration-200"
                  fill={i === chartData.length - 1 ? '#22d3ee' : '#f43f5e'}
                />
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip Portal */}
        <AnimatePresence>
          {hoveredPoint && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute z-30 bg-slate-950/95 border border-cyan-500/40 text-white rounded px-2 py-1 shadow-2xl pointer-events-none font-mono"
              style={{
                left: `${hoveredPoint.x}px`,
                top: `${hoveredPoint.y - 36}px`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="flex flex-col text-[8px] leading-tight text-center">
                <span className="text-zinc-500 font-extrabold uppercase">
                  {hoveredPoint.index === chartData.length - 1 ? 'CURRENT EXTRACTION' : `MISSION RUN M-${chartData.length - 1 - hoveredPoint.index}`}
                </span>
                <span className="font-black text-cyan-300 mt-0.5 text-[9px] tracking-tight">
                  {hoveredPoint.value.toLocaleString()} <span className="text-[7px] text-zinc-400 font-bold">MJ</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Numerical insights grid row below chart */}
      <div className="grid grid-cols-2 gap-3 mt-3 border-t border-white/[0.03] pt-2">
        <div className="flex items-center gap-2 bg-black/[0.15] border border-white/[0.02] p-1.5 rounded-lg select-none leading-none">
          <Flame className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-[6.5px] text-zinc-500 font-extrabold tracking-wider uppercase">MEAN DISCHARGE</span>
            <span className="text-[10px] text-zinc-300 font-bold tracking-tight mt-0.5">
              {averageDamage.toLocaleString()} <span className="text-[7.5px] text-zinc-500 font-bold lowercase">mj</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/[0.15] border border-white/[0.02] p-1.5 rounded-lg select-none leading-none">
          <Target className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-[6.5px] text-zinc-400 font-extrabold tracking-wider uppercase">SECTOR ACCRUANCE</span>
            <span className="text-[10px] text-cyan-300 font-bold tracking-tight mt-0.5 uppercase">
              COGNITIVE ACTIVE
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
