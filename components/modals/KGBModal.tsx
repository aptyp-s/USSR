import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  AlertTriangle,
  Eye,
  RefreshCw,
  Scale,
  Wallet,
  Coins,
} from 'lucide-react';

export const KGBModal: React.FC = () => {
  const { state, dispatch } = useGame();
  const { kgbStatus, pendingTransaction } = state;
  const [timer, setTimer] = useState(10);
  const historyEntries = useMemo(() => {
    const history = state.resourceHistory ?? [];
    return [...history].slice(-8).reverse();
  }, [state.resourceHistory]);

  const formatTimestamp = (isoString: string) =>
    new Date(isoString).toLocaleString('en-GB', { timeZone: 'Europe/Moscow' });

  useEffect(() => {
    let interval: number;
    if (kgbStatus === 'emergency') {
        setTimer(10);
        interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    dispatch({ type: 'SET_KGB_STATUS', payload: 'post_emergency' });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [kgbStatus, dispatch]);

  const handleChoice = (choice: 'understood' | 'disagreed') => {
      if (kgbStatus === 'warning_mild') {
          if (choice === 'understood') {
              dispatch({ type: 'SET_KGB_STATUS', payload: 'idle' });
              dispatch({ type: 'SET_PENDING_TRANSACTION', payload: null }); // Cancel transaction
          }
          else {
              dispatch({ type: 'SET_KGB_STATUS', payload: 'warning_grave' });
          }
      } else if (kgbStatus === 'warning_grave') {
          if (choice === 'understood') {
              dispatch({ type: 'SET_KGB_STATUS', payload: 'idle' });
              dispatch({ type: 'SET_PENDING_TRANSACTION', payload: null }); // Cancel transaction
          }
          else {
              // Execute the pending transaction if it exists (force withdrawal)
              if (pendingTransaction) {
                  if (pendingTransaction.cash > 0) {
                      dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'cash', amount: -pendingTransaction.cash } });
                  }
                  if (pendingTransaction.reserves > 0) {
                      dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'reserves', amount: -pendingTransaction.reserves } });
                  }
                  dispatch({ type: 'SET_PENDING_TRANSACTION', payload: null });
              }

              dispatch({ type: 'SET_KGB_STATUS', payload: 'emergency' });
          }
      }
  };

  const handleReset = () => {
      dispatch({ type: 'SET_KGB_STATUS', payload: 'idle' });
  };

  const renderHistory = () => (
    <div className="mt-6 border-t border-zinc-800 pt-4 relative z-10 text-zinc-200 w-full">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-3">
        <span>Transaction History</span>
        <span>UTC+3</span>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {historyEntries.length === 0 ? (
          <div className="text-center text-xs text-zinc-500 py-8 border border-dashed border-zinc-700 rounded">
            No transactions recorded yet.
          </div>
        ) : (
          historyEntries.map((entry) => (
            <div
              key={`${entry.recordedAt}-${entry.data.cash}-${entry.data.reserves}`}
              className="bg-black/30 border border-zinc-700 rounded px-4 py-3 text-xs text-zinc-300 grid gap-2 sm:grid-cols-[1.2fr_1fr]"
            >
              <div className="font-mono text-[11px] text-zinc-400">
                {formatTimestamp(entry.recordedAt)}
              </div>
              <div className="flex flex-wrap gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Wallet size={12} />
                  {entry.data.cash.toLocaleString()} ₽
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Coins size={12} />
                  {entry.data.reserves.toLocaleString()} ₽
                </span>
                <span className="flex items-center gap-1 text-red-400">
                  <Scale size={12} />
                  {entry.data.debt.toLocaleString()} ₽
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (kgbStatus === 'idle') {
      return (
          <div className="flex flex-col h-full font-mono text-zinc-500 gap-4">
              <div className="flex flex-col items-center justify-center flex-1 gap-4">
                  <ShieldAlert size={64} className="opacity-20" />
                  <p>NO ACTIVE THREATS DETECTED.</p>
                  <p className="text-xs font-mono">Surveillance Systems: OPTIMAL</p>
              </div>
              {renderHistory()}
          </div>
      );
  }

  const isEmergency = kgbStatus === 'emergency';
  const isPostEmergency = kgbStatus === 'post_emergency';

  return (
    <div className={`flex flex-col h-full font-mono relative overflow-hidden ${isEmergency ? 'text-red-500' : 'text-zinc-300'}`}>
        
        {isEmergency && (
             <div className="absolute inset-0 z-0 bg-red-950/20 animate-pulse pointer-events-none"></div>
        )}

        {/* Content Container */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
              {kgbStatus === 'warning_mild' && (
                  <motion.div 
                      key="mild"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col h-full"
                  >
                      <div className="flex items-center gap-2 text-amber-500 mb-6 border-b border-amber-900/50 pb-2">
                          <Eye size={20} />
                          <span className="font-bold uppercase tracking-widest">Surveillance Report // #4092</span>
                      </div>

                      <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-4 text-sm leading-relaxed">
                          <p className="italic text-zinc-400">
                          "(Steve Cutts — Happiness). Я вижу ловушку. Я выбираю продолжать строить свой “коммунизм”, а не “реставрацию буржуазного строя” в угоду товарному фетишизму, навязанному господствующим классом."
                          </p>
                          <p>
                          При желании совершить трату я пересчитываю её стоимость в часах труда (прямо сейчас — 761 рубль/час из расчета “на руки” и 57 рублей/час из расчета “располагаемый доход”).
                          </p>
                          <div className="bg-amber-950/20 border-l-2 border-amber-600 p-3 mt-4">
                              <p className="text-amber-200">
                                  Если устраивает, записываю в заметку “Книга жалоб и предложений” и ставлю напоминание через 24 часа.
                              </p>
                          </div>
                      </div>

                      <div className="flex gap-4 mt-auto">
                          <button onClick={() => handleChoice('understood')} className="flex-1 py-3 border border-zinc-600 hover:bg-zinc-800 hover:text-white hover:border-zinc-400 transition-colors uppercase tracking-widest text-xs">
                              Understood
                          </button>
                          <button onClick={() => handleChoice('disagreed')} className="flex-1 py-3 border border-zinc-600 hover:bg-zinc-800 hover:text-white hover:border-zinc-400 transition-colors uppercase tracking-widest text-xs">
                              Disagreed
                          </button>
                      </div>
                  </motion.div>
              )}

              {kgbStatus === 'warning_grave' && (
                  <motion.div 
                      key="grave"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      className="flex flex-col h-full"
                  >
                       <div className="flex items-center gap-2 text-soviet-red mb-6 border-b border-red-900/50 pb-2">
                          <AlertTriangle size={20} />
                          <span className="font-bold uppercase tracking-widest">GRAVE WARNING // SECTOR 1</span>
                      </div>

                      <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-4 text-sm leading-relaxed">
                          <p className="font-bold text-red-200">
                          The Kremlin “Председатель Совета” (Эго) внимательно слушает голоса сомневающихся (письменно).
                          </p>
                          <p>
                          Затем Председатель проводит “воспитательную работу” (выше). Затем Совет коллективно ищет решение, устраивающее всех.
                          </p>
                          <p className="text-lg font-bold border-y border-red-900 py-4 my-4 text-center">
                          Свобода или эксплуатация? Нужда или фетишизм? “Великий чертеж” или симулякр?
                          </p>
                      </div>

                      <div className="flex gap-4 mt-auto">
                          <button onClick={() => handleChoice('understood')} className="flex-1 py-3 border border-zinc-600 hover:bg-zinc-800 hover:text-white hover:border-zinc-400 transition-colors uppercase tracking-widest text-xs">
                              Understood
                          </button>
                          <button onClick={() => handleChoice('disagreed')} className="flex-1 py-3 border border-zinc-600 hover:bg-zinc-800 hover:text-white hover:border-zinc-400 transition-colors uppercase tracking-widest text-xs">
                              Disagreed
                          </button>
                      </div>
                  </motion.div>
              )}

              {isEmergency && (
                  <motion.div
                      key="emergency"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col h-full items-center justify-center text-center space-y-8"
                  >
                      <AlertTriangle size={64} className="animate-bounce text-red-500" />
                      <h2 className="text-3xl font-bold uppercase tracking-tighter">Emergency Declared</h2>
                      <div className="text-6xl font-mono font-bold text-red-500 animate-pulse">
                          {timer}
                      </div>
                      <p className="max-w-xs text-red-300">
                          RESOURCES SEIZED FOR THE GREATER GOOD. RESISTANCE IS FUTILE.
                      </p>
                  </motion.div>
              )}

              {isPostEmergency && (
                  <motion.div
                      key="post"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col h-full items-center justify-center text-center space-y-6"
                  >
                      <RefreshCw size={48} className="text-zinc-500" />
                      <h2 className="text-xl font-bold uppercase">Order Restored</h2>
                      <p className="text-zinc-400 max-w-xs">
                          The state has stabilized. Return to your duties, comrade.
                      </p>
                      <button
                          onClick={handleReset}
                          className="px-8 py-3 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 uppercase tracking-widest text-xs"
                      >
                          Resume Operations
                      </button>
                  </motion.div>
              )}
          </AnimatePresence>
        </div>

        {renderHistory()}
    </div>
  );
};
