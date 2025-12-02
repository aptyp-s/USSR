import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from 'react';
import {
  GameState,
  GameAction,
  BuildingId,
  Resources,
  ResourceType,
  ResourceSnapshot,
} from '../types';
import { INITIAL_STATE } from '../constants';

const STORAGE_KEY = 'commune_resource_record';

const isBrowser = () => typeof window !== 'undefined';

const parseStoredSnapshots = (): ResourceSnapshot[] => {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ResourceSnapshot[]) : [];
  } catch {
    return [];
  }
};

const persistSnapshots = (snapshots: ResourceSnapshot[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
};

// ИСПРАВЛЕНО ЗДЕСЬ (было constWZbootstrapState)
const bootstrapState = (): GameState => {
  if (!isBrowser()) return INITIAL_STATE;

  let snapshots = parseStoredSnapshots();
  
  if (!snapshots.length) {
    const initial: ResourceSnapshot = {
      recordedAt: new Date().toISOString(),
      data: { cash: 0, reserves: 0, debt: 0 },
    };
    snapshots = [initial];
    persistSnapshots(snapshots);
  }

  const latest = snapshots[snapshots.length - 1];

  return {
    ...INITIAL_STATE,
    resources: {
      ...INITIAL_STATE.resources,
      ...latest.data,
    },
    resourceHistory: snapshots,
  };
};

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction | { type: 'LOAD_GAME_DATA'; payload: any }>;
} | undefined>(undefined);

const gameReducer = (state: GameState, action: any): GameState => {
  switch (action.type) {
    case 'SELECT_BUILDING':
      return {
        ...state,
        selectedBuildingId: action.payload,
      };
    case 'UPDATE_RESOURCE':
      return {
        ...state,
        resources: {
          ...state.resources,
          [action.payload.resource]: Math.max(0, state.resources[action.payload.resource] + action.payload.amount),
        },
      };
    case 'SET_RESOURCES':
      return {
        ...state,
        resources: {
          ...state.resources,
          ...Object.entries(action.payload as Partial<Resources>).reduce((acc, [key, value]) => {
            if (value === undefined || value === null) return acc;
            acc[key as ResourceType] = Math.max(0, value as number);
            return acc;
          }, {} as Partial<Resources>),
        },
      };
    case 'SET_RESOURCE_HISTORY':
      return {
        ...state,
        resourceHistory: action.payload,
      };
    case 'UPGRADE_BUILDING':
      return {
        ...state,
        buildings: state.buildings.map((b) =>
          b.id === action.payload ? { ...b, level: b.level + 1, status: 'active' } : b
        ),
      };
    case 'SET_KGB_STATUS':
      return {
        ...state,
        kgbStatus: action.payload,
        buildings: state.buildings.map(b => {
            if (b.id === BuildingId.KGB) {
                return { ...b, status: action.payload !== 'idle' ? 'warning' : 'active' };
            }
            return b;
        })
      };
    case 'SET_PENDING_TRANSACTION':
      return {
        ...state,
        pendingTransaction: action.payload
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        }
      };
    case 'SET_RESERVE_UNLOCK':
      return {
        ...state,
        hasUnlockedReserves: action.payload
      };
    case 'LOAD_GAME_DATA':
       const loadedState = action.payload;
       if (!loadedState.resources || !loadedState.resourceHistory) {
           console.warn("Invalid save file structure");
           return state;
       }
       persistSnapshots(loadedState.resourceHistory);
       
       return {
           ...state,
           resources: loadedState.resources,
           resourceHistory: loadedState.resourceHistory,
           settings: loadedState.settings || state.settings,
           kgbStatus: 'idle',
           selectedBuildingId: null, 
           hasUnlockedReserves: false
       };
    default:
      return state;
  }
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE, bootstrapState);

  useEffect(() => {
    if (!isBrowser()) return;
    const latestStateSnapshot: ResourceSnapshot = {
      recordedAt: new Date().toISOString(),
      data: {
        cash: state.resources.cash,
        reserves: state.resources.reserves,
        debt: state.resources.debt,
      },
    };

    const storedSnapshots = parseStoredSnapshots();
    const lastStored = storedSnapshots[storedSnapshots.length - 1];
    const hasChanged =
      !lastStored ||
      lastStored.data.cash !== latestStateSnapshot.data.cash ||
      lastStored.data.reserves !== latestStateSnapshot.data.reserves ||
      lastStored.data.debt !== latestStateSnapshot.data.debt;

    if (!hasChanged) {
      if (state.resourceHistory.length !== storedSnapshots.length) {
        dispatch({ type: 'SET_RESOURCE_HISTORY', payload: storedSnapshots });
      }
      return;
    }

    const nextSnapshots = [...storedSnapshots, latestStateSnapshot];
    persistSnapshots(nextSnapshots);
    dispatch({ type: 'SET_RESOURCE_HISTORY', payload: nextSnapshots });
  }, [
    state.resources.cash,
    state.resources.reserves,
    state.resources.debt,
    state.resourceHistory.length,
  ]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};