export type ResourceType = 'cash' | 'reserves' | 'debt';

export interface Resources {
  cash: number;
  reserves: number;
  debt: number;
}

export interface ResourceSnapshot {
  recordedAt: string;
  data: Resources;
}

export type BuildingStatus = 'active' | 'construction' | 'locked' | 'warning';

export enum BuildingId {
  GOSPLAN = 'gosplan',
  KGB = 'kgb',
  KREMLIN = 'kremlin',
}

export interface Building {
  id: BuildingId;
  name: string;
  level: number;
  status: BuildingStatus;
  description: string;
  gridArea: string;
  imageSrc: string; // Изменено с iconName на imageSrc
}

export interface GameSettings {
    monthlyIncome: number;
    monthlyWorkHours: number;
}

export interface GameState {
  resources: Resources;
  buildings: Building[];
  selectedBuildingId: BuildingId | null;
  resourceHistory: ResourceSnapshot[];
  kgbStatus: 'idle' | 'warning_mild' | 'warning_grave' | 'emergency' | 'post_emergency';
  pendingTransaction: Resources | null;
  settings: GameSettings;
  hasUnlockedReserves: boolean;
}

export type GameAction =
  | { type: 'SELECT_BUILDING'; payload: BuildingId | null }
  | { type: 'UPDATE_RESOURCE'; payload: { resource: ResourceType; amount: number } }
  | { type: 'SET_RESOURCES'; payload: Partial<Resources> }
  | { type: 'SET_RESOURCE_HISTORY'; payload: ResourceSnapshot[] }
  | { type: 'UPGRADE_BUILDING'; payload: BuildingId }
  | { type: 'SET_KGB_STATUS'; payload: GameState['kgbStatus'] }
  | { type: 'SET_PENDING_TRANSACTION'; payload: Resources | null }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GameSettings> }
  | { type: 'SET_RESERVE_UNLOCK'; payload: boolean }
  | { type: 'LOAD_GAME_DATA'; payload: GameState };