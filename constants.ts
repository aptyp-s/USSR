import { GameState, BuildingId } from './types';

// === ИМПОРТИРУЕМ КАРТИНКИ ===
// Так как папка icons лежит рядом с этим файлом
import gosplanImg from './icons/gosplan.png';
import kgbImg from './icons/kgb.png';
import kremlinImg from './icons/kremlin.png';

export const INITIAL_RESOURCES = {
  cash: 0,
  reserves: 0,
  debt: 0,
};

export const BUILDINGS = [
  {
    id: BuildingId.GOSPLAN,
    name: 'Gosplan',
    level: 1,
    status: 'active',
    description: 'State Planning Committee. Calculates labor value and manages resource allocation protocols.',
    gridArea: 'gosplan',
    imageSrc: gosplanImg, // Подставляем импортированную картинку
    iconName: 'Landmark' // Можно оставить как запасной вариант, но используется imageSrc
  },
  {
    id: BuildingId.KGB,
    name: 'KGB HQ',
    level: 1,
    status: 'active',
    description: 'Committee for State Security. Monitors ideological purity and resource history.',
    gridArea: 'kgb',
    imageSrc: kgbImg,
    iconName: 'ShieldAlert'
  },
  {
    id: BuildingId.KREMLIN,
    name: 'The Kremlin',
    level: 1,
    status: 'active',
    description: 'Executive Citadel. Issues decrees, sets labor standards, and executes irreversible transfers.',
    gridArea: 'kremlin',
    imageSrc: kremlinImg,
    iconName: 'Briefcase'
  },
] as const;

export const INITIAL_STATE: GameState = {
  resources: INITIAL_RESOURCES,
  // @ts-ignore
  buildings: [...BUILDINGS],
  selectedBuildingId: null,
  resourceHistory: [],
  kgbStatus: 'idle',
  pendingTransaction: null,
  settings: {
      monthlyIncome: 50000,
      monthlyWorkHours: 160
  },
  hasUnlockedReserves: false
};