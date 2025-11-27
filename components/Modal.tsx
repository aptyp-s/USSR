import React, { useEffect } from 'react';
import { X, Cpu } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { BuildingId } from '../types';
import { GosplanModal } from './modals/GosplanModal';
import { KGBModal } from './modals/KGBModal';
import { KremlinModal } from './modals/KremlinModal';

export const Modal: React.FC = () => {
  const { state, dispatch } = useGame();
  const { selectedBuildingId, buildings, kgbStatus } = state;

  if (!selectedBuildingId) return null;

  const building = buildings.find(b => b.id === selectedBuildingId);
  if (!building) return null;

  const closeModal = () => dispatch({ type: 'SELECT_BUILDING', payload: null });

  // Render content based on building ID
  const renderContent = () => {
    switch (building.id) {
        case BuildingId.GOSPLAN:
            return <GosplanModal />;
        case BuildingId.KGB:
            return <KGBModal />;
        case BuildingId.KREMLIN:
             return <KremlinModal />;
        default:
            return <div className="text-zinc-500 italic text-center p-8">
                -- TERMINAL ACCESS RESTRICTED --<br/>
                -- DEVELOPMENT IN PROGRESS --
            </div>
    }
  }

  // Determine modal border/header color based on state (specifically for KGB warning)
  const isEmergency = kgbStatus === 'emergency';
  const borderColor = isEmergency ? 'border-red-600' : 'border-soviet-concrete';
  const headerColor = isEmergency ? 'bg-red-900 text-white' : 'bg-soviet-concrete';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-lg bg-soviet-metal border-2 ${borderColor} shadow-2xl overflow-hidden flex flex-col transition-colors duration-500`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className={`${headerColor} p-3 flex justify-between items-center border-b border-zinc-700 transition-colors duration-500`}>
          <div className="flex items-center gap-2">
             <div className={`w-3 h-3 rounded-full ${isEmergency ? 'bg-black' : 'bg-soviet-red'}`}></div>
             <h2 className="font-sans font-bold text-xl uppercase tracking-widest text-white">
                {building.name} // <span className={`${isEmergency ? 'text-black' : 'text-soviet-red'} text-sm`}>TERMINAL_01</span>
             </h2>
          </div>
          {kgbStatus !== 'emergency' && (
              <button 
                onClick={closeModal}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-soviet-screen relative">
            {/* Scanline overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-0"></div>
            
            <div className="relative z-10 h-full flex flex-col">
                <div className="mb-4 flex items-start gap-4">
                     <div className="flex-1">
                        <p className="text-zinc-300 font-mono text-sm leading-relaxed">
                            {building.description}
                        </p>
                     </div>
                </div>

                <div className="border-t border-zinc-800 mb-6"></div>

                <div className="flex-1">
                  {renderContent()}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};