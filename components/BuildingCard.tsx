import React from 'react';
import { Building, BuildingStatus } from '../types';
import { Briefcase, Landmark, ShieldAlert, Utensils, Microscope, Hammer, Lock, AlertTriangle } from 'lucide-react';

interface BuildingCardProps {
  building: Building;
  onClick: (id: string) => void;
}

const IconMap: Record<string, React.ElementType> = {
  Briefcase,
  Landmark,
  ShieldAlert,
  Utensils,
  Microscope,
  Hammer,
};

const StatusColorMap: Record<BuildingStatus, string> = {
  active: 'border-soviet-concrete bg-soviet-metal text-gray-200 hover:border-soviet-red hover:shadow-[0_0_15px_rgba(208,0,0,0.5)]',
  construction: 'border-soviet-concrete bg-soviet-metal text-gray-200 hover:border-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.5)]',
  locked: 'border-zinc-800 bg-soviet-metal/50 text-zinc-600 hover:border-zinc-600',
  warning: 'border-soviet-concrete bg-soviet-metal text-gray-200 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]',
};

export const BuildingCard: React.FC<BuildingCardProps> = ({ building, onClick }) => {
  const Icon = IconMap[building.iconName] || Landmark;

  return (
    <button
      onClick={() => onClick(building.id)}
      className={`
        relative flex flex-col items-center justify-center p-6 
        border-b-8 border-r-4 border-l border-t transition-all duration-200 
        transform active:translate-y-1 active:border-b-2
        ${StatusColorMap[building.status]}
      `}
      style={{ gridArea: building.gridArea }}
    >
      {/* Decorative Corner Bolts */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-current opacity-50"></div>
      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-current opacity-50"></div>
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-current opacity-50"></div>
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-current opacity-50"></div>

      {/* Main Icon */}
      <div className="mb-3 relative group">
        <Icon size={48} strokeWidth={1.5} className="drop-shadow-lg" />
        {building.status === 'construction' && (
          <div className="absolute -bottom-2 -right-2 bg-amber-900 rounded-full p-1 border border-amber-600">
            <Hammer size={12} className="text-amber-500" />
          </div>
        )}
        {building.status === 'warning' && (
           <div className="absolute -top-2 -right-2 bg-red-900 rounded-full p-1 border border-red-600">
            <AlertTriangle size={14} className="text-red-500" />
          </div>
        )}
      </div>

      {/* Text Info */}
      <h3 className="font-sans font-bold text-lg uppercase tracking-wider text-center leading-tight mb-1">
        {building.name}
      </h3>
      
      <div className="font-mono text-xs opacity-70 flex items-center gap-2">
        <span>LVL {building.level}</span>
        <span className="w-1 h-1 bg-current rounded-full"></span>
        <span className="uppercase">{building.status}</span>
      </div>

      {/* Hover visual cue */}
      <div className="absolute inset-0 bg-white opacity-0 hover:opacity-5 pointer-events-none mix-blend-overlay"></div>
    </button>
  );
};