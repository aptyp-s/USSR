import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { BuildingCard } from './components/BuildingCard';
import { Modal } from './components/Modal';
import { Coins, Activity, Scale, Wallet } from 'lucide-react';
import { BuildingId } from './types';

// The inner game layout component
const formatMoscowTime = () =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());

const CitadelView: React.FC = () => {
  const { state, dispatch } = useGame();
  const [tickerTime, setTickerTime] = React.useState(formatMoscowTime);

  const hasResources = 
    state.resources.cash > 0 || 
    state.resources.reserves > 0 || 
    state.resources.debt > 0;

  React.useEffect(() => {
    const interval = setInterval(() => setTickerTime(formatMoscowTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleBuildingClick = (id: string) => {
    const building = state.buildings.find((b) => b.id === id);
    if (!building) {
      return;
    }

    if (!hasResources && id !== BuildingId.KREMLIN) {
      return;
    }

    if (building.status === 'locked') {
      return;
    }

    if (hasResources && state.kgbStatus !== 'idle' && id !== BuildingId.KGB) {
      return;
    }

    dispatch({ type: 'SELECT_BUILDING', payload: id as BuildingId });
  };

  const isEmergency = state.kgbStatus === 'emergency';

  return (
    <div
      className={`h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col font-sans overflow-hidden relative selection:bg-soviet-red selection:text-white transition-all duration-700 ${
        isEmergency ? 'grayscale-0 sepia saturate-200 hue-rotate-[-30deg]' : ''
      }`}
    >
      <style>{`
        .citadel-grid {
          display: grid;
          gap: 1.5rem;
          padding: 1rem;
          width: 100%;
          flex: 1;
          /* Mobile: Single Column */
          grid-template-columns: 1fr;
          grid-auto-rows: minmax(200px, auto);
          grid-template-areas:
            "gosplan"
            "kremlin"
            "kgb";
        }

        @media (min-width: 1024px) {
          .citadel-grid {
            padding: 3rem;
            align-items: center;
            /* Desktop: Single Row */
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: 1fr; 
            grid-template-areas: "gosplan kremlin kgb";
          }
        }

        .crt-overlay {
          background: linear-gradient(
            rgba(18, 16, 16, 0) 50%, 
            rgba(0, 0, 0, 0.25) 50%
          ), linear-gradient(
            90deg, 
            rgba(255, 0, 0, 0.06), 
            rgba(0, 255, 0, 0.02), 
            rgba(0, 0, 255, 0.06)
          );
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
        }

        @keyframes shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        
        .emergency-shake {
            animation: shake 0.5s infinite;
        }
        
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      {/* CRT Overlay */}
      <div
        className={`crt-overlay fixed inset-0 z-[100] w-full h-full mix-blend-overlay ${
          isEmergency ? 'opacity-50 bg-red-500' : ''
        }`}
      />

      {/* Background Noise / Texture */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Top Resource Bar */}
      <header
        className={`relative z-20 bg-soviet-metal border-b-2 px-6 py-3 shadow-xl flex-none ${
          isEmergency ? 'border-red-500' : 'border-soviet-red'
        }`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-soviet-red text-white p-1 font-bold tracking-tighter border border-white/20 shadow-[0_0_10px_rgba(208,0,0,0.5)]">
              ☭COMMUNE
            </div>
            <span className="text-zinc-500 text-xs font-mono hidden sm:inline-block">
              SYS.VER.19.17 // STATE:{' '}
              {isEmergency ? (
                <span className="text-red-500 animate-pulse font-bold">
                  EMERGENCY
                </span>
              ) : !hasResources ? (
                <span className="text-amber-500 font-bold animate-pulse">
                   INITIALIZATION REQUIRED
                </span>
              ) : (
                'OPTIMAL'
              )}
            </span>
          </div>

          <div className="flex gap-4 sm:gap-8 items-center overflow-x-auto">
            <ResourceItem
              icon={Scale}
              label="DEBT"
              value={state.resources.debt}
              color="text-red-500"
              borderColor="border-red-900/50"
            />
            <div className="h-6 w-px bg-zinc-700"></div>
            <ResourceItem
              icon={Wallet}
              label="CASH"
              value={state.resources.cash}
              color="text-emerald-400"
            />
            <ResourceItem
              icon={Coins}
              label="RESERVES"
              value={state.resources.reserves}
              color="text-amber-400"
            />
          </div>
        </div>
      </header>

      {/* Main Map Container */}
      <main
        className={`flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col p-4 sm:p-8 perspective-[1500px] w-full ${
          isEmergency ? 'emergency-shake' : ''
        }`}
      >
        {/* The Game Board */}
        <div className="relative flex-grow m-auto transform-style-3d rotate-x-0 sm:rotate-x-6 scale-100 sm:scale-95 transition-transform duration-700 ease-out max-w-7xl w-full flex flex-col">
          {/* Base Plate */}
          <div
            className={`absolute inset-0 bg-zinc-900/80 backdrop-blur rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.8)] border -z-10 transform sm:translate-y-2 sm:translate-x-2 ${
              isEmergency ? 'border-red-800' : 'border-zinc-800'
            }`}
          ></div>

          {/* Grid Container */}
          <div
            className={`citadel-grid relative bg-zinc-900/40 rounded-lg border-2 ${
              isEmergency ? 'border-red-600' : 'border-zinc-700/50'
            }`}
          >
             {/* Decorative Grid Lines */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #52525b 1px, transparent 1px), linear-gradient(to bottom, #52525b 1px, transparent 1px)',
                backgroundSize: '4rem 4rem',
              }}
            ></div>
            
            {/* 
                WIRES / CABLES:
                Visible primarily on desktop (lg+).
                We draw lines from center of col 1 to center of col 2, and col 3 to col 2.
                The BuildingCards sit on top (z-index wise due to DOM order/relative positioning),
                so these lines will only be visible in the GAPS between cards.
            */}
            <div className="absolute inset-0 pointer-events-none hidden lg:block z-0">
              <svg className="w-full h-full drop-shadow-[0_0_4px_rgba(255,215,0,0.8)]">
                {/* 
                   Centers:
                   Left Col: ~16.6%
                   Mid Col: ~50%
                   Right Col: ~83.3%
                   Vert Center: 50%
                */}

                {/* Left (Gosplan) -> Mid (Kremlin) */}
                <line x1="16.6%" y1="50%" x2="50%" y2="50%" stroke="#4b5563" strokeWidth="8" /> {/* Dark casing */}
                <line x1="16.6%" y1="50%" x2="50%" y2="50%" stroke="#FFD700" strokeWidth="2" strokeDasharray="10,10" className="animate-pulse" />

                {/* Right (KGB) -> Mid (Kremlin) */}
                <line x1="83.3%" y1="50%" x2="50%" y2="50%" stroke="#4b5563" strokeWidth="8" /> {/* Dark casing */}
                <line x1="83.3%" y1="50%" x2="50%" y2="50%" stroke="#ef4444" strokeWidth="2" />
              </svg>
            </div>

            {state.buildings.map((building) => {
              let visualStatus = building.status;

              if (!hasResources) {
                  if (building.id !== BuildingId.KREMLIN) {
                      visualStatus = 'locked';
                  }
                  if (building.id === BuildingId.KREMLIN && building.status !== 'warning') {
                      visualStatus = 'active'; 
                  }
              } else if (state.kgbStatus !== 'idle') {
                  if (building.id !== BuildingId.KGB) {
                      visualStatus = 'locked';
                  }
              }

              return (
                <BuildingCard
                  key={building.id}
                  building={{ ...building, status: visualStatus }}
                  onClick={handleBuildingClick}
                />
              );
            })}
          </div>

          {/* Bottom Panel / Ticker */}
          <div
            className={`mt-4 sm:absolute sm:-bottom-20 sm:left-4 sm:right-4 h-12 bg-black/90 border flex items-center px-4 font-mono text-xs overflow-hidden shadow-lg rounded-sm ${
              isEmergency
                ? 'border-red-600 text-red-500'
                : 'border-zinc-700 text-soviet-red'
            }`}
          >
            <Activity size={14} className="mr-2 animate-pulse shrink-0" />
            <div className="whitespace-nowrap animate-marquee">
              {isEmergency
                ? `+++ ALL CITIZENS REPORT TO STATIONS +++ ${tickerTime} (UTC+3)`
                : !hasResources 
                  ? `${tickerTime} (UTC+3) +++ SYSTEM STARTUP... WAITING FOR KREMLIN DIRECTIVE... RESOURCES NOT FOUND +++`
                  : `${tickerTime} (UTC+3) +++ WORKER PRODUCTIVITY AT 100% +++ NEW DIRECTIVES FROM GOSPLAN RECEIVED +++ KREMLIN REPORTS STABLE OPERATIONS +++`}
            </div>
          </div>
        </div>

        {/* Spacer for bottom scroll clearance */}
        <div className="h-8 shrink-0"></div>
      </main>

      {/* Modal Layer */}
      <Modal />
    </div>
  );
};

interface ResourceItemProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  borderColor?: string;
  disabled?: boolean;
}

const ResourceItem: React.FC<ResourceItemProps> = ({
  icon: Icon,
  label,
  value,
  color,
  borderColor = 'border-white/5',
  disabled = false,
}) => (
  <div
    className={`flex flex-col items-center sm:flex-row sm:gap-2 bg-black/20 px-3 py-1 rounded border ${borderColor} shrink-0 ${
      disabled ? 'opacity-40 cursor-not-allowed' : ''
    }`}
    aria-disabled={disabled}
  >
    <div className={`flex items-center gap-1 ${color}`}>
      <Icon size={16} />
      <span className="font-mono font-bold text-lg">
        {disabled ? '--' : value.toLocaleString()}
      </span>
    </div>
    <span className="text-[10px] text-zinc-500 font-bold tracking-wider">
      {label}
    </span>
  </div>
);

// App Entry
function App() {
  return (
    <GameProvider>
      <CitadelView />
    </GameProvider>
  );
}

export default App;