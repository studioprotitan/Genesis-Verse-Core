/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { soundManager } from '../utils/audio';
import { useGameStore } from '../store';
import { PilotProfile } from './PilotProfile';
import { 
  Shield, 
  Flame, 
  Radio, 
  Activity, 
  Award, 
  BookOpen, 
  Compass, 
  ArrowLeft, 
  Lock, 
  Unlock, 
  Coins, 
  CreditCard, 
  Wallet, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Zap,
  Globe,
  RadioTower,
  Sword,
  Sliders,
  Database,
  Terminal,
  Signal,
  X,
  Camera,
  UploadCloud,
  RotateCcw,
  Check
} from 'lucide-react';

// @ts-ignore
import warWitchBg from '../assets/images/war_witch_siren_hero-a.png';
// @ts-ignore
import janeDistrictBg from '../assets/images/jane_district_hero_page_a.png';
// @ts-ignore
import arenasOfEchelonBg from '../assets/images/arenas_of_echelon_hero_a.png';
// @ts-ignore
import gatewayUniverseBg from '../assets/images/gateway_universe_1780413421280.png';
// @ts-ignore
import genesisVerseHeroBg from '../assets/images/genesis_vers_hero_gatewary_a.png';

interface HeroPortal {
  id: string;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  cost: number;
  bgImage?: any;
  palette: {
    primary: string;
    border: string;
    glow: string;
    bg: string;
    text: string;
  };
  rank: string;
  loreLabel: string;
  icons: {
    id: string;
    label: string;
    description: string;
    detail: string;
    isLocked: boolean;
    costToUnlock?: number;
    icon: any;
  }[];
}

const HERO_PORTALS_DATA: HeroPortal[] = [
  {
    id: 'war-witch',
    title: 'War Witch',
    subtitle: 'Sirens of Abyssum',
    tagline: 'Lore Wave · Oracle Network · Freight Hub 621',
    description: 'Interface with the coven networks, deploy cybernetic support constructs, and navigate the extreme deep-space warzones of Freight Hub 621.',
    cost: 250,
    bgImage: warWitchBg,
    palette: {
      primary: 'from-orange-600 to-amber-500',
      border: 'border-orange-500/35',
      glow: 'shadow-[0_0_25px_rgba(249,115,22,0.15)]',
      bg: 'bg-orange-950/10',
      text: 'text-orange-400'
    },
    rank: 'SIREN COVEN CADET',
    loreLabel: 'ABYSSUM RADAR CONDUIT',
    icons: [
      {
        id: 'ww-world',
        label: 'Freight Hub 621',
        description: 'Sector Overview data logs',
        detail: 'Freight Hub 621 serves as a massive hyper-dense logistics nexus hanging over the Abyssum. Glitched gravity wells line the shipways, forcing pilots to align their vectors manually to bypass rogue cargo nets.',
        isLocked: false,
        icon: Globe
      },
      {
        id: 'ww-factions',
        label: 'Coven Syndicates',
        description: 'Neural hive organizations',
        detail: 'The Neural Coven operates in distributed cryptographic clusters. They harness unstable Rift energy cores to run computational spells, shielding their fleets from Abyssum radar sweeps.',
        isLocked: false,
        icon: Sliders
      },
      {
        id: 'ww-story',
        label: 'Siren Anomaly',
        description: 'Classified audio wave files',
        detail: 'TRANSMISSION RECEIVED: "The Siren song isn\'t music. It\'s a raw digital signal compiling on loop in our navigation buffers. It makes the drone thrusters lock up... or worse, fire on themselves."',
        isLocked: true,
        costToUnlock: 50,
        icon: RadioTower
      },
      {
        id: 'ww-arenas',
        label: 'Abyssum Proving Grounds',
        description: 'Simulated combat parameters',
        detail: 'A training ring placed in the low atmosphere where pilots rehearsal close-quarters combat inside artificial magnetic storms that disrupt vector shields and triple laser recharge speeds.',
        isLocked: true,
        costToUnlock: 100,
        icon: Database
      },
      {
        id: 'ww-armory',
        label: 'Coven Plasma Claws',
        description: 'Exotic pilot loadouts',
        detail: 'Constructed from condensed Rift residue, these armaments project an ultra-heated energy field capable of disabling companion bots instantly with zero thermal backdraft.',
        isLocked: true,
        costToUnlock: 150,
        icon: Flame
      }
    ]
  },
  {
    id: 'jane-district',
    title: 'Jane District',
    subtitle: 'Horror Witch Reporter',
    tagline: 'Cornerstone Station · Forbidden Anomalies',
    description: "Broadcast pirate feeds, decapsulate eldritch station frequencies, and survive Cornerstone Sector's oppressive security net.",
    cost: 350,
    bgImage: janeDistrictBg,
    palette: {
      primary: 'from-fuchsia-600 to-indigo-500',
      border: 'border-fuchsia-500/35',
      glow: 'shadow-[0_0_25px_rgba(217,70,239,0.15)]',
      bg: 'bg-fuchsia-950/10',
      text: 'text-fuchsia-400'
    },
    rank: 'GLITCH GOBLIN',
    loreLabel: 'ECHO WAVE FREQUENCY',
    icons: [
      {
        id: 'jd-investigations',
        label: 'Cornerstone Sector',
        description: 'Confidential investigative files',
        detail: 'Cornerstone Station is an industrial city-state floating inside a dark nebula. The city relies on dark-energy turbines that frequently trigger localized time-dilation fields.',
        isLocked: false,
        icon: Sliders
      },
      {
        id: 'jd-broadcast',
        label: 'Echo Radio Wave',
        description: 'Uncensored audio reports',
        detail: 'A pirate podcast broadcasted of a rogue terminal behind the station reactor. "The authorities claim the rift leak is sealed. Then why are our sensors registering 400 anomaly bursts per hour?"',
        isLocked: false,
        icon: Signal
      },
      {
        id: 'jd-classified',
        label: 'Anxium Tapes',
        description: 'Forbidden static recordings',
        detail: 'Audio static that triggers severe headache on listening. Spectrogram readings show a repeating vector fractal that matches standard neural coven encryption protocols.',
        isLocked: true,
        costToUnlock: 75,
        icon: Terminal
      },
      {
        id: 'jd-frequencies',
        label: 'Signal Decoders',
        description: 'Pirate frequency keyrings',
        detail: 'Specialized radio equipment capable of parsing encrypted feeds broadcasted by deep-space entities. Used by reporters to listen in on security channels.',
        isLocked: true,
        costToUnlock: 125,
        icon: RadioTower
      },
      {
        id: 'jd-contacts',
        label: 'Eldritch Informants',
        description: 'Censored contact files',
        detail: 'A list of anomalous entities living in the ventilation chambers of Cornerstone. They trade forbidden tech snippets for stable Rift fuel canister drops.',
        isLocked: true,
        costToUnlock: 175,
        icon: Globe
      }
    ]
  },
  {
    id: 'arenas-echelon',
    title: 'Arenas of Echelon',
    subtitle: 'Glory. Honor. Dominance.',
    tagline: 'Sky Wards Authority · Jousting Tournaments',
    description: 'Scale the legendary competitive ladders of Echelon, compete in zero-gravity thruster tournaments, and bypass the rigorous Sky Wards seals.',
    cost: 450,
    bgImage: arenasOfEchelonBg,
    palette: {
      primary: 'from-amber-600 to-yellow-500',
      border: 'border-amber-500/35',
      glow: 'shadow-[0_0_25px_rgba(245,158,11,0.15)]',
      bg: 'bg-amber-950/10',
      text: 'text-amber-400'
    },
    rank: 'ASCENDANT GLADIATOR',
    loreLabel: 'ECHELON WAR WARDEN',
    icons: [
      {
        id: 'ae-ladder',
        label: 'Honor Standings',
        description: 'Elite pilot performance metrics',
        detail: 'The current leaderboard is dominated by pilots who harness aggressive drone shields. Echelon rewards sheer survival rate over defensive maneuvers.',
        isLocked: false,
        icon: Award
      },
      {
        id: 'ae-tournaments',
        label: 'Sky Joust Cards',
        description: 'Upcoming tournament schedules',
        detail: 'Contenders compete on high-speed thruster sleds within the gravity-dilated Sky Wards. No physical collision allowed: Tagging is purely electronic.',
        isLocked: false,
        icon: Sword
      },
      {
        id: 'ae-seals',
        label: 'Ascendant Seals',
        description: 'Sky Wards Security Bypass Tokens',
        detail: 'Highly secured clearance certificates required of pilots stepping into outer ring grids. They represent verified neural compatibility indices.',
        isLocked: true,
        costToUnlock: 90,
        icon: Shield
      },
      {
        id: 'ae-gear',
        label: 'Thruster Sleds',
        description: 'Custom tournament rig schematics',
        detail: 'High-speed interceptor platforms fitted with specialized side-thruster banks. Designed to execute sharp right-angle vectors inside tight tunnel structures.',
        isLocked: true,
        costToUnlock: 140,
        icon: Sliders
      },
      {
        id: 'ae-wards',
        label: 'Ward Protocols',
        description: 'Classified governing codes',
        detail: 'The primary operating directive of the Echelon Wards. "All synthetic anomalies generated by the core must be contained immediately by deploying stabilizer constructs."',
        isLocked: true,
        costToUnlock: 200,
        icon: Info
      }
    ]
  },
  {
    id: 'laser-tag',
    title: 'Laser Tag',
    subtitle: 'Gemini Vector Protocol',
    tagline: 'Anxium Simulator · Alpha-Beta Cores',
    description: 'Undergo tactical live-fire combat training. Synthesize drone parameters dynamically on-the-fly and survive shifting Rift hazards.',
    cost: 500,
    bgImage: gatewayUniverseBg,
    palette: {
      primary: 'from-cyan-600 to-sky-400',
      border: 'border-cyan-500/35',
      glow: 'shadow-[0_0_25px_rgba(34,211,238,0.15)]',
      bg: 'bg-cyan-950/10',
      text: 'text-cyan-400'
    },
    rank: 'APEX COMMANDER',
    loreLabel: 'DYNAMIC MULTIPLAYER VECTOR GRID',
    icons: []
  }
];

