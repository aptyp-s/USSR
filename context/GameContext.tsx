
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, GameAction, BuildingId } from '../types';
import { INITIAL_STATE } from '../constants';

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | undefined>(undefined);

const gameReducer = (state: GameState, action: GameAction): GameState => {
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
        // Only update KGB status directly in the state. 
        // Visual locking of other buildings is handled in the View layer (App.tsx) 
        // to prevent overwriting 'construction' or 'locked' statuses permanently.
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
    default:
      return state;
  }
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

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
