
export type ResourceType = 'cash' | 'reserves' | 'morale' | 'knowledge' | 'debt';

export interface Resources {
  cash: number;
  reserves: number;
  morale: number;
  knowledge: number;
  debt: number;
}

export interface GameSettings {
  monthlyIncome: number;
  monthlyWorkHours: number;
}

export enum BuildingId {
  KREMLIN = 'kremlin',
  GOSPLAN = 'gosplan',
  CANTEEN = 'canteen',
  NII = 'nii',
  OKB = 'okb',
  KGB = 'kgb'
}

export type BuildingStatus = 'active' | 'construction' | 'locked' | 'warning';

export interface Building {
  id: BuildingId;
  name: string;
  description: string;
  level: number;
  status: BuildingStatus;
  iconName: string; // Storing generic icon name to map in component
  gridArea: string; // CSS grid area name
}

export type KgbStatus = 'idle' | 'warning_mild' | 'warning_grave' | 'emergency' | 'post_emergency';

export interface TransactionPayload {
  cash: number;
  reserves: number;
  debt: number;
}

export interface GameState {
  resources: Resources;
  buildings: Building[];
  selectedBuildingId: BuildingId | null;
  kgbStatus: KgbStatus;
  pendingTransaction: TransactionPayload | null;
  settings: GameSettings;
  hasUnlockedReserves: boolean;
  resourceHistory: ResourceSnapshot[];
}

export interface ResourceSnapshot {
  recordedAt: string;
  data: Pick<Resources, 'cash' | 'reserves' | 'debt'>;
}

export type GameAction =
  | { type: 'SELECT_BUILDING'; payload: BuildingId | null }
  | { type: 'UPDATE_RESOURCE'; payload: { resource: ResourceType; amount: number } }
  | { type: 'UPGRADE_BUILDING'; payload: BuildingId }
  | { type: 'SET_RESOURCES'; payload: Partial<Resources> }
  | { type: 'SET_RESOURCE_HISTORY'; payload: ResourceSnapshot[] }
  | { type: 'SET_KGB_STATUS'; payload: KgbStatus }
  | { type: 'SET_PENDING_TRANSACTION'; payload: TransactionPayload | null }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GameSettings> }
  | { type: 'SET_RESERVE_UNLOCK'; payload: boolean };
