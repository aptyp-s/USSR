import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, Eye, RefreshCw } from 'lucide-react';

export const KGBModal: React.FC = () => {
  const { state, dispatch } = useGame();
  const { kgbStatus, pendingTransaction } = state;
  const [timer, setTimer] = useState(10);

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

  if (kgbStatus === 'idle') {
      return (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
              <ShieldAlert size={64} className="opacity-20" />
              <p>NO ACTIVE THREATS DETECTED.</p>
              <p className="text-xs font-mono">Surveillance Systems: OPTIMAL</p>
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
                        <button onClick={() => handleChoice('disagreed')} className="flex-1 py-3 border border-zinc-600 hover