interface HeroPortalsProps {
  onEnterLaserTag: () => void;
  savedWalletAddress?: string;
  onWalletAddressChange?: (addr: string) => void;
}

export function HeroPortals({ onEnterLaserTag, savedWalletAddress, onWalletAddressChange }: HeroPortalsProps) {
  // Navigation State
  // 'landing' | 'boot' | 'gateway' | 'hero_dashboard'
  const [viewState, setViewState] = useState<'landing' | 'boot' | 'gateway' | 'hero_dashboard'>('landing');
  const [selectedHero, setSelectedHero] = useState<HeroPortal | null>(null);

  // Pilot Profile Store Hooks
  const pilotName = useGameStore(state => state.pilotName);
  const pilotHours = useGameStore(state => state.pilotHours);
  const pilotAvatarUrl = useGameStore(state => state.pilotAvatarUrl);
  const setPilotProfile = useGameStore(state => state.setPilotProfile);

  // Pilot Live Editing local states
  const [isEditingName, setIsEditingName] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState(pilotName);

  // Sync input when state updates
  useEffect(() => {
    setProfileNameInput(pilotName);
  }, [pilotName]);

  // OSU Cognitive Brain Boot States
  const [bootProgress, setBootProgress] = useState(0);
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const [transmissionIndex, setTransmissionIndex] = useState(0);
  const [bootComplete, setBootComplete] = useState(false);

  // Augmented Image Console Hover/Intake States
  const [showImageConsole, setShowImageConsole] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageConsoleLogs, setImageConsoleLogs] = useState<string[]>([]);

  // 1. OSU Cognitive Brain Boot Loader Timer Effect
  useEffect(() => {
    if (viewState !== 'boot') return;

    const interval = setInterval(() => {
      setBootProgress(prev => {
        const next = prev + 5;
        if (next >= 100) {
          clearInterval(interval);
          setBootComplete(true);
          soundManager.playSysAlert('reboot');
          return 100;
        }
        return next;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [viewState]);

  // Append terminal logs as boot progress increases
  useEffect(() => {
    if (viewState !== 'boot') return;
    
    // Choose logs to append based on progress thresholds
    const logTemplates = [
      { trigger: 10, msg: "DECRYPTING CORE ENTROPY SPELLS..." },
      { trigger: 25, msg: "STABILIZING MULTI-LAYER ABEX BALANCE SHEETS..." },
      { trigger: 40, msg: "ESTABLISHING CANON CHASSIS TETHERS..." },
      { trigger: 55, msg: "CONNECTING SECURE COGNITIVE RECEPTORS..." },
      { trigger: 70, msg: "INJECTING ELEVENLABS CONVAI INTERFACES..." },
      { trigger: 85, msg: "CONTACTING TRANSMISSION NODE [OSU-UNIT-A]..." },
      { trigger: 95, msg: "BOOT COMPLETE. ALL COGNITIVE CELLS NOMINAL." }
    ];

    logTemplates.forEach(item => {
      if (bootProgress >= item.trigger) {
        setBootLogs(prev => {
          if (!prev.includes(item.msg)) {
            soundManager.playSysAlert('click'); // micro beep
            return [...prev, item.msg];
          }
          return prev;
        });
      }
    });
  }, [bootProgress, viewState]);

  // 2. Load ElevenLabs Widget dynamically when boot completes
  useEffect(() => {
    if (bootComplete && viewState === 'boot') {
      const existingScript = document.querySelector('script[src*="elevenlabs.io/convai-widget/index.js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = "https://elevenlabs.io/convai-widget/index.js";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    }
  }, [bootComplete, viewState]);

  // Core wallets and unlock states
  const [walletConnected, setWalletConnected] = useState(!!savedWalletAddress);
  const [walletAddress, setWalletAddress] = useState(savedWalletAddress || '');
  const [activeWalletProvider, setActiveWalletProvider] = useState<string>('');
  
  // Simulated balance (in ABEX tokens, virtual token of Genesis Verse)
  const [abexBalance, setAbexBalance] = useState<number>(1250);
  
  // Unlocked heroes and micro-content trackers
  const [unlockedHeroes, setUnlockedHeroes] = useState<Record<string, boolean>>({
    'war-witch': false,
    'jane-district': false,
    'arenas-echelon': false,
    'laser-tag': true // Laser Tag simulation starts free/sandbox!
  });

  const [unlockedIcons, setUnlockedIcons] = useState<Record<string, boolean>>({
    'ww-world': true,
    'ww-factions': true,
    'jd-investigations': true,
    'jd-broadcast': true,
    'ae-ladder': true,
    'ae-tournaments': true
  });

  // Modal control states
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showAccessGranted, setShowAccessGranted] = useState(false);
  const [pendingHeroId, setPendingHeroId] = useState<string | null>(null);

  // Micro-transaction control states for individual icon unlocking
  const [showMicroCheckoutModal, setShowMicroCheckoutModal] = useState(false);
  const [pendingMicroIcon, setPendingMicroIcon] = useState<{ id: string; label: string; cost: number } | null>(null);

  // Visual simulation loaders
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<string>('');

  // Selected icon in the dashboard view
  const [selectedDashboardIcon, setSelectedDashboardIcon] = useState<any>(null);

  // Select a hero portal
  const handleHeroPortalClick = (hero: HeroPortal) => {
    setSelectedHero(hero);
    // If we've already unlocked this hero, view directly
    if (unlockedHeroes[hero.id]) {
      setViewState('hero_dashboard');
      // Auto-select first icon
      if (hero.icons.length > 0) {
        setSelectedDashboardIcon(hero.icons[0]);
      } else {
        setSelectedDashboardIcon(null);
      }
    } else {
      // Must unlock first. Check wallet connection
      setPendingHeroId(hero.id);
      if (!walletConnected) {
        setShowWalletModal(true);
      } else {
        setShowStripeModal(true);
      }
    }
  };

  // Connected standard simulated wallets
  const handleConnectWallet = (provider: string) => {
    setIsProcessing(true);
    setTransactionStatus(`Syncing encrypted keys through ${provider} network...`);
    setActiveWalletProvider(provider);
    
    setTimeout(() => {
      const mockAddress = `0x${Math.random().toString(16).substring(2, 10).toUpperCase()}...${Math.random().toString(16).substring(2, 6).toUpperCase()}`;
      setWalletConnected(true);
      setWalletAddress(mockAddress);
      if (onWalletAddressChange) {
        onWalletAddressChange(mockAddress);
      }
      setIsProcessing(false);
      setShowWalletModal(false);
      
      // Proceed to Stripe modal
      setShowStripeModal(true);
    }, 1500);
  };

  // Process main fuel Stripe payment
  const handleProcessStripePayment = () => {
    if (!pendingHeroId) return;
    const hero = HERO_PORTALS_DATA.find(h => h.id === pendingHeroId);
    if (!hero) return;

    setIsProcessing(true);
    setTransactionStatus(`Rerouting to secure Stripe API gateway... Conversing ABEX exchange parameters...`);

    setTimeout(() => {
      setTransactionStatus(`Authorizing premium fuel token allocation... Verifying signatures via Wallet index...`);
      setTimeout(() => {
        // Unlock
        setUnlockedHeroes(prev => ({ ...prev, [pendingHeroId]: true }));
        setViewState('hero_dashboard');
        const updatedHero = HERO_PORTALS_DATA.find(h => h.id === pendingHeroId);
        setSelectedHero(updatedHero || null);
        if (updatedHero && updatedHero.icons.length > 0) {
          setSelectedDashboardIcon(updatedHero.icons[0]);
        } else {
          setSelectedDashboardIcon(null);
        }
        
        setIsProcessing(false);
        setShowStripeModal(false);
        setShowAccessGranted(true);
      }, 1200);
    }, 1500);
  };

  // Process sub-icon micro transaction
  const handleUnlockMicroContent = (icon: any) => {
    setPendingMicroIcon({ id: icon.id, label: icon.label, cost: icon.costToUnlock || 50 });
    setShowMicroCheckoutModal(true);
  };

  const executeMicroTransaction = () => {
    if (!pendingMicroIcon) return;
    setIsProcessing(true);
    setTransactionStatus(`Charging Stripe card or routing ABEX...`);

    setTimeout(() => {
      setAbexBalance(prev => Math.max(0, prev - pendingMicroIcon.cost));
      setUnlockedIcons(prev => ({ ...prev, [pendingMicroIcon.id]: true }));
      
      // Update selected icon state in dashboard view
      if (selectedHero) {
        const found = selectedHero.icons.find(i => i.id === pendingMicroIcon.id);
        if (found) {
          setSelectedDashboardIcon({ ...found, isLocked: false });
        }
      }

      setIsProcessing(false);
      setShowMicroCheckoutModal(false);
      setPendingMicroIcon(null);
    }, 1500);
  };

  if (viewState === 'landing') {
    return (
      <div 
        className="absolute inset-0 z-50 flex flex-col justify-between p-6 md:p-12 text-center select-none overflow-hidden font-mono pointer-events-auto bg-black"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 100%), url(${genesisVerseHeroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Decorative Sci-fi Scanlines Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-15 pointer-events-none" />

        {/* TOP PANEL: Floating Telemetry & System Indicator Bar */}
        <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/55 border border-cyan-500/20 rounded-2xl px-6 py-4 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.9)] animate-fade-in relative z-10 select-none">
          <div className="flex flex-col text-left items-center sm:items-start gap-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400 tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(6,182,212,0.15)] leading-none">
              GENESIS VERSE
            </h1>
            <p className="text-[9px] font-bold text-slate-400 tracking-[0.3em] uppercase">
              REALM FORGE SYSTEM // PORTAL V1.0
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/40 border border-cyan-500/20 rounded-lg text-[9px] text-cyan-400 font-bold tracking-[0.1em] uppercase">
              <Radio className="w-3.5 h-3.5 animate-pulse text-fuchsia-500" />
              <span>TRANSMISSION: ESTABLISHED</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 bg-slate-950/60 border border-white/5 rounded-lg px-2.5 py-1.5 text-[9px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              <span>ENGINES: LIVE</span>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: Completely open & transparent to show the stunning background artwork */}
        <div className="flex-1 flex items-center justify-center pointer-events-none">
          {/* Subtle tactical crosshair centered to evoke the high-tech sci-fi theme */}
          <div className="w-16 h-16 border border-cyan-400/10 rounded-full flex items-center justify-center relative animate-pulse">
            <div className="absolute w-4 h-px bg-cyan-400/30" />
            <div className="absolute h-4 w-px bg-cyan-400/30" />
          </div>
        </div>

        {/* BOTTOM PANEL: Control Console with glowing launch pad */}
        <div className="w-full max-w-xl mx-auto bg-black/75 border border-cyan-500/20 rounded-3xl p-6 md:p-8 flex flex-col items-center gap-4 shadow-[0_0_40px_rgba(34,211,238,0.12)] backdrop-blur-md animate-fade-in relative z-10">
          
          <p className="text-[10px] md:text-xs text-slate-300 tracking-wider font-sans leading-relaxed text-center max-w-md">
            Harnessing the dual-core Gemini Entropy system. Connect pilot chassis relays, trace Abyssum frequency harmonics, or engage high-simulation vector matrices to test critical fire readiness.
          </p>

          {/* Intersecting Button: ENTER THE FORGE */}
          <button
            onClick={() => {
              soundManager.playSysAlert('start');
              setViewState('boot');
              setBootProgress(0);
              setBootComplete(false);
              setTransmissionIndex(0);
              setBootLogs(["CRITICAL BOOT COMMAND RECEIVED...", "ESTABLISHING GRID CONNECTION PATHWAYS..."]);
            }}
            className="group relative px-10 py-3.5 bg-gradient-to-r from-cyan-600/15 via-fuchsia-600/15 to-amber-600/10 border border-cyan-500 hover:border-fuchsia-400 text-cyan-300 hover:text-white text-xs font-black uppercase tracking-[0.25em] rounded-xl cursor-pointer shadow-[0_0_25px_rgba(34,211,238,0.2)] hover:shadow-[0_0_45px_rgba(217,70,239,0.45)] transition-all duration-300 overflow-hidden active:scale-95"
          >
            {/* Button highlight animation */}
            <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            
            <span className="relative z-10 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
              ENTER THE FORGE
              <Sparkles className="w-4 h-4 text-fuchsia-400 group-hover:animate-spin" />
            </span>
          </button>

          {/* Bottom hardware info line */}
          <div className="flex justify-between items-center w-full max-w-sm border-t border-white/5 pt-4 mt-2 text-[8px] md:text-[9px] font-mono text-slate-500">
            <span>SECTOR: FORGE-CORE</span>
            <span className="text-cyan-500 animate-pulse font-semibold">● SECURE SEED FEED</span>
            <span>REV: 1.0.4</span>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === 'boot') {
    const BRAE_TRANSMISSIONS = [
      {
        id: "trans-1",
        label: "TRANSMISSION 01 // OVERRIDE VERIFIED",
        content: "Pilot. Chassis synchronization verified. Systems nominal. The portal hub is unstable. Align your vector frequencies before grid penetration."
      },
      {
        id: "trans-2",
        label: "TRANSMISSION 02 // COGNITIVE SIGNALS",
        content: "Unit A cognitive override engaged. ABEX tethers are hot. We have rogue signatures circulating in Freight Hub 621. Steel yourself."
      },
      {
        id: "trans-3",
        label: "TRANSMISSION 03 // NAVIGATION FEED",
        content: "Do not trust the Siren echo inside the navigation buffer. It is a compiled wave loop. Direct transmission closed. Proceed to gateway."
      }
    ];

    return (
      <div className="absolute inset-0 z-50 flex flex-col justify-between p-6 md:p-12 text-center select-none overflow-y-auto font-mono pointer-events-auto bg-black bg-radial from-[#13031f] to-black">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-15 pointer-events-none" />

        <div className="w-full max-w-4xl mx-auto flex items-center justify-between bg-black/60 border border-fuchsia-500/20 rounded-2xl px-6 py-4 backdrop-blur-md relative z-10 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-ping shrink-0" />
            <span className="text-[10px] font-black text-fuchsia-400 tracking-[0.25em] uppercase">
              OSU COGNITIVE BRAIN // UNIT A
            </span>
          </div>
          <div className="text-[9px] text-slate-500 flex gap-4 font-bold tracking-widest">
            <span>NODE: GRID-ECHO-621</span>
            <span>FREQ: 148.92 MHz</span>
          </div>
        </div>

        <div className="flex-1 w-full max-w-lg mx-auto flex flex-col justify-center items-center py-8 relative z-10 gap-6">
          {!bootComplete ? (
            <div className="w-full bg-slate-950/90 border border-cyan-500/25 rounded-3xl p-6 md:p-8 flex flex-col items-center gap-6 shadow-[0_0_30px_rgba(6,182,212,0.1)] backdrop-blur-md w-full animate-fade-in">
              <div className="flex flex-col gap-1 items-center">
                <h3 className="text-sm font-black text-white tracking-[0.35em] uppercase">
                  PREPARING FOR GRID ENTRY
                </h3>
                <span className="text-[9.5px] text-cyan-400 tracking-widest uppercase animate-pulse font-bold">
                  ESTABLISHING SECURE GATEWAY OVERRIDES
                </span>
              </div>

              <div className="w-full space-y-2 max-w-xs">
                <div className="flex justify-between items-center text-[10px] text-cyan-400 font-bold tracking-wider">
                  <span>BOOT PROG:</span>
                  <span className="font-mono">{bootProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 border border-cyan-500/20 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-cyan-500 h-full transition-all duration-150 ease-out shadow-[0_0_12px_#06b6d4]"
                    style={{ width: `${bootProgress}%` }}
                  />
                </div>
              </div>

              <div className="w-full h-36 bg-black/75 border border-slate-900 rounded-xl p-4 text-left overflow-y-auto space-y-1.5 text-[9px] text-slate-400 font-mono scrollbar-thin scrollbar-thumb-slate-800">
                {bootLogs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-cyan-500 shrink-0">[{i}]</span>
                    <span className="animate-fade-in text-slate-300 tracking-wide font-sans">{log}</span>
                  </div>
                ))}
                {bootProgress < 100 && (
                  <div className="flex gap-2 text-cyan-400/50 animate-pulse">
                    <span>&gt;</span>
                    <span className="font-sans">PROCESSING CORE RELAYS...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full bg-[#0b0c16]/95 border border-fuchsia-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(217,70,239,0.15)] flex flex-col items-center gap-6 animate-fade-in text-center">
              <div className="flex flex-col gap-1 items-center">
                <div className="px-2.5 py-1 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg text-[9px] text-fuchsia-400 font-black tracking-[0.2em] uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                  <span>TRANSMISSION SOURCE ACTIVE</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase font-mono mt-3">
                  BRAE GRINDSTONE // OSU UNIT A
                </h3>
              </div>

              <div className="w-full p-4 md:p-5 bg-slate-950/80 border border-white/5 rounded-2xl relative text-left min-h-[120px] flex flex-col justify-between">
                <div>
                  <div className="text-[7.5px] text-slate-500 font-mono tracking-widest uppercase mb-1.5 flex justify-between font-bold">
                    <span>{BRAE_TRANSMISSIONS[transmissionIndex].label}</span>
                    <span className="text-fuchsia-400">SECURE FREQUENCY</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-200 font-sans leading-relaxed tracking-wide italic">
                    &ldquo;{BRAE_TRANSMISSIONS[transmissionIndex].content}&rdquo;
                  </p>
                </div>
                
                <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-3">
                  <div className="text-[9px] text-slate-500 font-mono">
                    Transmission <span className="text-white font-bold">{transmissionIndex + 1}</span> of <span className="text-white font-bold">{BRAE_TRANSMISSIONS.length}</span>
                  </div>

                  <button
                    onClick={() => {
                      soundManager.playSysAlert('click');
                      if (transmissionIndex < BRAE_TRANSMISSIONS.length - 1) {
                        setTransmissionIndex(prev => prev + 1);
                      } else {
                        setTransmissionIndex(0);
                      }
                    }}
                    className="px-2.5 py-1 text-[8px] bg-[#120f26] hover:bg-slate-800 text-cyan-400 hover:text-white rounded border border-cyan-500/20 hover:border-cyan-500/40 cursor-pointer uppercase font-black tracking-widest transition-all"
                  >
                    Next Transmission &gt;
                  </button>
                </div>
              </div>

              <div className="w-full flex flex-col items-center gap-2 border-t border-white/5 pt-4">
                <span className="text-[8.5px] text-cyan-500 tracking-[0.25em] uppercase font-bold animate-pulse font-mono">
                  ELEVENLABS CONVERSATIONAL AI CORE LOADED
                </span>
                
                <div 
                  className="w-full flex justify-center py-2 relative z-50 cursor-pointer text-white"
                  style={{ minHeight: '120px' }}
                  dangerouslySetInnerHTML={{
                    __html: `<elevenlabs-convai agent-id="${(import.meta as any).env?.VITE_ELEVENLABS_AGENT_ID || 'd75f1ae3057da0ea83b79ce42571ebb0'}"></elevenlabs-convai>`
                  }}
                />
              </div>

              <button
                onClick={() => {
                  soundManager.playSysAlert('reboot');
                  setViewState('gateway');
                }}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:scale-[1.01] hover:shadow-[0_0_25px_rgba(217,70,239,0.35)] text-white text-xs font-black uppercase rounded-xl tracking-[0.2em] cursor-pointer transition-all flex items-center justify-center gap-2 font-mono"
              >
                <span>BYPASS OVERRIDE & ENTER PORTAL HUB</span>
                <Check className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          )}
        </div>

        <div className="w-full max-w-sm mx-auto flex justify-between items-center border-t border-white/5 pt-4 text-[8px] md:text-[9px] text-slate-500 select-none">
          <span>COGNITIVE CORE INTEL v2.5</span>
          <span className="text-cyan-500 animate-pulse font-semibold uppercase">
            ● CELL COMM NOMINAL
          </span>
          <span>UNIT_A: OK</span>
        </div>
      </div>
    );
  }

  // --- Augmented Image Console Image Data Operations ---
  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      setSelectedImage(base64Url);
      synthesizeImageTelemetry(base64Url, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  const selectPresetImage = (url: string, id: string) => {
    soundManager.playSysAlert('click');
    setSelectedImage(url);
    synthesizeImageTelemetry(url, 'image/png');
  };

  const synthesizeImageTelemetry = async (imageBase64: string, mimeType: string) => {
    setIsAnalyzingImage(true);
    setImageAnalysisResult(null);
    setImageConsoleLogs([
      `ESTABLISHING IMAGE BINDING PROTOCOL...`,
      `STREAMING COGNITIVE BYTES TO SERVER...`,
    ]);

    // Timed logging simulation while waiting for Gemini
    const logIntervals = [
      setTimeout(() => setImageConsoleLogs(prev => [...prev, `ENGAGING VEO-3 RECONSTRUCTION COEFFICIENTS...`]), 800),
      setTimeout(() => setImageConsoleLogs(prev => [...prev, `RESOLVING ENTROPY DEFLECTION WAVELENGTHS...`]), 1800),
      setTimeout(() => setImageConsoleLogs(prev => [...prev, `DECRYPTING ENVELOPING NEURAL SPELLS...`]), 2800),
    ];

    try {
      const res = await fetch('/api/synthesize-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType })
      });

      if (!res.ok) {
        throw new Error('Synthesis channel disrupted');
      }

      const data = await res.json();
      logIntervals.forEach(clearTimeout);
      setImageConsoleLogs(prev => [
        ...prev,
        `DECRYPTION COMPLETE.`,
        `NEURAL FEED BOUND TO GATE CRITICAL INDEX.`
      ]);
      setImageAnalysisResult(data);
      soundManager.playSysAlert('reboot');
    } catch (err) {
      logIntervals.forEach(clearTimeout);
      setImageConsoleLogs(prev => [...prev, `[ERROR]: SYNTHESIS CHANNEL FAULT. MANUAL REBOOT REQUIRED.`]);
      soundManager.playSysAlert('click');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/95 flex flex-col items-center pointer-events-auto select-none overflow-y-auto overflow-x-hidden p-4 md:p-8 font-mono pb-20">
      
      {/* Wallet Status Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between border-b border-white/5 pb-3 mb-8 text-[10px]">
        <div 
          onClick={() => {
            soundManager.playSysAlert('click');
            setViewState('landing');
          }}
          className="flex items-center gap-1.5 text-cyan-500 hover:text-cyan-300 font-bold tracking-[0.25em] cursor-pointer transition-colors active:scale-95 select-none"
          title="Return to Hero Page"
        >
          <Zap className="w-3.5 h-3.5 animate-pulse text-fuchsia-400" />
          <span>GENESIS VERSE NET</span>
        </div>

        {/* NAVIGATION CONTROLS */}
        <div className="flex items-center gap-3">
          {/* FREIGHT UX TAB */}
          <a
            href="/oracle_genesis_gateway.html"
            onClick={() => soundManager.playSysAlert('click')}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-cyan-950/25 hover:bg-cyan-900/40 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-white rounded-xl text-[9px] font-black tracking-widest uppercase cursor-pointer transition-all duration-200 active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.1)] select-none no-underline"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Freight UX</span>
          </a>

          {/* AUGMENTED IMAGE CONSOLE LAUNCHER */}
          <button
            onClick={() => {
              soundManager.playSysAlert('click');
              setShowImageConsole(true);
              setImageConsoleLogs(["HOLOGRAPHIC CHANNELS ESTABLISHED...", "AWAITING QUANTUM IMAGE FEED..."]);
              setSelectedImage(null);
              setImageAnalysisResult(null);
            }}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-fuchsia-950/20 hover:bg-fuchsia-900/40 border border-fuchsia-500/30 hover:border-fuchsia-400 text-fuchsia-400 hover:text-white rounded-xl text-[9px] font-black tracking-widest uppercase cursor-pointer transition-all duration-200 active:scale-95 shadow-[0_0_15px_rgba(217,70,239,0.1)] select-none"
          >
            <Camera className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" />
            <span>AUGMENTED IMAGE CONSOLE</span>
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded border border-white/5">
            <Coins className="w-3 h-3 text-amber-400" />
            <span className="text-amber-400 font-bold">{abexBalance} ABEX</span>
          </div>

          {walletConnected ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[9px] font-bold">LINK: {walletAddress}</span>
            </div>
          ) : (
            <button 
              onClick={() => {
                setPendingHeroId(null);
                setShowWalletModal(true);
              }}
              className="px-3 py-1 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold hover:bg-cyan-500 hover:text-black rounded transition-all duration-200 cursor-pointer"
            >
              CONNECT WALLET
            </button>
          )}
        </div>
      </div>

      {viewState === 'gateway' ? (
        <div className="w-full max-w-5xl flex flex-col gap-8 animate-fade-in">
          
          {/* Main Cinematic Title Header */}
          <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto gap-2">
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-orange-400 tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(6,182,212,0.15)] leading-tight">
              GENESIS VERSE
            </h1>
            <h2 className="text-xs font-mono font-black text-slate-400 tracking-[0.45em] uppercase border-y border-white/5 py-1.5 px-6">
              ENIGMATIC GATEWAYS
            </h2>
            <p className="text-[11px] md:text-xs text-slate-500 mt-2 tracking-wide font-sans leading-relaxed">
              Entropy Engine: <strong className="text-cyan-400">ONLINE</strong> · Oracle Link: <strong className="text-fuchsia-400">ACTIVE</strong> · Clear security clearances through the Echelon Ward, bind credentials, or undergo virtual pilot training.
            </p>
          </div>

          {/* Pilot Identity Profile Dashboard */}
          <PilotProfile />

          {/* Grid of 4 Portal Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mt-4">
            {HERO_PORTALS_DATA.map((hero) => {
              const unlocked = unlockedHeroes[hero.id];
              return (
                <div
                  key={hero.id}
                  onClick={() => handleHeroPortalClick(hero)}
                  className={`group relative flex flex-col bg-slate-950/60 border ${hero.palette.border} ${hero.palette.glow} rounded-2xl p-5 hover:border-white/20 transition-all duration-300 cursor-pointer overflow-hidden min-h-[300px] justify-between`}
                >
                  {/* Hero Artwork Background Cover Image */}
                  {hero.bgImage && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-20 saturate-75 brightness-50 group-hover:opacity-35 group-hover:scale-105 group-hover:saturate-100 transition-all duration-500 pointer-events-none"
                      style={{ backgroundImage: `url(${hero.bgImage})` }}
                    />
                  )}
                  
                  {/* Highlight dynamic neon hover glow */}
                  <div className={`absolute inset-0 bg-gradient-to-b ${hero.palette.bg} to-transparent opacity-10 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none`} />
                  
                  {/* Top content */}
                  <div className="flex flex-col gap-1.5 z-10">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] uppercase tracking-widest font-black text-slate-500 font-mono">PORTAL VECTOR</span>
                      
                      {unlocked ? (
                        <span className="text-[7.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          CONNECTED
                        </span>
                      ) : (
                        <span className="text-[7.5px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                          <Lock className="w-2 h-2" />
                          LOCKED ({hero.cost} ABEX)
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-2xl font-black text-white hover:text-cyan-300 duration-150 tracking-tight uppercase leading-none mt-2">
                      {hero.title}
                    </h3>
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${hero.palette.text}`}>
                      {hero.subtitle}
                    </h4>
                    <span className="text-[8.5px] text-slate-500 font-mono leading-none tracking-tight">
                      {hero.tagline}
                    </span>
                    
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-3.5 opacity-85 group-hover:opacity-100 transition-opacity">
                      {hero.description}
                    </p>
                  </div>

                  {/* Bottom Access Info */}
                  <div className="flex flex-col gap-2.5 z-10 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                      <span>CHASSIS TYPE:</span>
                      <strong className="text-white font-bold">{hero.id.toUpperCase().replace('-', '_')}</strong>
                    </div>

                    <button
                      className={`w-full py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer duration-200 transition-all ${
                        unlocked 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black' 
                          : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-slate-900 group-hover:border-cyan-500/40'
                      }`}
                    >
                      {unlocked ? 'ENTER PORTAL' : `FUEL: UNLOCK FOR ${hero.cost} ABEX`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-6 text-[9px] text-slate-600 font-sans tracking-wide">
            Designed under VLAAD criteria VTR-LT-1.0.0. Deep-space signal simulations may trigger telemetry lag.
          </div>

        </div>
      ) : (
        /* Immersive Under-Page Dashboard for selected Hero */
        selectedHero && (
          <div className="w-full max-w-5xl flex flex-col gap-6 animate-fade-in">
            
            {/* Header / Return switch */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setViewState('gateway');
                    setSelectedHero(null);
                    setSelectedDashboardIcon(null);
                  }}
                  className="p-2 bg-slate-900 border border-white/10 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-400 cursor-pointer rounded-xl transition-all duration-150 flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">ACTIVE PROTOCOL STREAM</span>
                    <span className="text-[7.5px] bg-emerald-500/10 text-emerald-400 px-1 py-0.5 rounded border border-emerald-500/30 font-bold uppercase font-mono tracking-widest animate-pulse">INTEGRITY HIGH</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
                    {selectedHero.title} — <span className={`${selectedHero.palette.text}`}>{selectedHero.subtitle}</span>
                  </h2>
                </div>
              </div>

              {/* Status metrics bar */}
              <div className="flex items-center gap-3">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5 text-right font-mono min-w-[150px]">
                  <span className="text-[7.5px] text-slate-500 block uppercase font-bold tracking-widest leading-none">ASSIGNED CLASSIFICATION</span>
                  <span className="text-xs font-black text-white uppercase block mt-0.5 tracking-tight">{selectedHero.rank}</span>
                </div>
                {selectedHero.id === 'laser-tag' && (
                  <button
                    onClick={onEnterLaserTag}
                    className="px-6 py-3 bg-cyan-500/20 border-2 border-cyan-400 text-cyan-400 text-sm font-bold rounded-xl hover:bg-cyan-400 hover:text-black hover:scale-102 transition-all duration-200 cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.2)] animate-pulse uppercase tracking-wider font-sans font-black"
                  >
                    LAUNCH GAME SIMULATOR
                  </button>
                )}
              </div>
            </div>

            {/* Immersive interactive visual dashboard panel with 5-Icon Grid */}
            {selectedHero.id !== 'laser-tag' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
                
                {/* Left side grid selector (5 columns/cards) */}
                <div className="lg:col-span-4 flex flex-col gap-3">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">TACTICAL CONDUIT INDEX ({selectedHero.icons.length})</span>
                  
                  <div className="flex flex-col gap-2 bg-slate-950/40 p-2 rounded-2xl border border-white/5">
                    {selectedHero.icons.map((item) => {
                      const ItemIcon = item.icon;
                      const isLocked = item.isLocked && !unlockedIcons[item.id];
                      const isCurrentlySelected = selectedDashboardIcon?.id === item.id;
                      
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedDashboardIcon(item);
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border text-left ${
                            isCurrentlySelected
                              ? `bg-slate-900 ${selectedHero.palette.border} text-white`
                              : 'bg-slate-950/20 border-transparent hover:bg-slate-900/60 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isCurrentlySelected ? 'bg-cyan-500/10' : 'bg-slate-900'} border border-white/5`}>
                              <ItemIcon className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold leading-snug uppercase tracking-tight">{item.label}</span>
                              <span className="text-[9px] text-slate-500 leading-none">{item.description}</span>
                            </div>
                          </div>

                          <div>
                            {isLocked ? (
                              <span className="p-1 px-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] flex items-center gap-1 font-bold">
                                <Lock className="w-2.5 h-2.5" />
                                {item.costToUnlock}
                              </span>
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right side content reader/terminal rendering lore details */}
                <div className="lg:col-span-8 bg-[#04040a]/90 rounded-2xl border border-white/5 p-6 flex flex-col gap-4 min-h-[350px] justify-between relative overflow-hidden">
                  
                  {/* Matrix ambient grid mesh background */}
                  <div className="absolute inset-0 bg-grid-white opacity-[0.01] pointer-events-none" />
                  
                  {selectedDashboardIcon ? (
                    (() => {
                      const isLocked = selectedDashboardIcon.isLocked && !unlockedIcons[selectedDashboardIcon.id];
                      const IconComponent = selectedDashboardIcon.icon;
                      return (
                        <>
                          <div className="flex flex-col gap-3.5 z-10">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                              <div className="flex items-center gap-2">
                                <IconComponent className="w-5 h-5 text-cyan-400 animate-pulse" />
                                <span className="text-sm font-black text-white uppercase tracking-tight">{selectedDashboardIcon.label}</span>
                              </div>
                              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">{selectedHero.loreLabel}</span>
                            </div>

                            {isLocked ? (
                              <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-950/60 border border-amber-500/20 rounded-xl max-w-md mx-auto my-6 gap-3">
                                <Lock className="w-10 h-10 text-amber-400 animate-bounce" />
                                <h4 className="text-sm font-black text-white uppercase tracking-wide">SECURED COVEN ARCHIVE</h4>
                                <p className="text-[11px] text-slate-400 max-w-xs font-sans leading-normal">
                                  This dossier slice is currently locked behind a cryptographic security seal. Complete a {selectedDashboardIcon.costToUnlock} ABEX micro-transaction parameter to access.
                                </p>
                                <button
                                  onClick={() => handleUnlockMicroContent(selectedDashboardIcon)}
                                  className="px-6 py-2 bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500 hover:text-black font-bold uppercase text-[10px] rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-2"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  Unlock Archive with Stripe Checkout
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-4 font-sans text-xs text-slate-300 leading-relaxed max-w-xl">
                                <div className="p-3.5 bg-cyan-950/10 border border-cyan-500/15 rounded-lg flex gap-3 text-cyan-300">
                                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                  <p className="text-[11px]">
                                    Decompressing encrypted packet slice... Holographic render active on synthetic sensor grid.
                                  </p>
                                </div>
                                <h4 className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-black">LOG TRANSCRIPT SPECIFICATION:</h4>
                                <p className="text-[12px] bg-slate-950/20 p-4 border border-white/5 rounded-xl font-mono text-cyan-400/90 leading-relaxed shadow-inner">
                                  {selectedDashboardIcon.detail}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between border-t border-white/5 pt-4 text-[9px] text-slate-500 mt-6 z-10">
                            <span className="flex items-center gap-1 font-mono">
                              <Terminal className="w-3 h-3 text-cyan-400" />
                              CONSOLE LINK STATUS: ACTIVE
                            </span>
                            <span>SEED PROTOCOL VTR-LT-1.0.0</span>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center gap-2 m-auto text-slate-500">
                      <Compass className="w-10 h-10 text-slate-500 animate-spin" />
                      <span>Select a tactical quadrant to query archive stream parameters.</span>
                    </div>
                  )}

                </div>
              </div>
            ) : (
              /* Laser Tag Portal Interactive Sandbox Panel */
              <div className="bg-[#04040b] rounded-2xl border border-cyan-500/20 p-8 text-center flex flex-col items-center justify-center gap-4 min-h-[400px] shadow-[0_0_40px_rgba(6,182,212,0.08)] mt-2">
                <Radio className="w-16 h-16 text-cyan-400 animate-pulse mb-2" />
                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">
                  LASER TAG COMBUSTION SIMULATION
                </h3>
                <p className="text-xs text-slate-400 font-sans max-w-lg leading-relaxed">
                  Welcome to the Gemini-powered vector training mesh! Calibrate your tactical drones to dynamically roam the proving grounds, test protective barriers, acquire double damage anomalies, and shoot bots across real-time multiplayer corridors.
                </p>
                <div className="flex gap-4 mt-2">
                  <div className="p-3 border border-white/5 rounded-xl bg-slate-950 flex flex-col items-center gap-1 text-center font-mono w-32">
                    <span className="text-[7.5px] text-slate-500 uppercase font-bold tracking-wider">Drones</span>
                    <strong className="text-white text-sm font-bold">SPAWNER ONLINE</strong>
                  </div>
                  <div className="p-3 border border-white/5 rounded-xl bg-slate-950 flex flex-col items-center gap-1 text-center font-mono w-32">
                    <span className="text-[7.5px] text-slate-500 uppercase font-bold tracking-wider">Telemetry</span>
                    <strong className="text-white text-sm font-bold">ATMOSPHERE RADAR</strong>
                  </div>
                  <div className="p-3 border border-white/5 rounded-xl bg-slate-950 flex flex-col items-center gap-1 text-center font-mono w-32">
                    <span className="text-[7.5px] text-slate-500 uppercase font-bold tracking-wider">Opponent Core</span>
                    <strong className="text-white text-sm font-bold">GEMINI-ALPHA</strong>
                  </div>
                </div>
                <button
                  onClick={onEnterLaserTag}
                  className="px-8 py-3.5 bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:scale-103 font-bold rounded-xl mt-4 cursor-pointer transition-all duration-200 tracking-widest uppercase font-black text-sm"
                >
                  ENTER INTENSITY SIMULATION
                </button>
              </div>
            )}

          </div>
        )
      )}

      {/* --- MODAL 1: WALLET CONNECT --- */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0c16] border border-cyan-500/30 rounded-2xl max-w-sm w-full p-6 shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 Header text-cyan-400 font-bold uppercase text-[11px] tracking-widest">
                <Wallet className="w-4 h-4 animate-bounce" />
                <span>CONNECT PILOT WALLET</span>
              </div>
              <button 
                onClick={() => setShowWalletModal(false)}
                className="text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 font-sans leading-normal">
              Genesis Verse protocols require an active cryptographic address link to store telemetry benchmarks and authorized access tiers. Select your active carrier:
            </p>

            <div className="flex flex-col gap-2 mt-2">
              {[
                { name: 'MetaMask Wallet', color: 'hover:border-orange-500/40 text-orange-400 bg-orange-950/5' },
                { name: 'WalletConnect Protocol', color: 'hover:border-blue-500/40 text-blue-400 bg-blue-950/5' },
                { name: 'Coinbase Web3 Wallet', color: 'hover:border-cyan-500/40 text-cyan-400 bg-cyan-950/5' }
              ].map((prov) => (
                <button
                  key={prov.name}
                  disabled={isProcessing}
                  onClick={() => handleConnectWallet(prov.name)}
                  className={`w-full p-3 rounded-xl border border-white/10 ${prov.color} flex items-center gap-3 font-bold text-xs hover:bg-slate-900 transition-all cursor-pointer`}
                >
                  <Coins className="w-4 h-4 shrink-0" />
                  <span>{prov.name}</span>
                </button>
              ))}
            </div>

            {isProcessing && (
              <div className="text-[9px] text-cyan-400 text-center font-mono mt-1 space-y-1 animate-pulse">
                <p>{transactionStatus}</p>
                <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full w-1/2 animate-shimmer" style={{ animation: 'shimmer 1.5s infinite linear' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 2: STRIPE CHARGE GATEWAY --- */}
      {showStripeModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0c16] border border-fuchsia-500/30 rounded-2xl max-w-sm w-full p-6 shadow-[0_0_40px_rgba(217,70,239,0.15)] flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 Header text-fuchsia-400 font-bold uppercase text-[11px] tracking-widest">
                <CreditCard className="w-4 h-4 animate-pulse" />
                <span>STRIPE CHECKOUT API</span>
              </div>
              <button 
                onClick={() => setShowStripeModal(false)}
                className="text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const hero = HERO_PORTALS_DATA.find(h => h.id === pendingHeroId);
              if (!hero) return null;
              return (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                    <span className="text-[7.5px] text-slate-500 block uppercase font-bold tracking-widest">PRODUCT ORDER:</span>
                    <strong className="text-white text-sm block uppercase mt-0.5">{hero.title} — {hero.subtitle}</strong>
                    <div className="flex justify-between items-center mt-2.5 text-xs font-mono font-bold">
                      <span className="text-slate-400">Tethered Wallet:</span>
                      <span className="text-cyan-400">{walletAddress}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-fuchsia-500/5 p-3 rounded-lg border border-fuchsia-500/20 text-xs font-bold text-fuchsia-300">
                    <span>FUEL FEE TOTAL:</span>
                    <span className="text-lg text-white font-mono font-black">{hero.cost} ABEX</span>
                  </div>

                  {/* Standard security warning */}
                  <div className="flex gap-2.5 p-3 bg-slate-950/80 rounded-xl border border-white/5 text-[10px] text-slate-400 leading-snug">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="font-sans">
                      This is a lore-accurate mock checkout portal simulated under the Gemini Vector guidelines. Ready to verify deployment?
                    </p>
                  </div>

                  <button
                    disabled={isProcessing}
                    onClick={handleProcessStripePayment}
                    className="w-full py-3 bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:scale-[1.01] text-white text-xs font-bold uppercase rounded-xl cursor-pointer shadow-[0_0_15px_rgba(217,70,239,0.3)] transition-all flex items-center justify-center gap-1.5 font-black tracking-widest"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    VALIDATE DEPLOYMENT VIA STRIPE
                  </button>

                  {isProcessing && (
                    <div className="text-[9px] text-fuchsia-400 font-mono text-center mt-2 space-y-1 animate-pulse">
                      <p>{transactionStatus}</p>
                      <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                        <div className="bg-fuchsia-400 h-full w-1/3 animate-shimmer" style={{ animation: 'shimmer 1.5s infinite linear' }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* --- MODAL 3: INLINE MICRO CHECKOUT --- */}
      {showMicroCheckoutModal && pendingMicroIcon && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0c16] border border-cyan-500/30 rounded-2xl max-w-sm w-full p-6 shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 Header text-cyan-400 font-bold uppercase text-[11px] tracking-widest">
                <CreditCard className="w-4 h-4 animate-bounce" />
                <span>MICRO-TRANSACTION PORTAL</span>
              </div>
              <button 
                onClick={() => {
                  setShowMicroCheckoutModal(false);
                  setPendingMicroIcon(null);
                }}
                className="text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 text-xs font-mono">
                <span className="text-[7.5px] text-slate-500 block uppercase font-bold tracking-widest leading-none">UNLOCK CRITICAL COMPONENT:</span>
                <strong className="text-white text-sm block uppercase mt-1">{pendingMicroIcon.label} Dossier</strong>
                <div className="flex justify-between items-center mt-2 font-bold text-slate-400 text-[11px]">
                  <span>Crypto Key Verification:</span>
                  <span className="text-emerald-400">ACTIVE ({walletAddress})</span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-cyan-500/5 p-3 rounded-lg border border-cyan-500/20 text-xs font-bold text-cyan-300">
                <span>COMPONENT COST:</span>
                <span className="text-base text-white font-mono font-black">{pendingMicroIcon.cost} ABEX</span>
              </div>

              <button
                disabled={isProcessing}
                onClick={executeMicroTransaction}
                className="w-full py-2.5 bg-cyan-500/20 border border-cyan-500/60 text-cyan-300 text-xs font-bold uppercase rounded-xl hover:bg-cyan-500 hover:text-black hover:scale-[1.01] transition-all cursor-pointer"
              >
                AUTHORIZE SECURE LORE SLICE BYPASS
              </button>
              
              {isProcessing && (
                <div className="text-[8px] text-cyan-400 text-center font-mono animate-pulse mt-1">
                  {transactionStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: ACCESS GRANTED ANIMATED OVERLAY --- */}
      {showAccessGranted && selectedHero && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <div className="bg-[#06060c] border border-cyan-500 max-w-md w-full p-8 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] text-center flex flex-col items-center gap-5">
            <Sparkles className="w-16 h-16 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
            
            <div className="flex flex-col gap-1">
              <span className="text-[8.5px] font-mono tracking-[0.4em] text-fuchsia-400 uppercase font-black">SECURITY SYSTEM BYPASSED</span>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase font-mono">
                ACCESS GRANTED
              </h2>
            </div>

            <div className="border-y border-white/5 w-full py-4 space-y-2 font-mono text-[11px] text-left">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase">SECTOR:</span>
                <span className="text-white uppercase font-black">{selectedHero.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase">CLEARANCE LEVEL:</span>
                <span className={`${selectedHero.palette.text} uppercase font-bold`}>{selectedHero.rank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase">FUEL TETHER:</span>
                <span className="text-amber-400 font-bold">500 ABEX TETHER</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase">PILOT ADDRESS:</span>
                <span className="text-cyan-400 text-[10px]">{walletAddress}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowAccessGranted(false);
              }}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold uppercase rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-150 cursor-pointer text-center font-black tracking-widest"
            >
              INITIALIZE DEPLOYMENT CHASSIS
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 5: HOLOGRAPHIC COGNITIVE ENGINE // AUGMENTED IMAGE CONSOLE --- */}
      {showImageConsole && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto font-mono p-4 sm:p-8 animate-fade-in pointer-events-auto text-white select-none">
          {/* Scanlines and holographic theme overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-15 pointer-events-none" />

          {/* Header Panel */}
          <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-fuchsia-500/25 pb-4 mb-4 relative z-10">
            <div className="flex flex-col text-left items-center sm:items-start gap-1">
              <span className="text-[8px] font-black text-fuchsia-400 tracking-[0.4em] uppercase">
                COGNITIVE ENGINE v3.1 // VEO-3 PULSE
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-widest uppercase">
                AUGMENTED IMAGE CONSOLE
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="hidden md:inline text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                AIC TARGET SECURE
              </span>
              <button
                onClick={() => {
                  soundManager.playSysAlert('click');
                  setShowImageConsole(false);
                }}
                className="p-2 border border-white/10 hover:border-fuchsia-400 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                title="Exit Console"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Workspace Layout */}
          <div className="flex-1 w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10 my-4">
            
            {/* Left Side: Intake and Presets (col-span-5) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              {/* Drag and Drop Box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 min-h-[220px] ${
                  isDragging 
                    ? 'border-fuchsia-400 bg-fuchsia-950/20 shadow-[0_0_20px_rgba(217,70,239,0.15)] scale-[1.01]' 
                    : selectedImage 
                      ? 'border-cyan-500/30 bg-slate-950/20' 
                      : 'border-white/10 bg-slate-950/40 hover:border-white/20'
                }`}
              >
                {selectedImage ? (
                  /* Custom image is selected/uploaded */
                  <div className="relative w-full h-40 rounded-2xl overflow-hidden group border border-white/5">
                    <img 
                      src={selectedImage} 
                      alt="Synthesis Target"
                      className="w-full h-full object-cover select-none pointer-events-none filter saturate-75 brightness-75 group-hover:brightness-90 group-hover:scale-102 transition-all duration-300"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Glowing scanning layer overlay */}
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#22d3ee] animate-scanner" style={{ animationDuration: '3s', animationIterationCount: 'infinite', animationTimingFunction: 'linear' }} />
                    
                    {/* Clear selection floating tag */}
                    <button
                      onClick={() => {
                        soundManager.playSysAlert('click');
                        setSelectedImage(null);
                        setImageAnalysisResult(null);
                        setImageConsoleLogs(["CHANNELS RESET. AWAITING QUANTUM IMAGE FEED..."]);
                      }}
                      className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/80 hover:bg-red-955 border border-white/10 hover:border-red-500 text-slate-400 hover:text-white rounded-lg text-[8px] font-bold uppercase transition-all duration-150 cursor-pointer"
                    >
                      Clear Target
                    </button>
                  </div>
                ) : (
                  /* Drag and drop initial target */
                  <div className="flex flex-col items-center text-center gap-3 select-none pointer-events-none">
                    {/* The Veo-3 Pulse animation */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-fuchsia-600 to-cyan-400 shadow-[0_0_20px_rgba(217,70,239,0.6)] z-10 animate-pulse" />
                      <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-[ping_2s_infinite]" />
                      <div className="absolute inset-2 rounded-full border border-fuchsia-500/10 animate-[ping_2.5s_infinite]" style={{ animationDelay: '300ms' }} />
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-white font-bold tracking-widest uppercase">
                        DRAG &amp; DROP CRITICAL FEED
                      </p>
                      <p className="text-[8.5px] text-slate-500 tracking-wider font-sans">
                        PNG or JPEG up to 10MB
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-1 h-1 bg-fuchsia-500 rounded-full animate-ping" />
                      <span className="text-[7.5px] text-fuchsia-400 font-bold tracking-widest uppercase">
                        HOLOGRAPHIC CELL STANDBY
                      </span>
                    </div>
                  </div>
                )}

                {/* Hide standard upload button inside drag and drop wrapper */}
                <label className="mt-2 shrink-0">
                  <span className="px-4 py-2 bg-gradient-to-r from-fuchsia-600/25 via-indigo-600/25 to-cyan-600/20 hover:from-fuchsia-600/40 hover:via-indigo-600/40 border border-fuchsia-500/40 hover:border-fuchsia-400 text-fuchsia-300 hover:text-white text-[9px] font-black tracking-widest uppercase rounded-xl cursor-pointer transition-all duration-200 select-none shadow-[0_0_15px_rgba(217,70,239,0.15)] flex items-center gap-1.5 active:scale-95">
                    <UploadCloud className="w-3.5 h-3.5" />
                    SELECT FILE FROM DECK
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        processImageFile(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* COGNITIVE SAMPLE DATASETS (Preset list) */}
              <div className="bg-slate-950/60 border border-white/5 rounded-3xl p-4 space-y-3">
                <span className="text-[8px] text-slate-500 block font-bold tracking-[0.2em] uppercase font-mono border-b border-white/5 pb-2">
                  ORACLE FEED SAMPLES:
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-left">
                  {[
                    { label: "GENESIS HERO BAR GATEWAY", id: "preset-gen", url: genesisVerseHeroBg },
                    { label: "SIREN ECHO DECK", id: "preset-witch", url: warWitchBg },
                    { label: "JANE SUB-DISTRICT AREA", id: "preset-jane", url: janeDistrictBg },
                    { label: "ECHELON WARD COMBAT", id: "preset-echelon", url: arenasOfEchelonBg }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectPresetImage(p.url, p.id)}
                      className="group relative h-14 rounded-xl overflow-hidden border border-white/5 hover:border-fuchsia-400/40 text-[7.5px] cursor-pointer text-left transition-all hover:scale-[1.01] select-none shadow-[0_0_10px_rgba(0,0,0,0.5)] leading-tight p-2.5 flex items-end justify-between"
                    >
                      <div className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-50 transition-opacity" style={{ backgroundImage: `url(${p.url})` }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
                      <span className="relative z-10 text-slate-300 font-bold uppercase tracking-tight group-hover:text-white transition-colors">
                        {p.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side: Log Feed + Synthesis Out (col-span-7) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              
              {/* Dynamic Console Telemetry Logs */}
              <div className="bg-slate-950/80 border border-white/5 rounded-3xl p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-none flex items-center gap-1">
                      <Terminal className="w-3 h-3 text-cyan-400" />
                      HOLOGRAPHIC SYNTHESIS TELEMETRY
                    </span>
                    <span className="text-[7.5px] bg-[#120f26] border border-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-bold animate-pulse">
                      AIC FEED STATUS: ONLINE
                    </span>
                  </div>

                  <div className="space-y-1.5 h-32 overflow-y-auto text-left text-[8.5px] text-slate-400 font-mono scrollbar-thin scrollbar-thumb-slate-800 pr-2">
                    {imageConsoleLogs.map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-fuchsia-500 shrink-0">[{i}]</span>
                        <span className="text-slate-300 font-sans tracking-wide leading-relaxed">{log}</span>
                      </div>
                    ))}
                    {isDragging && (
                      <div className="flex gap-2 text-cyan-400 animate-pulse font-mono">
                        <span>&gt;</span>
                        <span className="font-sans">QUANTUM COGNITIVE INTAKE HOVER ACTIVE...</span>
                      </div>
                    )}
                    {isAnalyzingImage && (
                      <div className="flex gap-2 text-fuchsia-400 animate-pulse font-mono">
                        <span>&gt;</span>
                        <span className="font-sans">PROCESSING SIGNAL SPECTRUM AND VEO WAVE VECTORS...</span>
                      </div>
                    )}
                  </div>
                </div>

                {isAnalyzingImage && (
                  <div className="flex flex-col items-center gap-2 py-4 animate-pulse select-none">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 animate-spin" />
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-fuchsia-500/40 animate-[spin_4s_infinite_linear]" />
                    </div>
                    <p className="text-[10px] text-fuchsia-400 tracking-[0.25em] uppercase font-bold text-center">
                      DECRYPTING IMAGE MATRIX FREQUENCIES...
                    </p>
                  </div>
                )}

                {imageAnalysisResult && (
                  /* Full parsed result output section */
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-fade-in text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[9.5px]">
                      
                      {/* Classification Card */}
                      <div className="p-3 bg-[#0a0715] rounded-xl border border-fuchsia-500/20">
                        <span className="text-[7.5px] text-slate-500 block uppercase font-bold tracking-widest">DESIGNATION CLASSIFICATION:</span>
                        <strong className="text-fuchsia-400 block uppercase mt-1 leading-snug">{imageAnalysisResult.classification}</strong>
                      </div>

                      {/* Threat ratings Card */}
                      <div className={`p-3 rounded-xl border ${
                        imageAnalysisResult.threatAssessment === 'MAXIMUM' || imageAnalysisResult.threatAssessment === 'CRITICAL' || imageAnalysisResult.threatAssessment === 'SEVERE'
                          ? 'bg-red-950/20 border-red-500/30 text-red-400' 
                          : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                      }`}>
                        <span className="text-[7.5px] text-slate-500 block uppercase font-bold tracking-widest">THREAT ASSESSMENT LEVEL:</span>
                        <strong className="block uppercase mt-1 leading-none text-xs tracking-tight font-black">{imageAnalysisResult.threatAssessment}</strong>
                      </div>

                      {/* Frequency info */}
                      <div className="p-3 bg-[#070b14] rounded-xl border border-cyan-500/20">
                        <span className="text-[7.5px] text-slate-500 block uppercase font-bold tracking-widest">HARMONIC COORDINATE FREQ:</span>
                        <strong className="text-white block mt-1 font-mono leading-none">{imageAnalysisResult.harmonicFrequency}</strong>
                      </div>

                      {/* Signature density */}
                      <div className="p-3 bg-[#070b14] rounded-xl border border-cyan-500/20">
                        <span className="text-[7.5px] text-slate-500 block uppercase font-bold tracking-widest">RIFT SIGNATURE DENSITY:</span>
                        <strong className="text-cyan-400 block mt-1 font-mono leading-none">{imageAnalysisResult.signatureDensity}</strong>
                      </div>
                    </div>

                    {/* Highly descriptive analysis text */}
                    <div className="p-3.5 bg-slate-950 border border-white/5 rounded-xl space-y-1.5 leading-relaxed">
                      <span className="text-[7.5px] text-slate-500 block uppercase font-bold tracking-widest leading-none">ANALYSIS OVERVIEW SUMMARY:</span>
                      <p className="text-[10px] md:text-xs text-slate-300 font-sans tracking-wide leading-relaxed italic">
                        &ldquo;{imageAnalysisResult.synthesisReport}&rdquo;
                      </p>
                    </div>

                    {/* Interactive Tactical direct directives checklists */}
                    <div className="p-4 bg-slate-950/40 border border-cyan-500/15 rounded-xl space-y-3">
                      <span className="text-[8px] text-cyan-400 block font-bold tracking-widest uppercase font-mono leading-none">
                        RECOMMENDED TACTICAL DIRECTIVES:
                      </span>
                      
                      <div className="space-y-2">
                        {imageAnalysisResult.tacticalDirectives.map((directive: string, idx: number) => (
                          <label 
                            key={idx} 
                            className="flex items-start gap-2.5 text-[9px] md:text-[10px] text-slate-300 hover:text-white cursor-pointer transition-all uppercase select-none leading-tight font-sans py-0.5"
                          >
                            <input 
                              type="checkbox" 
                              className="mt-0.5 shrink-0 rounded border-white/10 bg-slate-900 text-fuchsia-500 focus:ring-fuchsia-500" 
                            />
                            <span>{directive}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {!imageAnalysisResult && !isAnalyzingImage && (
                  <div className="flex flex-col items-center justify-center p-6 border border-slate-900 rounded-2xl bg-black/40 text-center gap-3">
                    <Activity className="w-8 h-8 text-slate-700 animate-pulse" />
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">
                      AWAITING COGNITIVE BINDING FEED STREAM
                    </p>
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* Footer Panel */}
          <div className="w-full max-w-5xl mx-auto flex justify-between items-center border-t border-white/5 pt-4 text-[8px] md:text-[9px] text-slate-500 select-none relative z-10 font-mono">
            <span>COGNITIVE ENG AIC DECK v3.1</span>
            <span className="text-cyan-500 animate-pulse font-normal tracking-wide uppercase">
              ● RADIAL VEO HARMONICS SECURE
            </span>
            <span>SYSTEM: ESTABLISHED</span>
          </div>
        </div>
      )}

    </div>
  );
}
