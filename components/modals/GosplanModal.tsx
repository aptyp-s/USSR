
import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Wallet, Scale, ArrowLeftRight, Coins, ShieldAlert, Lock } from 'lucide-react';

type TransactionType = 'requisition' | 'supply';
type SupplyType = 'base' | 'bonus';

export const GosplanModal: React.FC = () => {
  const { state, dispatch } = useGame();
  
  // Get values from Global Settings
  const { monthlyIncome: income, monthlyWorkHours: hours } = state.settings;
  const { hasUnlockedReserves } = state;
  const hourlyRate = hours > 0 ? income / hours : 0;

  // Local State for Transaction
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>('requisition');
  const [supplyType, setSupplyType] = useState<SupplyType>('base');
  
  // Allocation Logic:
  // For Supply: 0 = 100% Cash/Reserve, 100 = 100% Debt
  // For Requisition: 0 = 100% Cash, 100 = 100% Reserves
  const [allocation, setAllocation] = useState(0); 
  
  const [stamp, setStamp] = useState<'APPROVED' | 'DENIED' | 'LIQUIDATED' | 'ALLOCATED' | null>(null);
  
  // Interception View State
  const [showInterception, setShowInterception] = useState(false);

  // Set default allocation based on supply type
  useEffect(() => {
    if (type === 'supply') {
        if (supplyType === 'base') setAllocation(0); 
        else setAllocation(50);
    } else {
        setAllocation(0); // Requisition defaults to Cash
    }
  }, [type, supplyType]);

  // Derived Values
  const numAmount = parseFloat(amount) || 0;
  
  // Requisition Logic
  const requisitionHours = hourlyRate > 0 ? numAmount / hourlyRate : 0;

  // Split Logic
  let cashPortion = 0;
  let reservePortion = 0; // Or Debt portion for Bonus supply

  if (type === 'requisition') {
      reservePortion = Math.floor(numAmount * (allocation / 100));
      cashPortion = numAmount - reservePortion;
  } else {
      // Supply Logic
      // For bonus, allocation maps to debt portion
      const debtPortion = Math.floor(numAmount * (allocation / 100));
      reservePortion = debtPortion; // reusing variable for generic logic in render
      cashPortion = numAmount - debtPortion;
  }

  // Bonus Stats
  const sovereigntyGain = state.resources.debt > 0 
    ? ((reservePortion / state.resources.debt) * 100).toFixed(2) // reservePortion here holds debt paydown amount
    : '100';
  const bonusHoursSaved = hourlyRate > 0 ? reservePortion / hourlyRate : 0;
    
  // Format helper
  const formatLifeCost = (h: number) => {
    if (h > 24) {
        const days = Math.floor(h / 24);
        const remHours = (h % 24).toFixed(1);
        return `${days} DAYS ${remHours} HOURS`;
    }
    return `${h.toFixed(1)} HOURS`;
  };

  const handleTransaction = () => {
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (type === 'requisition') {
        // Check if using reserves
        if (reservePortion > 0 && !showInterception) {
            setShowInterception(true);
            return;
        }

        // Logic check: sufficient funds
        if (state.resources.cash < cashPortion || state.resources.reserves < reservePortion) {
            setStamp('DENIED');
            setTimeout(() => setStamp(null), 2000);
            return;
        }

        if (cashPortion > 0) dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'cash', amount: -cashPortion } });
        if (reservePortion > 0) dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'reserves', amount: -reservePortion } });
        
        setStamp('APPROVED');

    } else {
        // Supply
        if (supplyType === 'base') {
            // Base Supply -> Adds to Cash (Reserves split if user wanted, but currently strict Cash)
            // If we enable slider for base, we follow that logic.
            // Currently using same slider logic for both supply types:
            const toReserves = numAmount - reservePortion; // Here reservePortion is effectively "To Debt"
            const toDebt = reservePortion;

            if (toReserves > 0) dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: supplyType === 'base' ? 'cash' : 'reserves', amount: toReserves } });
            if (toDebt > 0) dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'debt', amount: -toDebt } });
            
            setStamp('APPROVED');
        } else {
             // Bonus Supply
             // reservePortion variable is holding "debt portion" based on allocation logic above
             const toStash = numAmount - reservePortion; 
             const toDebt = reservePortion;

             if (toStash > 0) dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'reserves', amount: toStash } });
             if (toDebt > 0) dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'debt', amount: -toDebt } });

             if (allocation === 100) setStamp('LIQUIDATED');
             else if (allocation === 0) setStamp('APPROVED');
             else setStamp('ALLOCATED');
        }
    }

    if (showInterception) setShowInterception(false);
    setAmount('');
    setTimeout(() => setStamp(null), 2000);
  };

  const handleInterceptionChoice = (choice: 1 | 2 | 3) => {
      // Store the pending transaction details for option 2 and 3
      const transactionPayload = {
          cash: cashPortion,
          reserves: reservePortion,
          debt: 0
      };

      if (choice === 1) {
          // Yes, all clear
          handleTransaction();
          dispatch({ type: 'SET_RESERVE_UNLOCK', payload: false });
      } else if (choice === 2) {
          // Time to think - Mild Warning
          dispatch({ type: 'SET_PENDING_TRANSACTION', payload: transactionPayload });
          dispatch({ type: 'SET_KGB_STATUS', payload: 'warning_mild' });
          dispatch({ type: 'SELECT_BUILDING', payload: null });
          dispatch({ type: 'SET_RESERVE_UNLOCK', payload: true });
      } else if (choice === 3) {
          // Proceed anyway - Grave Warning
           dispatch({ type: 'SET_PENDING_TRANSACTION', payload: transactionPayload });
           dispatch({ type: 'SET_KGB_STATUS', payload: 'warning_grave' });
           dispatch({ type: 'SELECT_BUILDING', payload: null });
      }
  };

  // Render Interception Screen
  if (showInterception) {
      return (
          <div className="flex flex-col h-full gap-6 text-zinc-300 font-mono animate-in fade-in zoom-in duration-300 relative">
              <div className="absolute inset-0 bg-red-950/10 z-0 pointer-events-none"></div>
              
              <div className="bg-amber-950/30 border border-amber-700 p-4 flex items-center gap-4">
                  <ShieldAlert className="text-amber-500" size={32} />
                  <div>
                      <h3 className="font-bold text-amber-500 uppercase tracking-widest text-lg">Reserve Access Protocol</h3>
                      <p className="text-xs text-amber-200/70">Warning: You are attempting to withdraw from strategic reserves.</p>
                  </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                  <p className="text-lg">Does this expenditure align with the 5-Year Plan?</p>
                  
                  <div className="flex flex-col w-full gap-4 max-w-sm">
                      <button 
                        onClick={() => handleInterceptionChoice(2)}
                        className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold uppercase tracking-widest text-lg transition-all border border-zinc-600 hover:border-zinc-400"
                      >
                          I need time to think
                      </button>
                      
                      <div className="flex gap-4">
                          <button 
                            onClick={() => handleInterceptionChoice(1)}
                            disabled={!hasUnlockedReserves}
                            className={`flex-1 py-3 font-bold uppercase tracking-wider text-xs border transition-all flex items-center justify-center gap-2
                                ${hasUnlockedReserves 
                                    ? 'bg-emerald-900/20 text-emerald-500 border-emerald-800 hover:bg-emerald-900/40 hover:border-emerald-500 hover:text-emerald-400 cursor-pointer' 
                                    : 'bg-zinc-800/50 text-zinc-600 border-zinc-700 cursor-not-allowed'
                                }
                            `}
                          >
                              {!hasUnlockedReserves && <Lock size={12} />} Yes, all clear
                          </button>
                          <button 
                             onClick={() => handleInterceptionChoice(3)}
                             className="flex-1 py-3 bg-transparent border border-red-900 text-red-500 hover:bg-red-950/50 hover:text-red-400 font-bold uppercase tracking-wider text-xs transition-all"
                          >
                              No, proceed anyway
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full gap-6 text-zinc-300 font-mono relative">
      
      {/* Top Section: The Equation */}
      <div className="bg-black/40 border border-zinc-700 flex flex-col relative overflow-hidden group">
        <div className="bg-zinc-900/80 border-b border-zinc-800 px-3 py-1 flex justify-between items-center">
            <span className="text-soviet-gold text-[10px] uppercase tracking-widest font-bold">Sector_Value_Calculator</span>
            <div className="flex gap-1 items-center">
                 <span className="text-[9px] text-zinc-600 mr-1">LOCKED BY KREMLIN</span>
                 <Lock size={10} className="text-zinc-600" />
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] items-end gap-4 p-4 relative">
          {/* Subtle locked overlay */}
          <div className="absolute inset-0 bg-black/10 z-10 pointer-events-none"></div>

          <div>
              <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Monthly Disp. Income</label>
              <div className="flex items-center border-b border-zinc-700 pb-1">
                <span className="text-zinc-500 mr-2 font-sans">₽</span>
                <input 
                  type="number" 
                  value={income}
                  readOnly
                  className="bg-transparent w-full focus:outline-none font-mono font-bold text-xl text-soviet-gold opacity-80 cursor-not-allowed"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Monthly Work Hours</label>
              <div className="flex items-center border-b border-zinc-700 pb-1">
                <Calculator size={14} className="text-zinc-500 mr-2" />
                <input 
                  type="number" 
                  value={hours}
                  readOnly
                  className="bg-transparent w-full focus:outline-none font-mono font-bold text-xl text-soviet-gold opacity-80 cursor-not-allowed"
                />
              </div>
            </div>
          
          <div className="text-right bg-zinc-900/80 p-2 border border-zinc-800 min-w-[120px]">
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Calculated Rate</div>
            <div className="text-xl font-bold text-white leading-none">
              {hourlyRate.toFixed(0)} <span className="text-[10px] text-zinc-500 font-normal align-top">RUB/HR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: The Ledger */}
      <div className="flex-1 bg-zinc-900/30 border border-zinc-700 p-6 flex flex-col items-center justify-start relative">
        
        {/* Main Tabs */}
        <div className="flex gap-4 mb-6 w-full max-w-md">
          <button 
            onClick={() => setType('requisition')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest border transition-all ${
              type === 'requisition' 
                ? 'bg-zinc-800 border-soviet-red text-white shadow-[0_0_10px_rgba(208,0,0,0.2)]' 
                : 'border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900'
            }`}
          >
            Requisition
          </button>
          <button 
            onClick={() => setType('supply')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest border transition-all ${
              type === 'supply' 
                ? 'bg-zinc-800 border-soviet-red text-white shadow-[0_0_10px_rgba(208,0,0,0.2)]' 
                : 'border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900'
            }`}
          >
            Supply
          </button>
        </div>

        {/* Sub-Tabs for Supply */}
        {type === 'supply' && (
             <div className="flex gap-2 mb-6 w-full max-w-xs justify-center animate-in fade-in slide-in-from-top-2 duration-300">
                 <button 
                    onClick={() => setSupplyType('base')}
                    className={`px-4 py-1 text-xs uppercase tracking-wider border rounded-full transition-all ${
                        supplyType === 'base' ? 'bg-zinc-800 text-white border-zinc-500' : 'text-zinc-600 border-zinc-800 hover:border-zinc-600'
                    }`}
                 >
                     Base (Cash)
                 </button>
                 <button 
                    onClick={() => setSupplyType('bonus')}
                    className={`px-4 py-1 text-xs uppercase tracking-wider border rounded-full transition-all flex items-center gap-1 ${
                        supplyType === 'bonus' ? 'bg-zinc-800 text-white border-zinc-500' : 'text-zinc-600 border-zinc-800 hover:border-zinc-600'
                    }`}
                 >
                     Bonus
                 </button>
             </div>
        )}

        {/* Input Area */}
        <div className="w-full max-w-md relative mb-2">
           <label className="block text-xs text-center mb-2 text-zinc-500 uppercase tracking-widest">
             {type === 'requisition' ? 'Enter Expense Cost' : `Enter ${supplyType} Amount`}
           </label>
           <div className="relative group">
              <input 
                type="number" 
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/50 border-2 border-zinc-700 text-center text-4xl py-4 font-bold text-white focus:outline-none focus:border-soviet-gold transition-all"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">RUB</span>
           </div>
        </div>

        {/* Real-time Feedback Display */}
        <div className="w-full flex flex-col items-center justify-center mb-4 min-h-[120px]">
            {type === 'requisition' && numAmount > 0 && hourlyRate > 0 && (
                 <div className="text-center w-full animate-in fade-in zoom-in duration-200">
                    <div className="text-soviet-red font-bold text-3xl tracking-tighter drop-shadow-[0_0_8px_rgba(208,0,0,0.8)]">
                        COST: {formatLifeCost(requisitionHours)} OF LIFE
                    </div>
                 </div>
            )}
            
            {/* Unified Slider Control for both Requisition and Supply */}
            {(type === 'requisition' || (type === 'supply' && supplyType === 'bonus')) && (
               <div className="w-full max-w-md mx-auto mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-zinc-900/50 border border-zinc-700 p-4 rounded mb-2">
                        <div className="flex justify-between text-xs font-bold uppercase mb-2">
                            {type === 'requisition' ? (
                                <>
                                    <div className="text-emerald-400 flex items-center gap-1">
                                        <Wallet size={12}/> From Cash: {cashPortion.toLocaleString()}
                                    </div>
                                    <div className="text-amber-500 flex items-center gap-1">
                                        From Reserve: {reservePortion.toLocaleString()} <Coins size={12}/>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-amber-500 flex items-center gap-1">
                                        <Coins size={12}/> To Reserves: {(numAmount - reservePortion).toLocaleString()}
                                    </div>
                                    <div className="text-red-500 flex items-center gap-1">
                                        To Debt: {reservePortion.toLocaleString()} <Scale size={12}/>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="1"
                            value={allocation}
                            onChange={(e) => setAllocation(Number(e.target.value))}
                            className={`w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer hover:opacity-80 transition-all ${type === 'requisition' ? 'accent-emerald-500' : 'accent-amber-500'}`}
                        />
                        
                        <div className="flex justify-between text-[9px] text-zinc-500 mt-1 uppercase">
                            {type === 'requisition' ? (
                                <>
                                    <span>Cash</span>
                                    <span><ArrowLeftRight size={10} /></span>
                                    <span>Reserves</span>
                                </>
                            ) : (
                                <>
                                    <span>Reserves</span>
                                    <span><ArrowLeftRight size={10} /></span>
                                    <span>Debt</span>
                                </>
                            )}
                        </div>
                    </div>
                     
                    {/* Bonus specific stats */}
                    {type === 'supply' && supplyType === 'bonus' && (
                        <div className="flex gap-2">
                            <div className="flex-1 bg-amber-950/20 border border-amber-900/30 p-2 rounded text-center">
                                <div className="text-xl font-bold text-zinc-200">{bonusHoursSaved.toFixed(1)}</div>
                                <div className="text-[9px] text-zinc-500 uppercase">Hours Saved</div>
                            </div>
                            <div className="flex-1 bg-amber-950/20 border border-amber-900/30 p-2 rounded text-center">
                                <div className="text-xl font-bold text-amber-500">+{sovereigntyGain}%</div>
                                <div className="text-[9px] text-amber-500/70 uppercase">Sovereignty</div>
                            </div>
                        </div>
                    )}
               </div>
            )}
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md mt-auto">
             <button 
                onClick={handleTransaction}
                className="w-full py-4 bg-soviet-red hover:bg-red-700 text-white font-bold uppercase tracking-widest text-lg transition-all border border-transparent hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={!numAmount}
             >
                {type === 'requisition' && "Authorize Requisition"}
                {type === 'supply' && supplyType === 'base' && "Log Standard Income"}
                {type === 'supply' && supplyType === 'bonus' && <><Scale size={20} />CONFIRM MY CHOICES</>}
             </button>
        </div>

        {/* Animated Stamp */}
        <AnimatePresence>
            {stamp && (
                <motion.div 
                    initial={{ scale: 2, opacity: 0, rotate: 0 }}
                    animate={{ scale: 1, opacity: 1, rotate: -12 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    className={`absolute inset-0 flex items-center justify-center pointer-events-none z-50 mix-blend-hard-light`}
                >
                    <div className={`
                        border-4 border-double p-4 text-4xl font-black uppercase tracking-widest -rotate-12 mask-image-grunge whitespace-nowrap
                        ${stamp === 'APPROVED' ? 'text-green-500 border-green-500' : ''}
                        ${stamp === 'DENIED' ? 'text-soviet-red border-soviet-red' : ''}
                        ${stamp === 'LIQUIDATED' ? 'text-amber-500 border-amber-500' : ''}
                        ${stamp === 'ALLOCATED' ? 'text-blue-400 border-blue-400' : ''}
                    `}>
                        {stamp}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
};
