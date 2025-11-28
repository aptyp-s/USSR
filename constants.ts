
import { Building, BuildingId, BuildingStatus, GameState } from './types';

export const INITIAL_RESOURCES = {
  cash: 2500,    // Disposable Income
  reserves: 10000, // Stash
  morale: 85,
  knowledge: 0,
  debt: 1500000, // 1.5M RUB Debt
};

export const INITIAL_SETTINGS = {
  monthlyIncome: 10000,
  monthlyWorkHours: 168,
};

export const BUILDINGS_DATA: Building[] = [
  {
    id: BuildingId.GOSPLAN,
    name: 'GOSPLAN',
    description: 'State Planning Committee. Manage finances and resource allocation.',
    level: 1,
    status: 'active',
    iconName: 'Briefcase',
    gridArea: 'gosplan',
  },
  {
    id: BuildingId.KREMLIN,
    name: 'THE KREMLIN',
    description: 'Central Command. Overview of all operations and critical alerts.',
    level: 3,
    status: 'active',
    iconName: 'Landmark',
    gridArea: 'canteen',
  },
  {
    id: BuildingId.KGB,
    name: 'KGB HQ',
    description: 'Committee for State Security. Manage bugs, issues, and internal threats.',
    level: 1,
    status: 'warning',
    iconName: 'ShieldAlert',
    gridArea: 'kgb',
  },
  {
    id: BuildingId.CANTEEN,
    name: 'WORKER CANTEEN',
    description: 'Sustain the workforce. Food distribution and morale management.',
    level: 1,
    status: 'locked',
    iconName: 'Utensils',
    gridArea: 'kremlin',
  },
  {
    id: BuildingId.NII,
    name: 'NII (Research)',
    description: 'Scientific Research Institute. Unlock new technologies and methods.',
    level: 0,
    status: 'locked',
    iconName: 'Microscope',
    gridArea: 'nii',
  },
  {
    id: BuildingId.OKB,
    name: 'OKB (Projects)',
    description: 'Experimental Design Bureau. Active development projects.',
    level: 1,
    status: 'locked',
    iconName: 'Hammer',
    gridArea: 'okb',
  },
];

export const INITIAL_STATE: GameState = {
  resources: INITIAL_RESOURCES,
  buildings: BUILDINGS_DATA,
  selectedBuildingId: null,
  kgbStatus: 'idle',
  pendingTransaction: null,
  settings: INITIAL_SETTINGS,
  hasUnlockedReserves: false,
};
